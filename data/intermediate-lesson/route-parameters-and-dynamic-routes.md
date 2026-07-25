title: "Route Parameters & Dynamic Routes"
level: "intermediate"
estimatedTime: 45
tags:
* angular
* angular-router
* routing
* standalone-components
* signals
* typescript

---

## Learning Objectives

By the end of this lesson, you will be able to:

- Define dynamic routes using route parameters (`:id`) in a standalone Angular application.
- Read route parameters using the modern **component input binding** approach, and understand the classic `ActivatedRoute` observable/snapshot approach it replaces.
- Explain the difference between **route parameters**, **query parameters**, and when to use each.
- React correctly to parameter changes when Angular **reuses** a component instance across navigations (avoiding stale data bugs).
- Build multi-segment and nested dynamic routes, and apply best practices like type transforms and fallback handling for invalid parameters.

---

## Why This Concept Exists

Most real applications aren't a handful of static pages — they're built around **resources**: a product, a user, an order, a blog post. You don't want a hardcoded route for every single product in your catalog. Instead, you want *one* route template — `/products/:id` — that can represent thousands of different products, where `:id` is filled in at navigation time.

This is the problem **route parameters** solve. They let a single route definition:

- Match a whole family of URLs (`/products/42`, `/products/99`, `/products/abc-shoes`).
- Extract the dynamic part of the URL (`42`, `99`, `abc-shoes`) so your component can use it to fetch and display the right data.
- Produce URLs that are **shareable, bookmarkable, and SEO-friendly**, because the identifier lives directly in the path instead of in memory or a hidden app state.

Without route parameters, you'd have to manually parse `window.location`, invent your own URL scheme, and re-implement browser history handling — exactly the kind of repetitive, error-prone work the Angular Router is designed to eliminate.

---

## Concept Explanation

### 1. What a route parameter is

A route parameter is a **named, dynamic segment** of a path, declared in your route configuration with a colon prefix:

```typescript
{ path: 'products/:id', component: ProductDetailComponent }
```

Here, `:id` is a placeholder. It matches *any* value in that URL segment: `/products/42`, `/products/laptop-x1`, etc. The Router extracts whatever was typed in that segment and makes it available to your component as a string.

### 2. Route params vs. query params vs. matrix params

Angular actually supports three different ways to pass dynamic data through a URL, and picking the right one matters:

| Type | Example URL | Purpose |
|---|---|---|
| **Route parameter** | `/products/42` | Identifies **which resource** you're looking at. Required for the route to match. |
| **Query parameter** | `/products?sort=price&page=2` | Optional **state/context** — filters, sorting, pagination. Doesn't change which route matches. |
| **Matrix parameter** | `/products;color=red` | Rarely used; scopes parameters to one specific path segment rather than the whole URL. |

A good rule of thumb: **if removing the value would mean you're looking at a fundamentally different thing, it's a route param. If removing it just changes how the same thing is displayed, it's a query param.**

### 3. Reading route parameters — two approaches

**Approach A (recommended, modern): Component Input Binding.**
Since Angular v16, the router can bind route parameters directly to component `@Input()` properties or signal `input()`s, with zero manual subscription code. You opt in once, globally:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ],
};
```

Then any route param whose name matches an input property is populated automatically:

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-product-detail',
  template: `<h1>Product #{{ id() }}</h1>`,
})
export class ProductDetailComponent {
  id = input.required<string>(); // filled with the ":id" route param
}
```

This is the recommended default for new Angular code: it's declarative, works naturally with signals, requires no `OnInit`/subscription boilerplate, and updates automatically if the param changes while the component stays mounted.

**Approach B (classic, still important to know): `ActivatedRoute`.**
`ActivatedRoute` is an injectable service that holds everything the router knows about the currently activated route — including its parameters, as a **snapshot** (a static read at one point in time) or as **observables** (a live stream that emits again whenever the value changes).

```typescript
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({ selector: 'app-product-detail', template: `<h1>Product #{{ id }}</h1>` })
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);

  // One-time read — only correct if the component is destroyed/recreated on every navigation
  id = this.route.snapshot.paramMap.get('id');
}
```

You still need `ActivatedRoute` for things input binding doesn't cover directly — like reactive pipelines that trigger an HTTP call whenever a param changes (shown in Example 2), or reading `data`/`title` from a route resolver.

### 4. Why "component reuse" matters

By default, if you navigate from `/products/1` to `/products/2`, Angular **does not destroy and recreate** `ProductDetailComponent` — it's the same route definition, so the *same component instance* is reused, and only the parameter changes underneath it. This means `ngOnInit()` will **not** run again, so code that reads the param only in `ngOnInit()` (via snapshot) will show stale data. This is the single most common bug with dynamic routes, and it's why reactive reading (input binding, `paramMap` observable, or `toSignal`) is preferred over a one-time snapshot read.

### 5. Multiple and nested parameters

A path can contain more than one dynamic segment:

```typescript
{ path: 'users/:userId/posts/:postId', component: UserPostComponent }
```

Both `userId` and `postId` are extracted independently and can both be bound as separate inputs.

---

## Key Terminology

- **Route parameter** — A named, dynamic segment in a route's `path`, declared with a colon (e.g. `:id`). Required for the route to match.
- **Dynamic route** — A route definition that uses one or more parameters to match a family of URLs instead of one fixed path.
- **Query parameter** — An optional `key=value` pair appended after `?` in the URL; doesn't affect route matching.
- **`ActivatedRoute`** — An injectable service exposing everything about the route currently loaded in an outlet (params, query params, data, snapshot, etc.).
- **`ParamMap` / `paramMap`** — A `Map`-like, immutable object with `get(key)` and `has(key)` methods for reading a route's parameters; the recommended way to read params (over the plain `params` object) because it handles missing keys safely.
- **Snapshot** — A static, one-time read of route state (`route.snapshot`). Correct only when the component is guaranteed to be recreated on every navigation to that route.
- **`withComponentInputBinding()`** — A `provideRouter` feature that automatically maps route/query params (and resolved data) onto matching component inputs.
- **Wildcard route** — A route with `path: '**'`, used to catch unmatched URLs (commonly a "Page Not Found" component).

---

## Syntax Overview

```typescript
// 1. Declaring a route parameter
{ path: 'products/:id', component: ProductDetailComponent }

// 2. Declaring multiple parameters
{ path: 'users/:userId/posts/:postId', component: UserPostComponent }

// 3. Enabling automatic input binding (once, at bootstrap)
provideRouter(routes, withComponentInputBinding())

// 4. Receiving a param as a signal input (recommended)
id = input.required<string>();

// 5. Reading a param imperatively via ActivatedRoute
private route = inject(ActivatedRoute);
this.route.snapshot.paramMap.get('id');       // one-time
this.route.paramMap.subscribe(map => ...);    // reactive

// 6. Reading query parameters (same pattern, different property)
this.route.queryParamMap.get('sort');

// 7. Linking to a dynamic route in a template
<a [routerLink]="['/products', product.id]">{{ product.name }}</a>

// 8. Navigating to a dynamic route in TypeScript
this.router.navigate(['/products', productId]);
```

---

## Real World Analogy

Think of a dynamic route like a **hotel room number system**. The route `path: 'rooms/:roomNumber'` is the *floor plan template* — it's the same physical layout of "reception desk → hallway → room door" for every guest. The `:roomNumber` is the specific number on the door — `204`, `518`, `1010`. The floor plan (component) doesn't change; only the room number (parameter) does, and that number tells the front desk (the Router) and the room service staff (your component) exactly which guest's information to pull up. You don't design a brand-new hotel for every guest — you design *one* reusable layout that reads a dynamic value to know who's inside right now.

---

## Examples

### Example 1 — Basic: Product list → Product detail with Component Input Binding

This is the minimal, modern setup: a list page links to a detail page whose route contains an `:id` parameter, and the id flows automatically into a signal input.

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list.component';
import { ProductDetailComponent } from './product-detail.component';

export const routes: Routes = [
  { path: 'products', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailComponent },
];
```

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // withComponentInputBinding() is what makes step "product-detail.component.ts" work below
    provideRouter(routes, withComponentInputBinding()),
  ],
};
```

```typescript
// product-list.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Product {
  id: string;
  name: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h2>Products</h2>
    <ul>
      @for (product of products; track product.id) {
        <li>
          <!-- The link parameters array builds "/products/:id" for each product -->
          <a [routerLink]="['/products', product.id]">{{ product.name }}</a>
        </li>
      }
    </ul>
  `,
})
export class ProductListComponent {
  products: Product[] = [
    { id: '1', name: 'Wireless Mouse' },
    { id: '2', name: 'Mechanical Keyboard' },
    { id: '3', name: 'USB-C Hub' },
  ];
}
```

```typescript
// product-detail.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  template: `
    <h2>Product Detail</h2>
    <p>You are viewing product with id: <strong>{{ id() }}</strong></p>
  `,
})
export class ProductDetailComponent {
  // "id" matches the ":id" segment in "products/:id" — Angular fills this in automatically
  id = input.required<string>();
}
```

**Explanation:** because `withComponentInputBinding()` is enabled, the Router matches `id` (an input name) against `id` (the route parameter name defined in the path) and assigns it — no `ActivatedRoute` injection, no subscription, no `ngOnInit`. This is the recommended starting point for any new dynamic route.

---

### Example 2 — Real-World: Reactive data fetching driven by a changing parameter

Static display is easy, but real apps usually need to **fetch data from a service whenever the parameter changes** — including when navigating directly from `/users/1` to `/users/2` where the component is reused. This example shows the classic reactive `ActivatedRoute` pattern, which is still the right tool when a param change should trigger a new asynchronous operation with proper cancellation.

```typescript
// user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
```

```typescript
// user-profile.component.ts
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: `
    @if (user(); as u) {
      <h2>{{ u.name }}</h2>
      <p>{{ u.email }}</p>
    } @else {
      <p>Loading user...</p>
    }
  `,
})
export class UserProfileComponent {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  // switchMap cancels the previous HTTP request if the param changes again quickly,
  // preventing a "race condition" where an old response overwrites a newer one.
  user = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.userService.getUser(params.get('id')!)),
    ),
  );
}
```

**Explanation:** `route.paramMap` is an **observable**, so it emits every time the `:id` segment changes — even if `UserProfileComponent` is reused rather than recreated. `switchMap` re-triggers `getUser()` on every emission and cancels any in-flight previous request. `toSignal()` converts the resulting observable into a signal so the template can read it with `user()`. This pattern is preferable to input binding whenever a param change needs to *do* something (an HTTP call) rather than just *display* something.

---

### Example 3 — Best Practice: Typed, validated multi-parameter route

Production apps should never blindly trust that a URL segment is well-formed. This example combines **component input binding**, an automatic **type transform** (string → number), and a **guard against invalid values**, using a nested category/product route.

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { CatalogProductComponent } from './catalog-product.component';
import { NotFoundComponent } from './not-found.component';

export const routes: Routes = [
  { path: 'catalog/:categoryId/product/:productId', component: CatalogProductComponent },
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', redirectTo: 'not-found' }, // catches any unmatched URL
];
```

```typescript
// catalog-product.component.ts
import { Component, input, numberAttribute, effect, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-catalog-product',
  standalone: true,
  template: `
    @if (!invalid()) {
      <h2>Category {{ categoryId() }} — Product #{{ productId() }}</h2>
    }
  `,
})
export class CatalogProductComponent {
  // The route always sends strings; "transform" converts "42" -> 42 automatically.
  // If conversion fails, numberAttribute yields NaN, which we detect below.
  categoryId = input.required<string>();
  productId = input(0, { transform: numberAttribute });

  invalid = signal(false);
  private router = inject(Router);

  constructor() {
    // Reacts every time productId() changes (e.g. navigating between sibling products)
    effect(() => {
      if (Number.isNaN(this.productId())) {
        this.invalid.set(true);
        this.router.navigate(['/not-found']);
      }
    });
  }
}
```

**Explanation:** `numberAttribute` is a built-in Angular transform that converts the incoming string route parameter into a `number`, so `productId()` is genuinely typed as `number` rather than `string` — eliminating a whole class of `"3" !== 3` bugs. The `effect()` reacts every time the transformed value changes and redirects to a friendly fallback route if the URL contained something non-numeric (e.g. `/catalog/5/product/abc`). This is the recommended pattern for production routes: **never assume a URL segment is valid — validate and provide a fallback.**

---

## Common Mistakes

1. **Assuming route params are already the right type.** Route parameters are *always strings*, even if the URL looks numeric (`"42"`, not `42`). Comparing `id === 42` will silently fail. Use a transform (`numberAttribute`) or explicit `Number(id)` conversion.
2. **Reading params only in `ngOnInit()` via `snapshot`.** If the component is reused across navigations (e.g. `/products/1` → `/products/2`), `ngOnInit()` won't fire again and the snapshot value goes stale. Use `paramMap` (observable), `toSignal`, or component input binding instead.
3. **Forgetting to enable `withComponentInputBinding()`.** Without it in `provideRouter(...)`, `input()`/`@Input()` properties matching a param name simply stay `undefined` — a very common source of confusion for developers following newer tutorials on an older setup.
4. **Mixing up route params and query params.** Putting filter/sort/pagination state into the path (`/products/sort-price`) breaks the ability to have one canonical "product" URL and complicates matching. Keep identity in the path, context in the query string.
5. **Not handling invalid or missing parameters.** A URL is just text a user (or a bad link) can type freely — always guard against unexpected values (`NaN`, empty strings) rather than assuming the app's own links are the only way in.
6. **Manually subscribing without cleanup.** `this.route.paramMap.subscribe(...)` without unsubscribing can create duplicate work over a long-lived component's life. Prefer the `async` pipe, `toSignal()`, or input binding, which handle cleanup for you.

---

## Best Practices

- **Default to `withComponentInputBinding()` + signal `input()`** for reading route params — it's declarative, less code, and integrates naturally with Angular's signal-based reactivity model.
- **Use `paramMap`/`queryParamMap`**, not the raw `params`/`queryParams` objects — the map API (`get`, `has`) is safer when a key might be absent.
- **Use route params for resource identity, query params for optional view state** (filters, sorting, pagination, tabs).
- **Use `switchMap`** (or an equivalent cancellation-aware pattern) whenever a parameter change should trigger a new asynchronous request, so stale responses can't overwrite fresh ones.
- **Validate and transform parameters early** — convert types at the boundary (`numberAttribute`, custom transforms) rather than scattering `Number(...)` calls throughout the component.
- **Provide a fallback route** (`path: '**'`) for unmatched or invalid dynamic segments instead of letting the app crash or show a blank page.
- **Prefer the link parameters array** (`[routerLink]="['/products', id]"`) over manually concatenating strings — it correctly escapes values and stays in sync with route structure changes.
- **Keep route configuration in a dedicated `*.routes.ts` file** per feature, and lazy-load it with `loadChildren`/`loadComponent` so dynamic sections of the app are code-split.

---

## Summary

- Route parameters are dynamic, named URL segments (`:id`) that let one route definition match many URLs.
- They're declared in the route's `path` and are always delivered to your code as strings.
- The modern, recommended way to read them is **component input binding**, enabled once via `provideRouter(routes, withComponentInputBinding())`.
- `ActivatedRoute` (with `paramMap` as an observable or `snapshot` for a one-time read) remains essential for reactive data-fetching pipelines.
- Angular **reuses** component instances across navigations to the same route definition, so param-dependent logic must react to changes rather than reading them only once.
- Route params identify **which resource** you're viewing; query params carry **optional contextual state** like filters or pagination.
- Always validate and, where useful, transform parameters (e.g., string → number) instead of trusting the raw URL text.
- Provide a wildcard (`**`) fallback route to gracefully handle invalid or unmatched dynamic segments.

---

## Flash Cards

**Q: What is a route parameter in Angular?**
A: A dynamic, named segment of a route's path, declared with a colon prefix (e.g. `:id`), that lets one route definition match a family of URLs and expose the matched value to a component.

**Q: How do you read route parameters without manually injecting `ActivatedRoute`?**
A: Enable `withComponentInputBinding()` in `provideRouter(...)`, then declare a component `input()` (or `@Input()`) whose name matches the route parameter name — Angular assigns the value automatically.

**Q: What's the key difference between a route parameter and a query parameter?**
A: A route parameter identifies which resource is being viewed and is part of the path used to match the route; a query parameter is optional contextual state (filters, sorting, pagination) appended after `?` and doesn't affect which route matches.

**Q: Why can reading a route param only in `ngOnInit()` via `snapshot` cause bugs?**
A: Because Angular reuses the same component instance when navigating between sibling routes that match the same route definition (e.g. `/products/1` → `/products/2`), so `ngOnInit()` doesn't re-run and the snapshot value becomes stale.

**Q: Why is `paramMap` generally preferred over the plain `params` object?**
A: `paramMap` provides a `Map`-like API (`get()`, `has()`) that safely handles missing keys and stays consistent whether you're reading it as a snapshot or as an observable stream.

---

## Exercises

**1. Easy — Basic dynamic route**
Create a route `employees/:id` and an `EmployeeDetailComponent` that displays the employee id on screen. Use `withComponentInputBinding()` and a signal `input()` — no `ActivatedRoute` injection allowed.

**2. Medium — Reactive fetching with query params**
Build a `CategoryProductsComponent` mapped to `catalog/:categoryId`, that also reads an optional `?sort=` query parameter. Whenever either the category id *or* the sort query param changes, re-fetch the product list from a mock service using `switchMap` so previous in-flight requests are cancelled. Display a loading state while the fetch is in progress.

**3. Challenging — Nested master-detail with validation**
Build a nested routing structure: `orders` (list) and `orders/:orderId/items/:itemId` (a specific line item within an order). The child component should be able to read the parent's `orderId` as well as its own `itemId`. Validate that `itemId` is numeric using a transform; if it isn't, redirect to a `not-found` route. Bonus: add a wildcard route so any unmatched URL also lands on `not-found`.

---

## Further Reading

- [Define routes — Angular](https://angular.dev/guide/routing/define-routes) — how to declare routes, including parameterized paths and wildcard routes.
- [Read route state — Angular](https://angular.dev/guide/routing/read-route-state) — snapshots vs. observables, `ActivatedRoute`, and route parameters in depth.
- [Common routing tasks — Angular](https://angular.dev/guide/routing/common-router-tasks) — practical recipes, including component input binding for route data.
- [Navigate to routes — Angular](https://angular.dev/guide/routing/navigate-to-routes) — `RouterLink`, the link parameters array, and programmatic navigation.
- [Angular Router overview — Angular](https://angular.dev/guide/routing) — the full routing guide index, including guards, resolvers, and lazy loading.

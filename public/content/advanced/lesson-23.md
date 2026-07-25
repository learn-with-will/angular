---
id: lesson-23
slug: advanced-routing-guards-resolvers
title: "Advanced Routing: Guards & Resolvers"
level: advanced
order: 21
duration: 55
tags:
  - routing
  - guards
  - resolvers
  - angular-router
  - standalone-components
---

## Learning Objectives

By the end of this lesson you will be able to:

- Explain what route guards and resolvers do and where each one fits in Angular's navigation lifecycle.
- Write functional guards (`CanActivateFn`, `CanActivateChildFn`, `CanDeactivateFn`, `CanMatchFn`) using `inject()`.
- Write a functional `ResolveFn` that pre-fetches data before a route activates, including error handling.
- Bind resolved route data directly to component inputs with `withComponentInputBinding()`.
- Combine guards and resolvers on the same route to build realistic auth, unsaved-changes, and feature-flag scenarios.

## Why This Concept Exists

The Angular Router's basic job is simple: match a URL to a component. But real applications need more control over *when* and *how* that match is allowed to happen:

- **Some routes should not be visible to everyone.** An `/admin` section shouldn't render for a logged-out user.
- **Some routes shouldn't be left carelessly.** A user editing a long form shouldn't lose their work because they accidentally clicked a link.
- **Some routes should only exist under certain conditions.** A beta feature might only be reachable behind a feature flag, or an app might want to serve two different components for the same path (A/B testing).
- **Some components shouldn't render before their data exists.** Without a way to delay activation, components have to render empty, then show a spinner, then re-render once data arrives — extra complexity and flicker for something the router can handle up front.

**Guards** solve the first three problems by intercepting navigation and deciding whether it should continue, be blocked, or be redirected. **Resolvers** solve the fourth problem by fetching data *before* the route activates, so the component receives fully-formed data on its very first render.

## Concept Explanation

### The navigation lifecycle, in order

When the router processes a navigation, it works through the route tree from parent to child, roughly in this order:

1. **Route matching** — the router looks for a route config whose `path` matches the URL. If the route (or its ancestors) defines `canMatch` guards, they run here. If a `canMatch` guard rejects a route, the router doesn't block navigation — it simply tries the *next* route definition with the same path, if one exists.
2. **Activation guards** — for the matched route hierarchy, `canActivateChild` guards (inherited from parent routes) and `canActivate` guards (on the route itself) run, parent to child. Guards inside a single route's array run in the order they're listed; if one guard blocks or redirects, the remaining guards for that navigation don't need to run.
3. **Deactivation guards** — if the navigation is leaving a currently-active route, that route's `canDeactivate` guards run to confirm it's safe to leave.
4. **Resolvers** — once every relevant guard has succeeded, `resolve` functions run, parent to child. A child resolver can read data already produced by a parent resolver.
5. **Activation** — the component is created (or reused) and rendered, with resolved data already available.

### Functional guards and resolvers (the modern approach)

Older Angular code guards routes with classes that implement interfaces like `CanActivate`. Modern Angular favors **functional guards and resolvers**: plain functions typed as `CanActivateFn`, `CanActivateChildFn`, `CanDeactivateFn`, `CanMatchFn`, or `ResolveFn<T>`, which use the `inject()` function to pull in services. They're shorter, easier to compose, and don't require registering a class as an `@Injectable`. The Angular team recommends this style, and `ng generate guard` produces a functional guard by default. Class-based guards still work (they were restored for backward compatibility after briefly being marked deprecated), but there's no reason to reach for them in new code.

### Shared guard return types

Every guard type accepts the same set of return values, synchronously or wrapped in a `Promise`/`Observable` (the router unwraps the first emitted value and unsubscribes):

| Return value | Effect |
|---|---|
| `true` | Allow the navigation step to proceed |
| `false` | Block it (for `canMatch`, this means "try the next matching route" instead of blocking entirely) |
| `UrlTree` | Cancel this navigation and redirect to the returned tree |
| `RedirectCommand` | Same as `UrlTree`, with extra navigation options (e.g. `skipLocationChange`) |

### Resolvers

A resolver is a function typed `ResolveFn<T>`. It receives the same `ActivatedRouteSnapshot` and `RouterStateSnapshot` guards receive, and it can return `T`, a `RedirectCommand`, or a `Promise`/`Observable` of either. The router waits for the resolver to complete before finishing activation — which is powerful, but also means a slow or hanging resolver delays the whole navigation. Keep resolvers focused on the data a page truly needs to render immediately.

## Key Terminology

- **Route guard** — a function that decides whether a navigation step (entering, entering a subtree, leaving, or matching) is allowed to proceed.
- **Resolver** — a function that fetches data before a route finishes activating, so the component has that data on first render.
- **`ActivatedRouteSnapshot`** — a read-only snapshot of a route's state (params, query params, data) at a point in time; passed into guards and resolvers.
- **`RouterStateSnapshot`** — a snapshot of the entire router state tree for a given navigation, including the target URL.
- **`UrlTree`** — the router's structured, in-memory representation of a URL, used to describe redirects.
- **`RedirectCommand`** — a wrapper around a `UrlTree` that also lets you pass extra navigation options when redirecting from a guard or resolver.
- **`MaybeAsync<T>`** — shorthand for "`T`, or a `Promise<T>`, or an `Observable<T>`"; describes what guards and resolvers are allowed to return.
- **`inject()`** — the function used inside functional guards/resolvers (and elsewhere) to retrieve a dependency from Angular's injector without a constructor.
- **`withComponentInputBinding()`** — a `provideRouter` feature that automatically binds route params, query params, route data, and resolved data to matching component inputs.
- **`withNavigationErrorHandler()`** — a `provideRouter` feature for centralizing error handling for failed navigations, including resolver errors.

## Syntax Overview

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],             // Can the user enter this route?
    canActivateChild: [roleGuard],        // Applies to every child route below this one
    canDeactivate: [unsavedChangesGuard], // Can the user leave the currently active route?
    canMatch: [featureFlagGuard],         // Should this route config even be considered a match?
    resolve: { data: dataResolver },      // Fetch data before activating
  },
];
```

Each guard/resolver type has its own function signature:

```typescript
import type {
  CanActivateFn, CanActivateChildFn, CanDeactivateFn, CanMatchFn, ResolveFn,
  ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment,
} from '@angular/router';

const canActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => true;

const canActivateChild: CanActivateChildFn = (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => true;

// The generic <T> is the component type, so `component` is strongly typed.
const canDeactivate: CanDeactivateFn<MyComponent> = (component, currentRoute, currentState, nextState) => true;

// route/segments describe the URL being matched, not yet an activated route.
const canMatch: CanMatchFn = (route: Route, segments: UrlSegment[]) => true;

const resolve: ResolveFn<MyData> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => ({} as MyData);
```

Registering the feature that makes resolved data flow into component inputs:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

bootstrapApplication(App, {
  providers: [provideRouter(routes, withComponentInputBinding())],
});
```

## Real World Analogy

Think of a route as a flight, and the URL as its gate.

- **`canActivate`** is the security checkpoint at the terminal entrance: it checks your ticket and ID before letting you anywhere near the gates.
- **`canActivateChild`** is like an entire terminal that requires a passport check at its entrance — pass that one check, and it covers every gate inside, no matter how deep.
- **`canMatch`** is a fork in the terminal: passengers with priority boarding get routed down one corridor to an express gate, while everyone else is quietly routed down the ordinary corridor to a different gate for the *same* flight number. Nobody gets turned away — they just end up at a different (but valid) gate.
- **`canDeactivate`** is the gate agent stopping you as you try to leave the boarding area: "Are you sure? You haven't picked a seat yet." It's your last chance to confirm before you go.
- **A resolver** is the check-in counter: it prints your boarding pass and tags your luggage *before* you reach the gate, so there's no waiting around once you arrive — everything you need is already in hand.

## Examples

### 1. Basic Example — Protecting a route with `canActivate`

A minimal, standalone-component setup where only authenticated users can reach `/dashboard`.

```typescript
// auth.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // In a real app this would reflect a stored/refreshed auth token.
  private readonly _isAuthenticated = signal(false);
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  login(): void {
    this._isAuthenticated.set(true);
  }

  logout(): void {
    this._isAuthenticated.set(false);
  }
}
```

```typescript
// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect via a UrlTree instead of calling router.navigate() and
  // returning false — this is the recommended pattern because it lets
  // the router treat the redirect as part of the same navigation cycle.
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
```

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
```

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [provideRouter(routes)],
});
```

**Why this works:** `authGuard` is a plain function, injected with the services it needs. If the user isn't authenticated, it returns a `UrlTree` describing the login page — the router redirects automatically, no manual `navigate()` call required.

### 2. Real-World Example — Auth guard + unsaved-changes guard + resolver together

An "edit order" screen that (a) requires login, (b) warns before leaving with unsaved changes, and (c) pre-loads the order so the form never renders empty. Resolved data is bound straight to a component input via `withComponentInputBinding()`.

```typescript
// order.model.ts
export interface Order {
  id: string;
  customerName: string;
  total: number;
}
```

```typescript
// order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${id}`);
  }
}
```

```typescript
// order.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, RedirectCommand, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { OrderService } from './order.service';
import { Order } from './order.model';

export const orderResolver: ResolveFn<Order | RedirectCommand> = (route) => {
  const orderService = inject(OrderService);
  const router = inject(Router);
  const orderId = route.paramMap.get('id')!;

  return orderService.getOrder(orderId).pipe(
    catchError((error) => {
      console.error(`Failed to load order ${orderId}`, error);
      // Handle the failure here instead of letting it surface as an
      // unhandled NavigationError — redirect back to a safe route.
      return of(new RedirectCommand(router.parseUrl('/orders')));
    }),
  );
};
```

```typescript
// can-leave-edit.guard.ts
import { CanDeactivateFn } from '@angular/router';
import { OrderEdit } from './order-edit';

export const canLeaveEditGuard: CanDeactivateFn<OrderEdit> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  // A native confirm() is fine for a quick example. In production,
  // prefer a custom dialog service so the prompt matches your UI
  // (see Common Mistakes below).
  return confirm('You have unsaved changes. Leave without saving?');
};
```

```typescript
// order-edit.ts
import { Component, input, signal } from '@angular/core';
import { Order } from './order.model';

@Component({
  selector: 'app-order-edit',
  template: `
    <h1>Editing order {{ order().id }}</h1>
    <label>
      Customer name
      <input [value]="order().customerName" (input)="markDirty()" />
    </label>
  `,
})
export class OrderEdit {
  // Populated automatically from the resolver's "order" key because
  // withComponentInputBinding() is enabled below — no ActivatedRoute
  // injection required.
  order = input.required<Order>();

  private dirty = signal(false);

  markDirty(): void {
    this.dirty.set(true);
  }

  hasUnsavedChanges(): boolean {
    return this.dirty();
  }
}
```

```typescript
// app.routes.ts (excerpt)
import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { orderResolver } from './order.resolver';
import { canLeaveEditGuard } from './can-leave-edit.guard';
import { OrderEdit } from './order-edit';

export const routes: Routes = [
  {
    path: 'orders/:id/edit',
    component: OrderEdit,
    canActivate: [authGuard],
    canDeactivate: [canLeaveEditGuard],
    resolve: { order: orderResolver },
  },
];
```

```typescript
// main.ts (excerpt)
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes, withComponentInputBinding()),
  ],
});
```

**Why this works:** the guard runs first and can redirect before any network request happens. Once it passes, the resolver fetches the order and handles failure itself. Only after both succeed does `OrderEdit` render — already populated, with no loading flicker. `canDeactivate` then protects the user's edits on the way out.

### 3. Best-Practice Example — Reusable guards, `canMatch` fallback routes, centralized error handling

This example shows parameterized guard *factories* (functions that return a guard), `canMatch` picking between two components for the same path, and one place to handle every navigation error.

```typescript
// feature-flag.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags = signal<Record<string, boolean>>({ newDashboard: false });

  isEnabled(flag: string): boolean {
    return this.flags()[flag] ?? false;
  }
}
```

```typescript
// feature-match.guard.ts
import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { FeatureFlagService } from './feature-flag.service';

// A guard *factory*: call it with a flag name and get back a ready-to-use
// CanMatchFn. This avoids duplicating near-identical guards per flag.
export function featureFlagMatchGuard(flagName: string): CanMatchFn {
  return () => {
    const flags = inject(FeatureFlagService);
    // Returning false here does NOT block navigation — the router just
    // tries the next route definition that matches the same path.
    return flags.isEnabled(flagName);
  };
}
```

```typescript
// role.guard.ts
import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Another factory, reusable for any required role, applied once to an
// entire route subtree via canActivateChild.
export function roleGuard(requiredRole: string): CanActivateChildFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.hasRole(requiredRole) ? true : router.createUrlTree(['/forbidden']);
  };
}
```

```typescript
// app.routes.ts (excerpt)
import { Routes } from '@angular/router';
import { featureFlagMatchGuard } from './feature-match.guard';
import { roleGuard } from './role.guard';

export const routes: Routes = [
  // Two entries for the SAME path. Whichever canMatch guard succeeds
  // first "wins" — this is how Angular supports gradual rollouts and
  // A/B tests without branching logic inside a component.
  {
    path: 'dashboard',
    canMatch: [featureFlagMatchGuard('newDashboard')],
    loadComponent: () => import('./dashboard/new-dashboard').then((m) => m.NewDashboard),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },

  // canActivateChild applies one guard to an entire subtree at once.
  {
    path: 'admin',
    canActivateChild: [roleGuard('admin')],
    children: [
      { path: 'users', loadComponent: () => import('./admin/users').then((m) => m.AdminUsers) },
      { path: 'audit-log', loadComponent: () => import('./admin/audit-log').then((m) => m.AuditLog) },
    ],
  },
];
```

```typescript
// main.ts (excerpt) — one place to handle every failed navigation,
// including resolver errors that weren't already handled locally.
import { bootstrapApplication } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, withNavigationErrorHandler, Router } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withNavigationErrorHandler((error) => {
        const router = inject(Router);
        console.error('Navigation failed:', error?.message);
        router.navigate(['/error']);
      }),
    ),
  ],
});
```

**Why this is best practice:** the guards are small, reusable, and testable in isolation from any specific route. `canMatch` cleanly expresses "try this route, otherwise fall back," instead of putting `if (flag) {...} else {...}` inside a component. `withNavigationErrorHandler()` means individual resolvers don't all need to duplicate the same `catchError` boilerplate.

## Common Mistakes

- **Returning `false` and manually calling `router.navigate()`.** This can race with the router's own handling of the returned value. Return a `UrlTree` or `RedirectCommand` instead — it's the return value the router is built around.
- **Skipping `withComponentInputBinding()` and expecting resolved data as an input.** Without this feature enabled on `provideRouter`, an `input()`/`input.required()` that matches a resolver key simply won't receive anything.
- **Not handling resolver errors.** An unhandled error or rejected observable inside a resolver produces a `NavigationError` and silently stalls navigation. Handle it locally with `catchError`, or centrally with `withNavigationErrorHandler()`.
- **Using the deprecated `canLoad` to gate lazy-loaded routes.** `canMatch` replaces it and is more capable — it can also select between multiple components for the same path.
- **Resolving everything a page could ever need.** Resolvers block navigation until they finish. Fetch only what's essential for the first render; load secondary data inside the component after it's shown.
- **Trusting guards as the only line of defense.** Guard code runs in the user's browser and can be modified or bypassed. Client-side guards improve UX; the server must still enforce authorization independently.
- **Putting business logic directly in the guard/resolver function.** Delegate to an injectable service instead, so the logic can be unit-tested without spinning up the router at all.
- **Using the browser's native `confirm()` for unsaved-changes prompts in production.** It's fine for a demo, but it blocks the main thread and can't be styled — use a proper dialog/modal service.
- **Leaving `ResolveFn` untyped (`ResolveFn<any>`).** You lose type safety on the very data your component depends on. Always supply the generic.

## Best Practices

- Prefer **functional guards and resolvers** (`CanActivateFn`, `CanDeactivateFn`, `CanMatchFn`, `ResolveFn<T>`) built with `inject()` over class-based ones.
- **Redirect by returning `UrlTree`/`RedirectCommand`**, never by calling `navigate()` and returning `false`.
- **Keep guards and resolvers thin** — push real logic into injectable services so it's reusable and independently testable.
- Use **`canMatch`**, not `canLoad`, for gating lazy-loaded routes and for serving alternate components on the same path.
- **Keep resolvers lightweight**; resolve only what the initial render truly needs.
- **Show navigation-in-progress feedback** (e.g., a loading bar bound to `router.currentNavigation()`), since resolvers block the transition.
- **Centralize error handling** with `withNavigationErrorHandler()` when multiple resolvers would otherwise repeat the same `catchError` logic.
- Write **parameterized guard factories** (a function that returns a guard) for cross-cutting checks like roles or feature flags, instead of duplicating near-identical guards.
- **Test guards and resolvers** using `TestBed.runInInjectionContext()` or the `RouterTestingHarness`, so `inject()` calls resolve correctly outside a real navigation.
- Remember that **client-side guards are a UX layer, not a security boundary** — always enforce authorization on the server too.

## Summary

- Guards decide whether a navigation step is allowed; resolvers pre-fetch data before a route finishes activating.
- The router evaluates `canMatch`, then `canActivateChild`/`canActivate`, then `canDeactivate` for the outgoing route, and only then runs resolvers, parent to child.
- Modern Angular favors functional guards/resolvers built with `inject()` over class-based ones implementing router interfaces.
- All guards share the same return types: `boolean`, `UrlTree`, `RedirectCommand`, or a `Promise`/`Observable` of those.
- `CanMatch` is unique: returning `false` doesn't block navigation, it lets the router try the next matching route — ideal for feature flags and A/B tests.
- `withComponentInputBinding()` lets resolved data (and route/query params) flow straight into `input()`/`input.required()` component inputs.
- Always redirect from a guard or resolver by returning a `UrlTree`/`RedirectCommand`, not by imperatively calling `navigate()`.
- Handle resolver errors explicitly or centrally with `withNavigationErrorHandler()` to avoid stalled navigations.
- Client-side guards protect UX, not security — the server must independently enforce authorization.

## Flash Cards

**Q: What's the practical difference between `canActivate` and `canMatch` when they return `false`?**
A: `canActivate` blocks the navigation outright. `canMatch` doesn't block anything — it just tells the router this particular route definition isn't a match, so it tries the next route config with the same path, if one exists.

**Q: How should a functional guard redirect a user?**
A: By returning a `UrlTree` (e.g. via `router.createUrlTree()`/`router.parseUrl()`) or a `RedirectCommand` — not by calling `router.navigate()` and then returning `false`.

**Q: When do resolvers run relative to guards?**
A: After every relevant guard for that route has already succeeded. For nested routes, parent resolvers run before child resolvers, and a child resolver can read its parent's resolved data from `route.parent?.data`.

**Q: How can a component receive resolved data without injecting `ActivatedRoute`?**
A: Enable `withComponentInputBinding()` on `provideRouter`, then declare an `input()`/`input.required()` on the component whose name matches the resolver's key in the route's `resolve` object.

**Q: Why shouldn't client-side route guards be treated as a complete security solution?**
A: Because all the JavaScript running a guard executes in the user's browser and can be inspected or modified. Guards improve UX and reduce unnecessary requests, but authorization must also be enforced on the server.

## Exercises

**Easy**
Create a functional `authGuard` (`CanActivateFn`) for a `/profile` route. It should check a signal-based `AuthService.isAuthenticated()` and, for unauthenticated users, redirect to `/login` by returning a `UrlTree` (don't call `router.navigate()` directly). Wire it into a `Routes` array with `canActivate`.

**Medium**
Build a `productResolver` (`ResolveFn<Product>`) for the route `products/:id`. It should fetch a product from a `ProductService` using `HttpClient`, and if the request fails (e.g. a 404), redirect to `/products` using a `RedirectCommand` instead of letting the navigation fail. Enable `withComponentInputBinding()` and display the resolved product in a standalone `ProductDetail` component using `input.required<Product>()`.

**Challenging**
Design a `settings` feature that combines three guard types:
1. A `canMatch` guard that gates a lazy-loaded "new settings" component behind a `newSettings` feature flag, falling back to a `ComingSoon` component registered on the same path when the flag is off.
2. A `canActivateChild` guard requiring an `admin` role for every route nested under `settings`.
3. A `canDeactivate` guard on the `settings/profile` child route that warns about unsaved changes — but using a custom injectable dialog service instead of the native `confirm()`.

Also add a resolver that loads the current settings and exposes them to the component via `withComponentInputBinding()`. Handle resolver failures centrally with `withNavigationErrorHandler()`.

## Further Reading

- [Control route access with guards](https://angular.dev/guide/routing/route-guards) — official Angular guide
- [Route data resolvers](https://angular.dev/guide/routing/data-resolvers) — official Angular guide
- [`CanActivateFn` API reference](https://angular.dev/api/router/CanActivateFn)
- [`ResolveFn` API reference](https://angular.dev/api/router/ResolveFn)
- [`withComponentInputBinding` API reference](https://angular.dev/api/router/withComponentInputBinding)
- [`withNavigationErrorHandler` API reference](https://angular.dev/api/router/withNavigationErrorHandler)
- [Route Loading Strategies (lazy loading)](https://angular.dev/guide/routing/loading-strategies)
- [Redirecting routes](https://angular.dev/guide/routing/redirecting-routes)
- [Testing routing and navigation](https://angular.dev/guide/routing/testing)

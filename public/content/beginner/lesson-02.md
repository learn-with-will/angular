---
id: lesson-02
slug: components-and-templates
title: Components & Pages
level: beginner
order: 2
duration: 45
tags:
  - components
  - templates
  - standalone
  - routing
  - signals
---

# Learning Objectives

After completing this lesson you will be able to:

1. Create a **standalone Angular component** from scratch and render it on screen.
2. Describe the **anatomy of a component** (selector, template, styles, class) and explain how components compose into a tree.
3. Pass data **into** and **out of** components using the signal-based `input()` and `output()` functions.
4. Turn components into navigable **pages** by configuring the Angular Router with `provideRouter` and `<router-outlet>`.
5. **Lazy-load** page components and read **route parameters** with component input binding.

> This lesson targets **Angular 20+** (the current stable release is Angular 22). All examples use **standalone components**, which have been the default since Angular 19, so you will not see `standalone: true` written anywhere — it is implied.

---

# Why This Concept Exists

A real application screen is too big to build as one giant file. Imagine a dashboard with a navigation bar, a sidebar, a list of cards, and a footer. If all of that lived in one place, it would be impossible to read, reuse, or test.

**Components** solve this by letting you split the UI into small, self-contained pieces. Each component owns its own template (HTML), its own logic (a TypeScript class), and its own styles (CSS). You build one small piece well, then reuse it everywhere.

**Pages** solve a different problem: a single-page application (SPA) has only one HTML file, yet users still expect distinct screens with their own URLs — `/products`, `/products/42`, `/about`. The Angular **Router** maps a URL to a component and swaps that component in and out of the page *without a full reload*. In Angular, a "page" is simply a **component that is connected to a route**.

Together, components and pages give you the two fundamental building blocks of any Angular app: small reusable parts, and the navigation that stitches them into screens.

---

# Concept Explanation

## A component is a class with metadata

Every Angular component is a TypeScript class decorated with `@Component`. The decorator's configuration object is called the component's **metadata**, and it tells Angular three key things:

- **`selector`** — the custom HTML tag name used to place the component in another template (e.g. `<app-greeting />`).
- **`template`** (or `templateUrl`) — the HTML Angular renders.
- **`styles`** (or `styleUrl`) — CSS that is automatically scoped to *this* component only.

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ name }}!</h1>`,
  styles: `h1 { color: rebeccapurple; }`,
})
export class Greeting {
  protected name = 'Angular';
}
```

When Angular finds `<app-greeting />` in a template, it creates an instance of the `Greeting` class and renders the template inside that element. The element that matches the selector is called the **host element**, and the rendered DOM is the component's **view**.

## Components compose into a tree

Components contain other components. A `UserList` renders many `UserCard` components; a `Page` renders a `Header`, a `UserList`, and a `Footer`. Your whole app is therefore a **tree of components** with one **root component** (usually `App`) at the top.

To use one component inside another, you import the class and add it to the parent's `imports` array:

```ts
import { Component } from '@angular/core';
import { Greeting } from './greeting';

@Component({
  selector: 'app-home',
  imports: [Greeting], // makes <app-greeting> usable below
  template: `<app-greeting />`,
})
export class Home {}
```

## Data flows down with inputs, events flow up with outputs

Components rarely work in isolation. The standard pattern is:

- **Inputs** carry data *down* from a parent into a child (`input()`).
- **Outputs** send events *up* from a child to a parent (`output()`).

This one-way data flow keeps applications predictable: a child never reaches up and changes its parent directly — it asks by emitting an event.

## From components to pages: the Router

To make a component a **page**, you:

1. Define a list of **routes** that map a URL `path` to a component.
2. Register those routes once with `provideRouter(routes)`.
3. Place a `<router-outlet />` in your root template — the placeholder where the matched page renders.
4. Navigate with the `routerLink` directive instead of plain `href` (so there is no full page reload).

When the URL changes, the Router finds the matching route and renders its component into the outlet. Everything outside the outlet (like a nav bar) stays put.

---

# Key Terminology

- **Component** — A reusable UI building block: a class plus a template, styles, and metadata.
- **Selector** — The custom element tag (e.g. `app-user-card`) used to place a component in a template.
- **Template** — The HTML for a component, including bindings and control flow.
- **View** — The actual DOM that a component's template produces.
- **Host element** — The DOM element that matches the component's selector.
- **Standalone component** — A component that declares its own dependencies in `imports` and does not need an `NgModule`. This is the default in modern Angular.
- **Input** — A property a parent can set on a child to pass data down. Created with `input()`.
- **Output** — An event a child emits so a parent can react. Created with `output()`.
- **Route** — A mapping from a URL `path` to a component.
- **Router outlet** — `<router-outlet />`, the placeholder where the routed (page) component is rendered.
- **Lazy loading** — Loading a page component's code only when its route is first visited, which shrinks the initial download.
- **Route parameter** — A dynamic value in a URL, like `42` in `/products/42`.

---

# Syntax Overview

## Defining a component

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-example',     // how it is used: <app-example />
  templateUrl: './example.html', // or inline: template: `...`
  styleUrl: './example.css',     // or inline: styles: `...`
})
export class Example {
  title = input.required<string>(); // input, must be provided by parent
  closed = output<void>();           // output event the parent can listen to
}
```

## Template syntax you will use constantly

```html
<!-- Interpolation: print a value -->
<h1>{{ title() }}</h1>

<!-- Property binding: set an element/component property -->
<img [src]="imageUrl" [alt]="title()" />

<!-- Event binding: respond to events -->
<button type="button" (click)="closed.emit()">Close</button>

<!-- Built-in control flow (modern Angular) -->
@if (isLoggedIn()) {
  <p>Welcome back!</p>
} @else {
  <p>Please log in.</p>
}

@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items.</li>
}
```

> **Note:** `@if`, `@for`, and `@switch` are the modern, built-in **control flow** blocks and are the recommended choice for new code. They replace the older `*ngIf` and `*ngFor` directives. In `@for`, the `track` expression is **required** — it tells Angular how to identify each item so it can update the list efficiently.

## Configuring routes (pages)

```ts
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: '**', component: NotFound }, // wildcard: matches anything else
];
```

```ts
// app.config.ts — register the router once
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

```html
<!-- Root template: navigation + the page outlet -->
<nav>
  <a routerLink="/">Home</a>
  <a routerLink="/about" routerLinkActive="active">About</a>
</nav>
<router-outlet />
```

---

# Real World Analogy

Think of building a house.

- **Components are LEGO-style fittings** — a window, a door, a light switch. You build each one once and reuse it in many rooms. A window doesn't care which wall it's in; it just does its job.
- **Pages are the rooms** — the kitchen, the bedroom, the office. Each room has its own address ("second door on the left").
- **Routes are the hallways and signs** that lead you from room to room.
- **The `<router-outlet />` is the doorway you are currently standing in front of** — whichever room matches where you are, that's what you see through the doorway. Walking to a new room (clicking a `routerLink`) swaps the view, but the house itself never gets rebuilt.

So a page isn't a special kind of brick — it's just a normal component that happens to have its own address.

---

# Examples

## Example 1 — Basic component

The smallest useful component: it shows a message and is placed inside a parent.

```ts
// hello-box.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-hello-box',
  template: `
    <div class="box">
      <p>Hello from a reusable component!</p>
    </div>
  `,
  styles: `
    .box {
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
  `,
})
export class HelloBox {}
```

```ts
// home.ts — uses the component twice
import { Component } from '@angular/core';
import { HelloBox } from './hello-box';

@Component({
  selector: 'app-home',
  imports: [HelloBox], // required to use <app-hello-box> below
  template: `
    <app-hello-box />
    <app-hello-box />
  `,
})
export class Home {}
```

**What's happening:** `HelloBox` encapsulates its own template and scoped styles. `Home` imports the class and drops the tag in twice — Angular renders two independent instances. The `.box` style never leaks out to other components because Angular scopes styles per component by default.

> **Tip:** You normally generate a component with the CLI: `ng generate component hello-box` (short: `ng g c hello-box`). In Angular 20+ this creates `hello-box.ts` with the class `HelloBox` — note there is **no** `Component` suffix on the class and **no** `.component` in the filename. This is the current style-guide convention. (Older tutorials show `hello-box.component.ts` / `HelloBoxComponent`, which still works but is the legacy style.)

## Example 2 — Real-world component with inputs and outputs

A reusable `UserCard` that receives a user (input) and reports when it is selected (output). This is the bread-and-butter pattern of real apps.

```ts
// user-card.ts
import { Component, input, output } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-card',
  template: `
    <article class="card">
      <h2>{{ user().name }}</h2>
      <p>{{ user().email }}</p>
      <button type="button" (click)="select.emit(user())">Select</button>
    </article>
  `,
  styles: `
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
    h2 { margin: 0 0 0.25rem; }
  `,
})
export class UserCard {
  // Required input: the parent MUST pass a user. Read it by calling user().
  user = input.required<User>();

  // Output: emits the selected user up to the parent.
  select = output<User>();
}
```

```ts
// user-list.ts — the parent
import { Component, signal } from '@angular/core';
import { UserCard, User } from './user-card';

@Component({
  selector: 'app-user-list',
  imports: [UserCard],
  template: `
    @for (user of users(); track user.id) {
      <app-user-card [user]="user" (select)="onSelect($event)" />
    } @empty {
      <p>No users found.</p>
    }

    @if (selected(); as current) {
      <p>You selected: <strong>{{ current.name }}</strong></p>
    }
  `,
})
export class UserList {
  protected users = signal<User[]>([
    { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
    { id: 2, name: 'Alan Turing', email: 'alan@example.com' },
  ]);

  protected selected = signal<User | null>(null);

  protected onSelect(user: User) {
    this.selected.set(user);
  }
}
```

**What's happening:**

- `user = input.required<User>()` declares an input. Because it is **signal-based**, you read its value by *calling it*: `user()`. With `input.required`, Angular reports a build error if a parent forgets to pass `[user]`.
- `select = output<User>()` declares an output. The child calls `select.emit(user())` and the parent listens with `(select)="onSelect($event)"`, where `$event` is the emitted user.
- Data flows **down** (`[user]="user"`) and events flow **up** (`(select)=...`). The child never mutates the parent's data — it asks via an event. This one-way flow is what makes the app easy to reason about.

> **Why signal inputs?** `input()` is the modern, recommended way to declare inputs. The value is a signal, so it works seamlessly with `computed()` and `effect()`, gives stronger type safety, and updates the view automatically. The older `@Input()` / `@Output()` decorators still work and you'll see them in existing code, but prefer `input()` / `output()` for new components.

## Example 3 — Best practice: components as pages with routing

Here we turn components into real pages, navigate between them, **lazy-load** them, and read a **route parameter** as an input. This mirrors how a production feature is wired up.

```ts
// products-page.ts — a list page
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products-page',
  imports: [RouterLink],
  template: `
    <h1>Products</h1>
    <ul>
      @for (p of products(); track p.id) {
        <li><a [routerLink]="['/products', p.id]">{{ p.name }}</a></li>
      }
    </ul>
  `,
})
export class ProductsPage {
  protected products = signal([
    { id: 1, name: 'Keyboard' },
    { id: 2, name: 'Monitor' },
  ]);
}
```

```ts
// product-detail-page.ts — a detail page that reads the :id from the URL
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-product-detail-page',
  template: `
    <h1>Product detail</h1>
    <p>Showing product with id: <strong>{{ id() }}</strong></p>
    <a routerLink="/products">Back to list</a>
  `,
  imports: [], // RouterLink omitted here for brevity; add it to use routerLink
})
export class ProductDetailPage {
  // The route's :id segment is bound to this input automatically.
  id = input.required<string>();
}
```

```ts
// app.routes.ts — note the lazy-loaded routes
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'products',
    loadComponent: () =>
      import('./products-page').then((m) => m.ProductsPage),
  },
  {
    path: 'products/:id', // :id is a route parameter
    loadComponent: () =>
      import('./product-detail-page').then((m) => m.ProductDetailPage),
  },
  { path: '', redirectTo: 'products', pathMatch: 'full' },
];
```

```ts
// app.config.ts — enable route params to be bound to component inputs
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ],
};
```

```ts
// app.ts — the root component holds the outlet
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {}
```

```ts
// main.ts — bootstrap the app (no NgModule needed)
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig);
```

**What's happening — and why it's best practice:**

- **`loadComponent` lazy-loads each page.** The page's JavaScript is only downloaded when the user first visits that route, keeping the initial bundle small and the app fast.
- **`:id` is a route parameter.** Because we enabled `withComponentInputBinding()`, the router automatically passes the URL's `:id` value into the matching `id = input.required<string>()` of `ProductDetailPage`. No manual subscription to `ActivatedRoute` is needed for this simple case — less code, fewer bugs.
- **`routerLink` (not `href`)** performs client-side navigation, so the app does not reload — only the outlet's content changes.
- **`<router-outlet />`** marks exactly where the active page renders; everything around it (a nav bar, for instance) would stay constant across navigations.

---

# Common Mistakes

- **Forgetting to add the child to `imports`.** If `<app-user-card>` doesn't render, the most common cause is that you didn't import `UserCard` into the parent's `imports` array. Standalone components must declare what they use.
- **Reading a signal input without calling it.** `user().name` is correct; `user.name` is not — `user` is a signal *function*, so you must call it. Likewise use `id()`, not `id`, in templates and code.
- **Leaving out `track` in `@for`.** Angular requires a `track` expression. Use a stable unique value such as `track item.id`. Using `track $index` is allowed but only appropriate for static lists that never reorder.
- **Forgetting `<router-outlet />`.** If navigation "does nothing," check that the root template actually contains an outlet — pages have nowhere to render without it.
- **Expecting route params as inputs without enabling binding.** Reading `:id` via `input()` only works if you registered `provideRouter(routes, withComponentInputBinding())`. Without it, the input stays `undefined`.
- **Using `href` for in-app links.** `<a href="/products">` triggers a full page reload. Use `<a routerLink="/products">` for SPA navigation.
- **Building one giant page component.** Putting all logic and markup in a single component makes it unreusable and hard to test. Split it into smaller components.
- **Trying to mutate an input.** Inputs are read-only signals. To change shared data, emit an event with `output()` and let the owner update it.

---

# Best Practices

- **Keep components small and single-purpose.** A component should do one thing. If a template scrolls for pages, extract child components.
- **Separate "smart" and "presentational" components.** Presentational components only take inputs and emit outputs (no data fetching). Smart/container components (often your pages) fetch data and coordinate children. This makes presentational components easy to reuse and test.
- **Prefer signal-based `input()` / `output()`** over the `@Input()` / `@Output()` decorators in new code, and use `model()` when you specifically need two-way binding.
- **Prefer built-in control flow (`@if`, `@for`, `@switch`)** over the legacy `*ngIf` / `*ngFor` directives, and always provide a stable `track` value.
- **Lazy-load feature/page routes with `loadComponent`.** Only the home page and shared shell need to load up front.
- **Use `withComponentInputBinding()`** to receive route params as inputs for simple pages instead of manually subscribing to `ActivatedRoute`.
- **Always add a wildcard route** (`{ path: '**', component: NotFound }`) so unknown URLs show a friendly "not found" page.
- **Prefix your selectors** (e.g. `app-`) to avoid clashing with native elements or third-party components.
- **Inject dependencies with `inject()`** (e.g. `private http = inject(HttpClient)`) for concise, readable services inside components.

> **Looking ahead:** Angular 22 introduces *selectorless components* (an evolving, experimental feature) that let you reference a component by its imported class name in a template instead of a selector string. It is promising but still stabilizing — the selector-based approach in this lesson remains the mainstream, fully supported way to author components today.

---

# Summary

- A **component** is a TypeScript class plus `@Component` metadata (selector, template, styles); it is the basic UI building block.
- Components are **standalone by default** in modern Angular — no `NgModule` is required; you list dependencies in `imports`.
- The element matching a component's **selector** is its **host element**, and the rendered DOM is its **view**.
- Apps are a **tree of components**, composed by importing a child and placing its selector in a parent's template.
- Data flows **down via `input()`** and events flow **up via `output()`**, giving predictable one-way data flow.
- Signal inputs are **read by calling them** (`user()`), and `input.required()` enforces that a value is provided.
- A **page** is just a component connected to a **route**; the Router renders the matched component into `<router-outlet />`.
- Register routes once with **`provideRouter(routes)`** and navigate with **`routerLink`** to avoid full reloads.
- **Lazy-load** pages with `loadComponent`, and bind **route parameters** to inputs using `withComponentInputBinding()`.
- Use modern **control flow** (`@if`, `@for` with `track`, `@switch`) in templates.

---

# Flash Cards

**Q:** What three pieces of metadata does the `@Component` decorator most commonly define?
**A:** A `selector` (the tag used to place it), a `template`/`templateUrl` (its HTML), and `styles`/`styleUrl` (its scoped CSS).

**Q:** How do you read the value of a signal-based input declared as `name = input<string>()`?
**A:** Call it like a function: `name()`. Signal inputs are read-only signals, so you invoke them to get the current value.

**Q:** How does a child component send information back up to its parent?
**A:** It declares an `output()`, calls `.emit(value)`, and the parent listens with event binding, e.g. `(select)="onSelect($event)"`.

**Q:** In Angular, what makes a component a "page"?
**A:** Nothing special about the component itself — it becomes a page when it is mapped to a URL in the routes and rendered into `<router-outlet />` by the Router.

**Q:** What must you add so a route parameter like `:id` is automatically passed into a component's `input()`?
**A:** Enable it when registering the router: `provideRouter(routes, withComponentInputBinding())`.

---

# Exercises

## Easy

Create a standalone `Badge` component with a selector `app-badge` that displays the text "New" inside a styled `<span>`. Then render `<app-badge />` inside an existing `Home` component. Remember to add `Badge` to `Home`'s `imports` array.

## Medium

Build a `CounterButton` component that:

- has a `label` input (`input.required<string>()`),
- keeps a private count in a `signal(0)`,
- increments the count when clicked and shows it (e.g. `{{ label() }}: {{ count() }}`),
- emits a `changed` output with the new count each time it changes.

Use it from a parent that logs every emitted value.

## Challenging

Set up a small two-page app with the Router:

- A `BooksPage` at `/books` listing three books (use a `signal` array) with `routerLink`s to each book's detail page.
- A `BookDetailPage` at `/books/:id` that reads `id` as a required input (enable `withComponentInputBinding()`), lazy-load **both** pages with `loadComponent`, and add a wildcard route that renders a simple `NotFound` page.
- Bonus: add a redirect from `''` to `books`.

---

# Further Reading

- **Angular — Components overview & anatomy:** <https://angular.dev/guide/components>
- **Angular — Accepting data with input properties:** <https://angular.dev/guide/components/inputs>
- **Angular — Custom events with outputs:** <https://angular.dev/guide/components/outputs>
- **Angular — Routing overview:** <https://angular.dev/guide/routing>
- **Angular — Define routes & lazy loading:** <https://angular.dev/guide/routing/define-routes>
- **Angular — Read route state (component input binding):** <https://angular.dev/guide/routing/read-route-state>
- **Angular — Control flow (`@if` / `@for` / `@switch`):** <https://angular.dev/guide/templates/control-flow>
- **Angular — Signals overview:** <https://angular.dev/guide/signals>
- **Angular — Coding style guide:** <https://angular.dev/style-guide>

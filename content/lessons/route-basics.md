---
slug: route-basics
title: "Routes and the router outlet"
topic: routing
kind: concept
summary: "Map URLs to components, register them once, and render the match in a router outlet."
tags: [routing, routes, router-outlet, pages]
related: [router-link, lazy-routes, route-params, using-components]
---
> **In one line:** A **page** in Angular is just a component connected to a route. You list routes, register them with `provideRouter()`, and put a `<router-outlet />` where the matched page should appear.

## The idea

A single-page application has one HTML file, yet users still expect separate screens with their own URLs: `/products`, `/products/42`, `/about`. The **Router** provides that. It watches the URL, finds the matching route, and swaps that route's component in and out of the page *without a full reload*.

Four steps turn a component into a page:

1. Define a list of **routes** mapping a `path` to a component.
2. Register them once with `provideRouter(routes)`.
3. Put a `<router-outlet />` in the root template, the placeholder where the matched page renders.
4. Navigate with `routerLink` instead of a plain `href`.

Everything outside the outlet, such as a navigation bar, stays put while the page inside it changes.

```flow
url: `/about` | the address in the browser @primary
router: Router | finds the matching route @blue
outlet: `<router-outlet />` | renders `About` here @green
url -> router: navigation
router -> outlet: component
```

## See it

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: '**', component: NotFound },       // wildcard: anything else
];

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

```html
<!-- Root template: navigation plus the page outlet -->
<nav>
  <a routerLink="/">Home</a>
  <a routerLink="/about" routerLinkActive="active">About</a>
</nav>
<router-outlet />
```

## Go deeper

Routes are matched **top to bottom**, and the first match wins. That is why the wildcard `**` goes last: it matches everything, so anything after it would never be reached. Always include one, so an unknown URL shows a friendly "not found" page instead of a blank screen.

A redirect needs `pathMatch: 'full'` when it targets the empty path, so it only applies when the whole URL is empty and does not trigger for every URL that starts with nothing:

```typescript
{ path: '', redirectTo: 'products', pathMatch: 'full' }
```

## Watch out

- Forgetting `<router-outlet />`. Navigation then appears to do nothing, because pages have nowhere to render.
- Putting the wildcard route before others. Routes match in order, so it swallows the rest.
- Using `href` for in-app links. It triggers a full page reload; use `routerLink`.

## Remember

- A page is a component attached to a route.
- Register routes once with `provideRouter()`, and render them in `<router-outlet />`.
- Routes match top to bottom, so the wildcard goes last.

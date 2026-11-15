---
slug: route-params
title: "Route parameters"
topic: routing
kind: concept
summary: "A dynamic path segment such as :id lets one route represent thousands of resources."
tags: [routing, parameters, dynamic-routes, urls]
related: [component-input-binding, activated-route, query-params, router-link]
---
> **In one line:** A route parameter is a named, dynamic segment of a path, declared with a colon, such as `products/:id`. One route then matches `/products/42`, `/products/99` and `/products/abc`.

## The idea

Most apps are built around **resources**: a product, a user, an order, a post. You do not want a hardcoded route for every product in a catalog. You want one route *template* where `:id` is filled in at navigation time. The router matches the URL, extracts the dynamic part and hands it to your component as a **string**, always, even when it looks numeric.

This gives you URLs that are shareable, bookmarkable and friendly to search engines, because the identifier lives in the path rather than in hidden app state.

Angular supports three ways to carry dynamic data in a URL, and choosing the right one matters:

| Type | Example | Purpose |
|---|---|---|
| **Route parameter** | `/products/42` | identifies *which resource*; required for the route to match |
| **Query parameter** | `/products?sort=price&page=2` | optional state: filters, sorting, pagination |
| **Matrix parameter** | `/products;color=red` | rarely used; scopes values to one path segment |

## See it

```typescript
export const routes: Routes = [
  { path: 'products', component: ProductList },
  { path: 'products/:id', component: ProductDetail },
  { path: 'users/:userId/posts/:postId', component: UserPost },   // several parameters
];
```

```html
<!-- The array form builds "/products/42" -->
<a [routerLink]="['/products', product.id]">{{ product.name }}</a>
```

A path can hold more than one parameter. `userId` and `postId` are extracted independently and each can be read on its own.

## Go deeper

A good rule of thumb: **if removing the value would mean you are looking at a fundamentally different thing, it is a route parameter. If removing it only changes how the same thing is displayed, it is a query parameter.**

Because parameters are strings, comparing `id === 42` quietly fails. Convert at the boundary, once, with a transform such as `numberAttribute` on an input, or `Number(id)` where you read it, instead of scattering conversions through the component.

URLs are just text that a user or a bad link can type freely. Never assume a parameter is valid: handle `NaN`, empty and unknown values, and send people to a "not found" page.

## Watch out

- Treating the value as the right type. It is always a string, so `"42"` is not `42`.
- Putting sort or filter state in the path, such as `/products/sort-price`. Keep identity in the path and context in the query string.
- Not handling invalid values. Anyone can type any URL.

## Remember

- `:name` declares a dynamic segment, and its value arrives as a string.
- Route params say *which resource*; query params say *how to show it*.
- Validate and convert parameters early.

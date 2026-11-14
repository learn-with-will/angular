---
slug: component-input-binding
title: "withComponentInputBinding"
topic: routing
kind: api
summary: "Bind route parameters, query parameters and resolved data straight to a component's inputs."
tags: [routing, inputs, signals, parameters]
related: [route-params, activated-route, resolvers, input]
since: "16"
---
> **In one line:** Enable `withComponentInputBinding()` once, and a route parameter whose name matches a component input is passed into it automatically, with no subscription code.

## The idea

Reading a route parameter used to mean injecting `ActivatedRoute`, subscribing to `paramMap` and cleaning up. For the common case, where a page just needs `:id`, that is a lot of ceremony.

Component input binding removes it. You opt in once in `provideRouter`, and the router matches input names against route data: path parameters, query parameters and values produced by resolvers. A match fills the input, and the value updates by itself if the parameter changes while the component stays on screen.

```flow
url: `/products/42` | the address @primary
route: Route `products/:id` | the param is named id @blue
input: `id = input.required<string>()` | filled in for you @green
url -> route: matches
route -> input: binds by name
```

It is declarative, works naturally with signals, and needs no `ngOnInit` or subscription boilerplate. That is why it is the recommended default for new code.

## See it

```typescript
// app.config.ts: opt in once
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};
```

```typescript
@Component({
  selector: 'app-product-detail',
  template: `<h1>Product #{{ id() }}</h1>`,
})
export class ProductDetail {
  // Filled from the ":id" segment of products/:id
  readonly id = input.required<string>();
}
```

Navigate from `/products/1` to `/products/2` and `id()` changes in place, so anything derived from it, such as a `computed()`, updates too.

## Go deeper

The same mechanism delivers **query parameters** and **resolver data**: an input called `sort` receives `?sort=price`, and an input named after a `resolve` key receives that resolved value. A parameter missing from the URL leaves an optional input at its default.

Because the router always sends strings, add a transform when you want another type. `input(0, { transform: numberAttribute })` converts `"42"` to `42`, and yields `NaN` for garbage, which you can detect and handle.

Reach for `ActivatedRoute` when a parameter change should *do* something asynchronous, such as start a request with cancellation. For plain display, the input is enough.

## Watch out

- Forgetting to enable it. Without `withComponentInputBinding()`, an optional input stays `undefined` and reading an `input.required()` throws NG0950 (*input is required but no value is available yet*).
- Naming the input differently from the parameter. The names must match, or use an `alias`.
- Assuming it is a number. It is a string unless you transform it.

## Remember

- Enable `withComponentInputBinding()` once, and name inputs after route parameters.
- It binds path params, query params and resolved data.
- Values are strings; add `transform` for numbers and booleans.

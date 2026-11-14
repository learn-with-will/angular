---
slug: store-setup
title: "Registering the Store"
topic: state
kind: api
summary: "provideStore at the root, provideState and provideEffects on the route, and DevTools in development only."
tags: [state, ngrx, provider, lazy-loading]
related: [store-redux-flow, reducer-feature, store-effects, lazy-routes]
---
> **In one line:** Register an empty root store at bootstrap, and add each feature's state and effects on its own route so they load lazily.

## The idea

Standalone apps register NgRx with provider functions rather than modules. There are two levels, and keeping them apart is the design:

| Where | Function | Purpose |
|---|---|---|
| bootstrap | `provideStore()` | the root store, usually with no reducers yet |
| bootstrap | `provideEffects()` | the root effects registry |
| bootstrap | `provideStoreDevtools(...)` | the browser DevTools connection |
| a route | `provideState(feature)` | add one slice of state when the route is used |
| a route | `provideEffects(SomeEffects)` | add that feature's effects |

These replace `StoreModule.forRoot()`, `EffectsModule.forRoot()` and `StoreDevtoolsModule.instrument()`. Registering features on the route means a slice of state exists only after the user visits it, which keeps the initial bundle and the initial state small.

## See it

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideStore(),                                   // root store, no reducers yet
    provideEffects(),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
});
```

```typescript
// products.routes.ts: state and effects load with the feature
export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(productsFeature), provideEffects(ProductsEffects)],
    loadComponent: () => import('./products.component').then((m) => m.ProductsComponent),
  },
];
```

## Go deeper

`logOnly: !isDevMode()` keeps DevTools in a restricted, low-overhead mode in production, so users do not pay for the debugging features. Treat the state as visible to anyone who opens DevTools, and keep secrets out of it.

For a small app, you can skip lazy feature registration and pass reducers directly: `provideStore({ [counterFeature.name]: counterFeature.reducer })`. The route-level style simply scales better.

Because route `providers` create an environment injector for that route, the feature's effects start when the route is first activated and are not torn down on navigation away, so a returning user finds the state exactly as they left it. If that is not what you want, reset it explicitly with an action.

Check the order of registration when an effect "never fires": a feature whose `provideEffects` was not added to a route simply has no listeners, and nothing reports an error.

## Watch out

- Registering every feature's state at bootstrap.
- Forgetting `provideEffects(...)` on the route, so actions go unhandled silently.
- Leaving DevTools fully on in production.

## Remember

- Root: empty store, effects registry, DevTools.
- Route: `provideState` and `provideEffects` for each feature.
- DevTools are for development; `logOnly` in production.

---
slug: navigation-lifecycle
title: "The navigation lifecycle"
topic: routing
kind: concept
summary: "Every navigation runs through the same ordered checkpoints before a component appears."
tags: [routing, guards, resolvers, lifecycle]
related: [can-activate, can-match, can-deactivate, resolvers]
---
> **In one line:** A navigation is a pipeline. The router asks guards for permission, loads data with resolvers, and only then activates the new component.

## The idea

Clicking a link does not instantly show a page. The router first needs to answer questions: does a route match, may the user leave the current page, may they enter the next one, is its data ready? Each question has a dedicated hook, and they always run in the same order.

Knowing the order tells you *where* to put a check. Permission belongs in a guard, loading belongs in a resolver, and neither belongs in `ngOnInit`, which runs far too late.

```flow
match: `canMatch` | should this route even be considered @blue
leave: `canDeactivate` | may the user leave the current page @amber
enter: `canActivate` | may the user enter the new one @amber
resolve: `resolve` | fetch data before the page shows @primary
show: Activate | the component is created and rendered @green
match -> leave: route found
leave -> enter: ok
enter -> resolve: allowed
resolve -> show: data ready
```

Any guard can stop the pipeline by returning `false` or redirecting. Nothing after that step runs, and the user stays where they were or lands on the redirect.

## See it

Every hook accepts several return types, and the router interprets each one:

| Return value | Meaning |
|---|---|
| `true` | continue the navigation |
| `false` | cancel it, the user stays put |
| `UrlTree` | cancel and redirect to another URL |
| `RedirectCommand` | redirect, with navigation options such as `replaceUrl` |
| Observable or Promise of the above | wait, then decide (asynchronous check) |

```typescript
export const routes: Routes = [
  {
    path: 'orders/:id',
    component: OrderPage,
    canActivate: [authGuard],        // may the user enter?
    canDeactivate: [unsavedGuard],   // may the user leave?
    resolve: { order: orderResolver }, // data before the page appears
  },
];
```

## Go deeper

Guards run for the *whole* tree being activated, so a parent's `canActivate` is checked before its children's. With `canActivateChild` on the parent you can apply one check to every child without repeating it.

`canMatch` is the odd one out: it runs *during* route matching, before the route is chosen. When it returns `false` the router does not cancel anything, it simply tries the next route in the list. That is what makes it suitable for feature flags and role-based route variants.

The router also emits events (`NavigationStart`, `NavigationEnd`, `NavigationCancel`, `NavigationError`) so you can show a progress bar while a slow resolver or guard is working.

## Watch out

- Doing permission checks in `ngOnInit`. The page already rendered and the user glimpsed it.
- Assuming guards run in the order you listed the *kinds*. The order is fixed by the router.
- Ignoring `NavigationCancel` when a long-running guard looks like a frozen page.

## Remember

- The order is `canMatch`, `canDeactivate`, `canActivate`, `resolve`, then activate.
- Return `true`, `false`, a `UrlTree` or a `RedirectCommand`; any of them can be async.
- Permission goes in guards, data goes in resolvers.

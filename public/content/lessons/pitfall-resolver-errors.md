---
slug: pitfall-resolver-errors
title: "Pitfall: a resolver that fails"
topic: routing
kind: pitfall
summary: "An unhandled error in a resolver cancels the navigation and the user sees nothing happen."
tags: [routing, resolvers, errors, redirect]
related: [resolvers, navigation-lifecycle, component-input-binding, route-params]
---
> **In one line:** When a resolver throws, the navigation fails and the user stays on the previous page with no message. Always handle the error and redirect somewhere meaningful.

## The idea

A resolver sits *in the path* of the navigation. If its request returns `404` or the network drops, the Observable errors, the router emits `NavigationError`, and the new page never appears. To the user, the click simply did nothing.

It is easy to miss in development, where the API always answers. The first real symptom is a support ticket: "the product link is dead".

The fix is to decide, for each failure, what the user should see instead:

| Failure | Better outcome |
|---|---|
| `404`, the resource does not exist | redirect to a not-found page |
| `401` or `403` | redirect to login or forbidden |
| Network down or `5xx` | stay, with an error message the user can retry |

## See it

```typescript
export const productResolver: ResolveFn<Product | RedirectCommand> = (route) => {
  const router = inject(Router);

  return inject(ProductService)
    .getById(route.paramMap.get('id')!)
    .pipe(
      catchError(() =>
        of(new RedirectCommand(router.parseUrl('/not-found'), { replaceUrl: true })),
      ),
    );
};
```

A resolver may return a `RedirectCommand`, which tells the router to redirect instead of activating. `replaceUrl: true` swaps the broken URL out of history, so the back button does not return to a dead link.

## Go deeper

You can also install one global handler with `withNavigationErrorHandler()` in `provideRouter`, for failures nobody handled locally. It is a safety net for logging and a generic error page, not a replacement for handling the common cases at the resolver.

Combine this with guard-side validation. If the `:id` is not even a number, a `canActivate` check can redirect to not-found before the resolver makes a pointless request.

```typescript
provideRouter(
  routes,
  withNavigationErrorHandler(({ error, router }) => {
    logger.error('Navigation failed', error);       // report it
    return new RedirectCommand(router.parseUrl('/error'));
  }),
);
```

Test the failure path as well as the happy one: stub the service to throw and assert that the resolver returns the redirect. Failure branches are the ones nobody clicks through by hand, so they are the ones that break unnoticed.

## Watch out

- Writing only the success path, so a `404` becomes a silent dead link.
- Redirecting without `replaceUrl`, which traps the user in a back-button loop.
- Using one global handler to cover everything. It cannot know what each page should do.

## Remember

- A failing resolver cancels the navigation silently unless you handle it.
- `catchError` plus `RedirectCommand` turns failures into a useful destination.
- Add `withNavigationErrorHandler()` as the global safety net.

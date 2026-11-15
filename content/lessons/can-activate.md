---
slug: can-activate
title: "canActivate: protecting a route"
topic: routing
kind: api
summary: "A functional guard that decides whether the user may enter a route, and redirects them if not."
tags: [routing, guards, auth, canactivate]
related: [navigation-lifecycle, guard-factories, pitfall-guards-are-not-security, can-match]
---
> **In one line:** `canActivate` is a function that runs before a route activates. Return `true` to allow, or a `UrlTree` to send the user somewhere else.

## The idea

Some pages need a signed-in user, an active subscription or a certain role. A `canActivate` guard is the checkpoint for that. Modern guards are plain functions (type `CanActivateFn`), not classes, and they use `inject()` to reach services, exactly like any other code in an injection context.

The guard receives the route being entered and the target URL. It answers with a boolean, a redirect, or an Observable or Promise of those.

Redirecting is better than returning `false`:

| The guard returns | What the user experiences |
|---|---|
| `true` | the page opens |
| `false` | nothing happens; they stay on the same page with no explanation |
| `UrlTree` | they land somewhere useful, such as the login page with a way back |

## See it

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  // Redirect to login and remember where the user was going
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

```typescript
export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'account', component: AccountPage, canActivate: [authGuard] },
];
```

After login, read `returnUrl` and navigate there, so the user lands on the page they originally wanted.

## Go deeper

A guard can be asynchronous when the answer is not known yet, for example while the session is being restored on startup. Return an Observable and the router waits:

```typescript
export const sessionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return toObservable(auth.ready).pipe(
    filter(Boolean),
    take(1),
    map(() => auth.isLoggedIn() || router.createUrlTree(['/login'])),
  );
};
```

To protect a whole section, put `canActivate` on a parent route and every child inherits it, or use `canActivateChild` when the parent is a layout that other code also enters.

Because guards are ordinary functions, they are easy to test: call them inside `TestBed.runInInjectionContext(() => authGuard(route, state))` with a stubbed `AuthService`.

## Watch out

- Returning `false` with no redirect, which leaves the user on a dead click.
- Calling `router.navigate()` inside the guard and then returning `false`. Return the `UrlTree` instead; it is one coherent decision.
- Treating the guard as the only protection. See the next pitfall.

## Remember

- A guard is a function: `inject()` services and return `true` or a `UrlTree`.
- Redirect rather than silently cancelling.
- Put it on a parent route to cover a whole section.

---
slug: can-match
title: "canMatch: choosing between routes"
topic: routing
kind: api
summary: "Decide during matching whether a route applies at all, so the router can fall through to the next one."
tags: [routing, guards, feature-flags, canmatch]
related: [navigation-lifecycle, can-activate, lazy-routes, guard-factories]
since: "14.2"
---
> **In one line:** `canMatch` runs while the router is *choosing* a route. Returning `false` does not cancel anything, it just skips to the next route that matches the same path.

## The idea

`canActivate` answers "may this user enter *this* page?". `canMatch` answers a different question: "should this route even be a candidate?". That difference unlocks something `canActivate` cannot do, which is several routes with **the same path** where the first one whose guard passes wins.

Typical uses are feature flags, A/B experiments and role-specific dashboards. The user always goes to `/dashboard`, and the router quietly picks the right component for them.

It also changes lazy loading. When `canMatch` fails, the router never downloads that route's chunk. A `canActivate` guard on a lazy route runs *after* the code has loaded, so an admin bundle is downloaded by people who are then turned away.

| Guard | If it returns `false` | Lazy chunk loaded? |
|---|---|---|
| `canActivate` | navigation is cancelled | yes, already downloaded |
| `canMatch` | router tries the next route | no, skipped |

## See it

```typescript
export const adminMatch: CanMatchFn = () => inject(AuthService).hasRole('admin');

export const routes: Routes = [
  {
    path: 'dashboard',
    canMatch: [adminMatch],
    loadComponent: () => import('./admin-dashboard').then(m => m.AdminDashboard),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./user-dashboard').then(m => m.UserDashboard),
  },
];
```

An admin gets `AdminDashboard`, everybody else falls through to the second route, and the admin chunk is never sent to them.

## Go deeper

`canMatch` replaces the older `canLoad`, which is deprecated. It does everything `canLoad` did, and also works for non-lazy routes.

Because the guard runs on *every* matching attempt, keep it cheap and synchronous where you can, reading a signal or a cached value rather than making a request. If you do need an asynchronous answer, the router waits, but each navigation pays for it.

If no route passes, the wildcard `**` catches the URL, so keep a not-found route at the end.

A feature-flag version needs no new tools. Read the flag from a service, and let the router fall back to the stable page when the flag is off:

```typescript
export const newCheckoutMatch: CanMatchFn = () => inject(FeatureFlags).isOn('new-checkout');

export const routes: Routes = [
  { path: 'checkout', canMatch: [newCheckoutMatch], component: CheckoutV2 },
  { path: 'checkout', component: CheckoutV1 },   // everyone else
];
```

Rolling the feature out, or back, is now a flag change rather than a deployment, and each user always sees one coherent version at the same URL.

## Watch out

- Using `canActivate` on a lazy admin route and assuming the bundle stays private. It has already downloaded.
- Putting an expensive request in the guard, so every navigation is slow.
- Forgetting a final fallback route when all candidates can fail.

## Remember

- `canMatch` picks among routes; `false` means "try the next one".
- It prevents the lazy chunk from loading at all.
- It replaces `canLoad` and suits feature flags and roles.

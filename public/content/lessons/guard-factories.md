---
slug: guard-factories
title: "Guard factories"
topic: routing
kind: technique
summary: "Write one configurable guard function instead of a copy for every role or feature flag."
tags: [routing, guards, factories, reuse]
related: [can-activate, can-match, navigation-lifecycle, inject-function]
---
> **In one line:** A guard factory is a function that *returns* a guard. You pass the role or flag in the route config, and one implementation serves every case.

## The idea

Guards are plain functions, so you can build them with ordinary function composition. The need shows up quickly: you write `adminGuard`, then `editorGuard`, then `managerGuard`, and all three differ by a single string.

A factory removes the duplication. The outer function takes the parameter and returns the guard function. The route reads declaratively, `canActivate: [roleGuard('admin')]`, and a reader sees the rule without opening the file.

```flow
config: `roleGuard('admin')` | called once, when routes are defined @primary
guard: `CanActivateFn` | the function the router stores @blue
check: Runs on navigation | `inject()` works here @green
config -> guard: returns
guard -> check: invoked by the router
```

Notice the two stages. The factory runs once when the route table is built, so it is *not* in an injection context. The returned guard runs per navigation, inside one, which is where `inject()` belongs.

## See it

```typescript
export function roleGuard(role: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);            // inside the returned function
    const router = inject(Router);
    return auth.hasRole(role) || router.createUrlTree(['/forbidden']);
  };
}

export function featureFlagMatch(flag: string): CanMatchFn {
  return () => inject(FeatureFlags).isOn(flag);
}
```

```typescript
export const routes: Routes = [
  { path: 'admin', component: AdminPage, canActivate: [roleGuard('admin')] },
  { path: 'reports', component: ReportsPage, canActivate: [roleGuard('manager')] },
  {
    path: 'beta',
    canMatch: [featureFlagMatch('new-search')],
    loadComponent: () => import('./beta-search').then(m => m.BetaSearch),
  },
];
```

## Go deeper

Calling `inject()` in the *outer* function is the common mistake. It throws an injection-context error, because route definitions are evaluated at module load, long before any injector is in scope. Move the call inside the returned arrow function.

You can combine guards without writing new ones. A small helper that takes several guards and runs them in order keeps `canActivate: [allOf(authGuard, roleGuard('admin'))]` readable. Listing both in the array also works, and the router runs them in parallel.

Factories test as easily as plain guards: build the guard with a value and call it inside `TestBed.runInInjectionContext`.

## Watch out

- Calling `inject()` in the outer factory function. It runs outside an injection context.
- Copy-pasting a near-identical guard per role instead of parameterising it.
- Putting business rules in the route table. Keep the factory thin and delegate to a service.

## Remember

- A guard factory returns a guard; the argument configures it.
- `inject()` goes in the returned function, not the factory.
- It makes route configs declarative and removes duplication.

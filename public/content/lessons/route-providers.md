---
slug: route-providers
title: "Feature-scoped services with route providers"
topic: architecture
kind: technique
summary: "Provide a service on a route so it exists, and is shared, only for that route and its children."
tags: [architecture, providers, routing, scope]
related: [feature-folders, provider-scopes, store-scope, lazy-boundaries]
---
> **In one line:** The `providers` array on a route creates a service instance that lives with that route and its children, instead of one for the whole app.

## The idea

Not every service should be a root singleton. A diary feature's store has no business existing before the user opens the diary, and it should not leak into other features. Route-level providers give a feature its own services, scoped to where they are used.

| Where provided | Instances | Lives |
|---|---|---|
| `@Injectable({ providedIn: 'root' })` | one for the app | the whole session |
| `providers` on a route | one for that route and its children | while the route is active |
| `providers` on a component | one per component instance | until the component is destroyed |

A route's providers make an **environment injector** for the route. Every component under it, including children and lazy-loaded descendants, resolves the same instance.

## See it

```typescript
export const DIARY_ROUTES: Routes = [
  {
    path: '',
    providers: [DiaryStore, DiaryApi],              // created for this route tree
    children: [
      { path: '', component: DiaryPage },
      { path: ':id', component: SetDetailPage },    // shares the same DiaryStore
    ],
  },
];
```

```typescript
@Component({ selector: 'app-set-detail-page', template: `...` })
export class SetDetailPage {
  private readonly store = inject(DiaryStore);      // the route's instance
}
```

Both pages inject the same `DiaryStore`, and the app-wide injector never sees it.

## Go deeper

A service left out of `providedIn: 'root'` has no default provider, so it must be provided somewhere on the path to every consumer. Forgetting that gives `No provider for DiaryStore` at runtime, and the fix is to provide it on the route, not to add `providedIn: 'root'` out of habit.

The instance survives navigation between the route's children, which is the point: master and detail pages share state without a global. It is also why it is **recreated** when the user leaves the route and comes back, so state does not leak across visits. If you need it to persist, hold it in a root service instead.

Route providers combine well with lazy loading. Put them on a lazy route and the service code is in the feature's chunk, created on first visit, with no cost to the initial bundle.

Do not let a root service inject a route-scoped one. The root injector cannot see below it, so the lookup fails. Dependencies must flow from the narrower scope towards the wider one.

## Watch out

- Providing a service on a route and also `providedIn: 'root'`, creating two instances.
- A root service depending on a route-scoped one.
- Expecting route-scoped state to survive leaving the route.

## Remember

- Route `providers` scope a service to the route and its children.
- The instance is shared by the subtree and recreated on re-entry.
- Narrow scopes may inject wider ones, never the reverse.

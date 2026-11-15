---
slug: store-scope
title: "Where a store lives"
topic: state
kind: technique
summary: "Component providers give each instance its own store; providedIn root gives one for the whole app."
tags: [state, signalstore, providers, lifetime]
related: [signal-store-basics, provider-scopes, pitfall-second-instance, choosing-state-tool]
---
> **In one line:** Where you provide a store decides its lifetime. Component `providers` mean one store per instance; `providedIn: 'root'` means one for everyone.

## The idea

The same `signalStore` can be local or global, and the only difference is how it is provided. This is the dependency-injection scope rule applied to state, and mixing it up produces a clean bug.

| Provided in | Instances | Destroyed when | Use for |
|---|---|---|---|
| a component's `providers` | one per component instance | that component is destroyed | a widget's own filter, a wizard step |
| a route's `providers` | one per route activation | the route is torn down | a feature's working state |
| `signalStore({ providedIn: 'root' }, ...)` | one for the app | never | the session, cart, theme |

Local stores are disposable by design: state, `rxMethod` subscriptions and all disappear together with the component, with no cleanup code.

## See it

```typescript
// Local: every widget instance gets an isolated store
@Component({
  selector: 'app-product-filter-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductFilterStore],
  template: `
    <input type="search" [value]="store.searchTerm()" (input)="onSearch($event)" />
    <p>{{ store.resultCount() }} results</p>
  `,
})
export class ProductFilterWidget {
  protected readonly store = inject(ProductFilterStore);
}
```

```typescript
// Global: one app-wide instance, no providers array needed
export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState({ userId: null as string | null }),
);
```

## Go deeper

The classic accident is `providedIn: 'root'` on something that should be local. Two product-filter widgets on a page then share one search term, and typing in one changes the other. The fix is to remove `providedIn` and provide the store in the component, which is exactly the second-instance pitfall in reverse.

Before SignalStore, NgRx offered `@ngrx/component-store`, an RxJS class you extend, with `select`, `updater` and `effect`. It is still supported and common in existing code. The concepts map directly: `select` becomes `withComputed`, `updater` becomes a method calling `patchState`, and `effect` becomes `rxMethod`. For new code, prefer SignalStore: it is signal-native and needs no `toSignal()` bridging.

A child component can inject its parent's component-provided store, because the injector tree resolves upwards. That is a clean way to share a feature's state down a subtree without a global.

## Watch out

- `providedIn: 'root'` on state that should be per-instance.
- Providing a global store in a component and creating a second copy.
- Expecting a route-provided store to survive a navigation away.

## Remember

- Component providers: one store per instance, destroyed with it.
- `providedIn: 'root'`: one shared store.
- Choose scope from how widely the state is shared.

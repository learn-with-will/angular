---
slug: why-state-management
title: "Why state needs a home"
topic: state
kind: concept
summary: "Shared state that every component copies, mutates and refetches goes wrong. A single owner fixes four specific problems."
tags: [state, architecture, ngrx, signals]
related: [choosing-state-tool, store-redux-flow, signal-store-basics, facade-pattern]
---
> **In one line:** When many parts of the app need the same data, give it one owner and one way to change it. Otherwise copies drift apart and bugs become impossible to trace.

## The idea

A "logged-in user" is needed by the header, the sidebar and a dozen features. A "cart" is updated on a product page and read on a checkout page that was not even on screen at the time. If each component fetches, stores and mutates its own copy, four problems appear:

| Problem | What you see |
|---|---|
| duplicated state | the same data in several places, drifting out of sync |
| prop drilling | inputs and outputs passed through components that do not care |
| unpredictable mutation | any code can change a shared object at any time |
| hard-to-trace async bugs | race conditions between in-flight requests, with no log of what happened |

State management is the answer to all four: **one source of truth**, changed only through explicit operations, read by anyone.

It does not have to mean a big library. The right size depends on how widely the state is shared, so think of it as a ladder and climb only as far as you need.

```tree
Where does this state live? | start low, climb when forced @primary
  Component signal | used by one component @green
  Component-provided SignalStore | one feature or widget, with logic @blue
  Root service or root SignalStore | shared across features @amber
  NgRx Store | large, event-driven, needs an action history @red
```

## See it

The lowest rung is often enough:

```typescript
@Component({
  selector: 'app-cart-badge',
  template: `<span>{{ count() }}</span>`,
})
export class CartBadge {
  private readonly cart = inject(CartService);
  protected readonly count = computed(() => this.cart.items().length);
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  add(item: CartItem): void {
    this._items.update((list) => [...list, item]);
  }
}
```

## Go deeper

A service holding a private writable signal and exposing it read-only is already a store: one owner, one way to change it, many readers. Problems one, two and three are solved without any library.

Reach for a library when you need more: a documented history of *why* state changed (actions), side effects kept out of components, time-travel debugging, or conventions that a large team can follow without reinventing them.

The classic mistake is starting at the top rung. Putting a dropdown's open flag in a global store creates actions and reducers for something one component owns, and couples unrelated features through it.

## Watch out

- Copying shared data into each component.
- Putting purely local state in a global store.
- Exposing a writable signal so anyone can change it.

## Remember

- One owner and one way to change shared state.
- Climb the ladder only as far as the problem demands.
- A service with a read-only signal is already a small store.

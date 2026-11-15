---
slug: signal-state-service
title: "Signal state service"
topic: signals
kind: pattern
summary: "Share state through a service: private writable signal, read-only exposure, changes only through methods."
tags: [signals, services, state, encapsulation]
related: [as-readonly, computed, signal, pitfall-mutating-signal-array]
since: "17"
---
> **In one line:** Keep the writable signal private inside a service, expose read-only signals and `computed()` selectors, and change state only through the service's methods.

## The idea

Putting a plain `signal()` on a shared service lets any component overwrite it, and the rules of the state go out the window. The fix is a small, repeatable shape:

| Part | Visibility | Role |
|---|---|---|
| `private _count = signal(0)` | private | the only place state can change |
| `count = _count.asReadonly()` | public | read access |
| `isZero = computed(…)` | public | derived selectors |
| `increment()`, `reset()` | public | the only way to write, so the rules live here |

State stays predictable as the app grows, because every change flows through one door. Components read, and ask the store to act. The picture to hold on to is a one-way street: writes go in through a method, reads come out through a read-only view, and there is no way to cut across.

```flow
write: Component | asks the store to act @blue
state: `_count` | private, writable @red
read: Component | reads `store.count()` @blue
write -> state: increment()
state -> read: asReadonly()
```

## See it

```typescript
@Injectable({ providedIn: 'root' })
export class CounterStore {
  private readonly _count = signal(0);

  readonly count = this._count.asReadonly();
  readonly isZero = computed(() => this._count() === 0);

  increment(): void { this._count.update(n => n + 1); }
  decrement(): void { this._count.update(n => Math.max(0, n - 1)); } // rule: never below zero
}
```

```typescript
@Component({
  selector: 'app-counter-page',
  template: `
    <p>{{ store.count() }}</p>
    <button (click)="store.decrement()" [disabled]="store.isZero()">-1</button>
  `,
})
export class CounterPage {
  protected readonly store = inject(CounterStore); // store.count.set(…) will not compile
}
```

## Go deeper

With `providedIn: 'root'` there is one store for the whole app, which suits shared state like a cart or the current user. To scope the state to one feature, provide the service in that component's `providers` instead; each instance of the component then gets its own store, and it is destroyed with the component.

The same shape scales to objects. Keep one private signal holding the whole state and publish `computed()` slices of it, so components subscribe only to the part they display:

```typescript
interface CartState { items: Item[]; coupon: string | null }

private readonly state = signal<CartState>({ items: [], coupon: null });

readonly items = computed(() => this.state().items);
readonly hasCoupon = computed(() => this.state().coupon !== null);

addItem(item: Item): void {
  this.state.update(s => ({ ...s, items: [...s.items, item] }));
}
```

You do not always need a service. State used by one component can stay as a private signal inside it. Reach for a store when several components share the state, or when it must outlive the component that created it.

Stores are also pleasant to test. Everything goes through methods and signals, so a test can create the store, call `increment()` and check `store.count()`, with no component and no DOM involved.

## Watch out

- If a component can call `.set()` on the store's signal, invariants such as "never below zero" are no longer guaranteed. Always expose `.asReadonly()`.
- Update methods must return new objects and arrays. See "Pitfall: mutating a signal's array".

## Remember

- Private writable signal, public read-only view, methods for writes.
- Put derived values in `computed()` selectors next to the state.
- Business rules live in the store's methods, not in components.

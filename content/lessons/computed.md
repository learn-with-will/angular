---
slug: computed
title: "computed()"
topic: signals
kind: api
summary: "A read-only signal derived from other signals; lazy and cached."
tags: [signals, derived-state, memoization]
related: [signal, effect, linked-signal, pitfall-effect-derived-state]
since: "17"
---
> **In one line:** `computed(() => …)` creates a read-only signal whose value is calculated from other signals. It stays in sync on its own and only recalculates when it has to.

## The idea

Every UI has two kinds of state. *Source* state is what you set directly: a form value, a fetched list, a toggle. *Derived* state is calculated from it: a filtered list, a total price, a validation message. `computed()` is the tool for the second kind.

In spreadsheet terms, `B1 = A1 * 2` is a formula cell. You never type into it, it recalculates itself when `A1` changes, and if nobody looks at it the sheet does not even bother computing it.

Three properties make it safe to use liberally:

| Property | What it means |
|---|---|
| **Read-only** | There is no `.set()` or `.update()`; the function is the only source of truth. |
| **Lazy** | The function does not run when you declare it, only the first time something reads it. |
| **Memoized** | The result is cached and reused until a signal it read actually changes. |

Because of that, expensive work such as filtering or sorting a large array is fine inside a `computed()`. Compare it with a getter or a method called from a template: those run again on every change detection, whether or not their inputs changed. A computed does the work only when a dependency really moved, and otherwise hands back its stored answer.

```sequence
actor code: Your code
actor total: `total` | computed @blue
actor price: `price` | signal @primary
code -> total: Reads `total()` | first read, so the function runs
total -> price: Reads `price()` | the dependency is recorded
code -> total: Reads `total()` again | cached, the function does not run
code -> price: `price.set(30)` | `total` is marked stale
code -> total: Reads `total()` | stale, so it recalculates
```

## See it

```typescript
import { signal, computed } from '@angular/core';

const price = signal(25);
const quantity = signal(4);

const total = computed(() => price() * quantity());

console.log(total()); // 100  <- runs now, on the first read
console.log(total()); // 100  <- cached, the function does not run again
price.set(30);
console.log(total()); // 120  <- a dependency changed, so it recalculates
```

## Go deeper

A computed can read other computeds, forming a chain in which each link caches independently. A cart is the classic case: the total depends on the tax, which depends on the subtotal, which depends on the items.

```typescript
const items = signal([{ price: 10, qty: 2 }, { price: 5, qty: 1 }]);

const subtotal = computed(() => items().reduce((sum, i) => sum + i.price * i.qty, 0));
const tax = computed(() => subtotal() * 0.08);
const total = computed(() => subtotal() + tax());   // total -> tax -> subtotal -> items
```

Change one item and every link above it refreshes, with no manual bookkeeping. If the new `subtotal` happens to equal the old one, nothing downstream recalculates, because computed signals compare their results too. For objects that are equal in content but not in identity, pass `{ equal: ... }` as the second argument to supply your own comparison.

Dependencies are tracked **dynamically**: only the signals actually read during the *last* run count.

```typescript
const showTotal = signal(true);
const amount = signal(0);

const label = computed(() => (showTotal() ? `Total: ${amount()}` : 'Hidden'));
```

While `showTotal()` is `false`, `amount` was not read, so changing `amount` does not recompute `label`. That is correct behavior, not a bug.

## Watch out

- Keep the function pure: no logging, HTTP calls or writes to other signals. Side effects belong in `effect()`.
- A `computed()` that nobody reads never runs. Do not expect it to be eager like `combineLatest`.
- Never mutate state inside the function, not even "just once". It may run more or fewer times than you expect because of laziness and caching.

## Remember

- `computed()` is a read-only, lazy, memoized signal derived from other signals.
- Only the signals read in the last run are dependencies.
- Derive with `computed()` instead of keeping a second signal you must remember to update.

---
slug: pitfall-mutating-signal-array
title: "Pitfall: mutating a signal's array"
topic: signals
kind: pitfall
summary: "Pushing into an array held by a signal changes nothing on screen; replace the array instead."
tags: [signals, immutability, arrays]
related: [signal, signals-in-templates, signal-state-service, for-block]
since: "17"
---
> **In one line:** A signal only notifies when its value is a *different* value. `items().push(x)` keeps the same array, so Angular sees no change. Replace the array instead.

## The idea

Signals compare the old and new value with `Object.is`. For arrays and objects that means *the same reference counts as unchanged*, even if you edited the contents. So after `items().push('milk')` the array holds a new item, but the signal still holds the same array, nothing is notified, and the screen stays as it was.

Because `.mutate()` does not exist, the rule is simple: treat values as immutable and always produce a new one. This is the same habit as in other state libraries, and it has a bonus: a new reference is also the cheapest possible "did it change?" check.

How to recognise the bug: the data is clearly right (a `console.log` shows the new item), yet the screen is stale. Often it "fixes itself" later, when something unrelated triggers a refresh, which makes the problem look random. It is not random: the signal never announced the change.

The same idea applies to every kind of edit:

| Instead of mutating | Replace with |
|---|---|
| `list.push(x)` | `[...list, x]` |
| `list.splice(i, 1)` | `list.filter((_, idx) => idx !== i)` |
| `obj.done = true` | `{ ...obj, done: true }` |
| `list[i].done = true` | `list.map(o => (o.id === id ? { ...o, done: true } : o))` |

## See it

```typescript
const items = signal<string[]>([]);

// Before: same array reference, so Angular sees no change
items().push('milk');
items.set(items());

// After: a brand-new array every time
items.update(list => [...list, 'milk']);
```

A real case, toggling one todo in a list without touching the others:

```typescript
toggle(id: number): void {
  this.todos.update(list =>
    list.map(t => (t.id === id ? { ...t, done: !t.done } : t)),
  );
}
```

Only the changed todo is a new object, so `@for` with `track todo.id` reuses every other row. Objects follow the same rule. Spread each level you change:

```typescript
const user = signal({ name: 'Ada', address: { city: 'London' } });

// Before: edits the nested object in place, nothing updates
user().address.city = 'Paris';

// After: copy every level on the way down to the change
user.update(u => ({ ...u, address: { ...u.address, city: 'Paris' } }));
```

## Go deeper

You can customize the comparison with `{ equal }` when creating a signal, for example to treat two objects with the same `id` as equal. Even so, the default `Object.is` plus immutable updates is almost always the right combination, and it is what `computed()` and templates expect. Libraries such as Immer can write "mutating" code that produces new copies behind the scenes, but for most signal state a spread, `map` or `filter` is all you need.

## Watch out

- `items.set(items())` after a `push()` still does nothing: it is the same reference.
- Spreading is shallow. When you change something nested, copy each level you touch.
- A `computed()` that returns `list.sort()` mutates the source array in place. Sort a copy: `[...list].sort()`.

## Remember

- Signals compare with `Object.is`, so mutating in place is invisible.
- Create a new array or object with spread, `map` or `filter`.
- There is no `.mutate()`; use `.update()` with a pure function.

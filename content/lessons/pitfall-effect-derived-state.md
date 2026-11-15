---
slug: pitfall-effect-derived-state
title: "Pitfall: syncing state with effect()"
topic: signals
kind: pitfall
summary: "Copying one signal into another inside an effect is fragile; derive it with computed() or linkedSignal()."
tags: [signals, effect, derived-state]
related: [computed, linked-signal, effect, fine-grained-reactivity]
since: "20"
---
> **In one line:** If an `effect()` exists only to write one signal from other signals, replace it with `computed()`. Effects are for leaving Angular's state, not moving data around inside it.

## The idea

It is tempting: "when `firstName` changes, update `fullName`". An effect makes that read naturally, and it appears to work. The trouble is *when* it works. An effect runs later, during change detection, so the copied value lags behind its sources for a moment. That can surface as `ExpressionChangedAfterItHasBeenChecked` errors, extra change-detection cycles, or circular updates when two effects write to each other.

A derived value is just a formula, and Angular already has a tool for formulas that is lazy, cached and never stale. Pick the tool by what the value needs to do:

| The value is... | Use |
|---|---|
| a formula of other signals | `computed()` |
| derived, but the user can override it | `linkedSignal()` |
| pushed to `localStorage`, the DOM, a chart or logs | `effect()` |

> **Note:** On Angular 17 and 18, writing a signal inside `effect()` even throws error NG0600 unless you pass `allowSignalWrites: true`. Since Angular 19 the write is allowed, but it is still an anti-pattern.

## See it

```typescript
// Before: an effect copies signals into another signal
readonly firstName = signal('Ada');
readonly lastName = signal('Lovelace');
readonly fullName = signal('');

constructor() {
  effect(() => this.fullName.set(`${this.firstName()} ${this.lastName()}`));
}

// After: derive it, with no effect at all
readonly fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
```

The "after" is shorter, has no constructor, and `fullName` can never be out of date. A quick smell test: if the body of an effect is nothing but `someSignal.set(...)`, it is not a side effect, it is a formula in disguise. Filtering a list is the other common one:

```typescript
// Before: the filtered list is a second source of truth
effect(() => this.visible.set(this.items().filter(i => i.name.includes(this.term()))));

// After: always correct, computed only when read
readonly visible = computed(() => this.items().filter(i => i.name.includes(this.term())));
```

## Go deeper

Here is the lag in slow motion for the `fullName` effect:

1. `firstName.set('Grace')` runs, and the effect is only *scheduled*.
2. Anything that reads `fullName()` right now still sees `'Ada Lovelace'`.
3. Change detection runs the effect, which finally sets `fullName` to `'Grace Lovelace'`.
4. The template renders a second time to pick up the new value.

With `computed()` there is no step 2: the next read recalculates on demand, so the answer is never stale.

There are rare, legitimate cases of an effect writing a signal: reacting to an *external* system, such as a WebSocket message or a browser API, and storing the result. The smell is specifically writing a signal from *other signals*, because that is a formula Angular can already compute for you.

The same trap hides behind other phrasings. "Reset the page number when the filter changes" sounds like a job for an effect that sets `page` to 0. It is really a value that follows a source but can also be changed by hand, which is exactly `linkedSignal()`:

```typescript
readonly page = linkedSignal({ source: this.filter, computation: () => 0 });
```

Whenever `filter` changes, `page` resets to 0, and the user can still move it with `page.set(...)` in between.

## Watch out

- "Reset X when Y changes" is the same trap. That is a job for `linkedSignal()`, not an effect.
- An effect that writes a signal which it also reads can loop. If you need that, the design is usually asking for `computed()`.

## Remember

- `computed()` for anything that is just a formula of other signals.
- `linkedSignal()` when the derived value can be overwritten.
- `effect()` only for side effects outside Angular's reactive state.

---
slug: effect
title: "effect()"
topic: signals
kind: api
summary: "Runs code when created and again whenever a signal it reads changes, for side effects outside Angular state."
tags: [signals, side-effects, injection-context]
related: [computed, effect-cleanup, untracked, pitfall-effect-derived-state]
since: "20"
---
> **In one line:** `effect(() => …)` runs once after it is created and again whenever a signal it reads changes. Use it to reach outside Angular's state: logging, `localStorage`, a chart library.

## The idea

Templates and `computed()` must stay pure, so they cannot write to `localStorage`, redraw a `<canvas>` or send analytics. `effect()` is the bridge from signals to that imperative world. If `computed()` is a formula cell in a spreadsheet, an effect is the rule you attach to it: "email me when this goes above 100". It reacts to the data but is not part of the data.

How it behaves:

- It **always runs at least once**. The first run is scheduled shortly after creation, during change detection, not on the line that creates it.
- It **tracks dependencies dynamically**: whatever signals it read in its latest run.
- It runs **asynchronously**, as part of change detection. Several changes in a row batch into one run.
- It needs an **injection context** (a constructor or field initializer) so Angular can destroy it together with its owner.

```sequence
actor code: Your code | constructor
actor cd: Angular | change detection @blue
actor fx: `effect()` | the callback @primary
actor count: `count` | signal @primary
note code..fx: `effect(() => log(count()))` | created now, not run yet @amber
cd -> fx: Runs the effect | first run, shortly after creation
fx -> count: Reads `count()` | recorded as a dependency
code -> count: `count.set(5)` | writes in a row are batched
cd -> fx: Runs the effect again | because `count` changed
```

> **Tip:** `effect()` is the last tool to reach for. If you are copying one signal into another, you want `computed()`.

## See it

```typescript
@Component({ selector: 'app-cart', template: `…` })
export class Cart {
  readonly items = signal<string[]>([]);

  constructor() {
    // Re-runs whenever `items` changes
    effect(() => {
      localStorage.setItem('cart', JSON.stringify(this.items()));
    });
  }
}
```

A second shape you will meet often is mirroring a signal into the page itself: here the theme is both saved and applied to the document, two things only an imperative API can do:

```typescript
readonly theme = signal<'light' | 'dark'>('light');

constructor() {
  effect(() => {
    const t = this.theme();
    localStorage.setItem('theme', t);                 // persist the choice
    document.body.setAttribute('data-theme', t);      // apply it to the page
  });
}
```

## Go deeper

Outside a constructor there is no injection context, so pass an `Injector` yourself:

```typescript
private readonly injector = inject(Injector);

startLogging(): void {
  const ref = effect(() => console.log(this.count()), { injector: this.injector });
  // later: ref.destroy() stops it early
}
```

Effects are destroyed automatically when their component, directive or application is destroyed, so you rarely clean them up by hand. The `EffectRef` that `effect()` returns has a `destroy()` method for the rare case where you want to stop one early.

Before reaching for an effect, check whether a better tool fits:

| You want to... | Use instead |
|---|---|
| copy or combine signals into another value | `computed()` |
| derive a value the user can also override | `linkedSignal()` |
| load data whenever a signal changes | the resource APIs, such as `httpResource()` |

## Watch out

- Do not use an effect to derive state from other signals. See "Pitfall: syncing state with effect()".
- Calling `effect()` from a plain method without an injector throws.
- For DOM writes, prefer `afterRenderEffect()`, because `effect()` runs before Angular commits changes to the DOM.

## Remember

- An effect runs at least once, then again whenever a signal it read changes.
- It belongs in an injection context, or needs `{ injector }`.
- Use it only for side effects; derive state with `computed()`.

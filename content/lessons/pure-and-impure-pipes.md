---
slug: pure-and-impure-pipes
title: "Pure and impure pipes"
topic: directives-pipes
kind: concept
summary: "Pure pipes re-run only when their input changes; impure ones run on every change detection."
tags: [pipes, change-detection, performance, immutability]
related: [pipe-basics, builtin-pipes, custom-pipe, pitfall-mutating-signal-array]
---
> **In one line:** A **pure** pipe re-runs only when its input value or reference changes, which makes it fast. An **impure** pipe re-runs on every change detection pass.

## The idea

A pipe in a template could be asked to recompute thousands of times a second if Angular re-ran it on every check. To avoid that, pipes are **pure by default**: Angular remembers the last input, and if the input is the same, it reuses the last output without calling the pipe at all.

"The same" means the same *reference*, not the same contents. That is cheap and fast, and it is the reason pure pipes are safe to use freely.

| | Pure (default) | Impure |
|---|---|---|
| Re-runs when | the input reference changes | on every change detection |
| Cost | very low | paid on every pass |
| Sees in-place mutation | no | yes |
| Examples | `date`, `currency`, `uppercase`, `percent` | `async`, `json`, `slice`, `keyvalue` |

The impure built-ins are impure for a reason: `async` must react to emissions, and `slice`, `keyvalue` and `json` must notice that an array or object was edited in place.

## See it

The surprising behavior comes from mutation. A pure pipe sees the same array and does nothing:

```typescript
// Before: pushes into the same array, so a pure pipe sees no change
addItem(item: Item): void {
  this.items.push(item);
}

// After: a new array every time, so every pipe and signal notices
addItem(item: Item): void {
  this.items = [...this.items, item];
}
```

The same rule is why signals want new arrays and objects instead of edits. A new reference is the one signal that tells Angular "this changed", for pipes and for signals alike.

## Go deeper

You rarely need to think about this for everyday formatting. It matters in two situations: when something does not update because it was mutated in place, and when a slow impure pipe is quietly running on every pass.

A custom pipe is pure unless you opt out with `pure: false`. Resist that option. If you need an impure pipe, the cheaper design is usually a `computed()` in the class that recalculates only when its signals change, which gives you the same freshness without the per-check cost.

## Watch out

- Mutating an array or object in place and expecting a pure pipe to update. Replace it with a new one.
- Using `json`, `slice` or `keyvalue` on large data in a hot path. They run on every change detection.
- Marking a custom pipe `pure: false` just to make a stale value refresh. Fix the mutation instead.

## Remember

- Pure pipes (the default) run only when the input reference changes.
- Impure pipes run on every pass; `async`, `json`, `slice` and `keyvalue` are impure.
- Replace arrays and objects instead of mutating them so pipes and signals notice.

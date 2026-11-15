---
slug: timing-operators
title: "debounceTime, throttleTime, distinctUntilChanged"
topic: rxjs
kind: api
summary: "Control when and whether values pass: wait for a pause, rate-limit, or skip repeats."
tags: [rxjs, debounce, throttle, distinct]
related: [switchmap-typeahead, pipe-and-operators, form-value-changes, creation-functions]
---
> **In one line:** `debounceTime` waits for quiet, `throttleTime` limits the rate, and `distinctUntilChanged` skips repeats.

## The idea

Event sources are noisy: a user types ten letters in a second, a scroll fires hundreds of events. These three operators tame them, and they answer different questions:

| Operator | Behaviour | Use it for |
|---|---|---|
| `debounceTime(300)` | emits the latest value after 300 ms with no new one | search boxes, auto-save |
| `throttleTime(200)` | emits a value, then ignores others for 200 ms | scroll, resize, rapid clicks |
| `distinctUntilChanged()` | skips a value equal to the previous one | avoiding repeated work |

The difference between the first two is the classic confusion. **Debounce** waits until the user *stops*, so nothing arrives while they keep going. **Throttle** lets values through *while* they continue, at a limited rate.

## See it

```typescript
// Search: only after the user pauses, and only for a new term
this.searchControl.valueChanges
  .pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntilDestroyed(),
  )
  .subscribe((term) => this.search(term));

// Scroll position: at most one update every 200 ms, but still live
fromEvent(window, 'scroll')
  .pipe(throttleTime(200), takeUntilDestroyed())
  .subscribe(() => this.updateBackToTopButton());
```

## Go deeper

Order is part of the meaning. `debounceTime` first and then `distinctUntilChanged` compares the *debounced* values. If the user types "ab", deletes back to "a", then retypes "ab" within the window, only the final "ab" is considered, and it differs from the last emitted value, so a search runs. Reverse them and the comparison happens on every keystroke instead.

`throttleTime` accepts a config object: `{ leading: true, trailing: true }` controls whether the first and the last value in a window are emitted. For scroll handlers, enabling `trailing` makes sure the final resting position is reported, not only the first event.

For objects, `distinctUntilChanged()` compares by reference, so two equal-looking objects both pass. Give it a comparator, `distinctUntilChanged((a, b) => a.id === b.id)`, or compare a derived key.

Debouncing delays the *reaction*, not the value. The field still shows what was typed immediately, which is why it feels responsive.

Choose the delay from the interaction, not from habit. Around 300 ms suits typing, since most people pause that long between words. Auto-save usually wants a longer pause, such as one or two seconds, plus an immediate save when the user leaves the field. Scroll and resize handlers feel smooth at 100 to 200 ms with throttling.

Whatever you choose, make it a named constant. A bare `300` repeated across the app is a decision nobody can find and tune later.

## Watch out

- Using `throttleTime` for a search, which fires mid-typing.
- Relying on `distinctUntilChanged` for object values without a comparator.
- Forgetting `takeUntilDestroyed()` on `fromEvent` streams.

## Remember

- Debounce waits for quiet; throttle limits the rate.
- `distinctUntilChanged` skips equal neighbours; objects need a comparator.
- The order of timing operators changes the result.

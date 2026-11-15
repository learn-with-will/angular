---
slug: untracked
title: "untracked()"
topic: signals
kind: api
summary: "Reads signals without making them dependencies of the running effect or computed."
tags: [signals, dependency-tracking, effect]
related: [effect, computed, effect-cleanup, fine-grained-reactivity]
since: "17"
---
> **In one line:** `untracked(() => …)` lets an `effect()` or `computed()` read a signal's value without re-running when that signal changes.

## The idea

Inside a reactive context, every signal you call becomes a dependency. That is how Angular knows when to re-run an `effect()` or recalculate a `computed()`, and most of the time it is exactly what you want.

Occasionally you need a signal's *current value* but not its changes. Picture an effect that logs "user changed" and wants to include the current page number in the log line. If `page` were tracked, the effect would log again on every page turn, even though nothing about the user changed.

| How you read it | Re-runs when it changes? |
|---|---|
| `count()` | yes, it becomes a dependency |
| `untracked(count)` | no |
| `untracked(() => other.value())` | no, nothing read inside is tracked |

`untracked()` marks a read as incidental: "I need this value now, but do not wake me for it."

## See it

```typescript
import { effect, untracked } from '@angular/core';

effect(() => {
  // Re-runs when `user` changes...
  console.log(`User: ${user()}, page: ${untracked(page)}`);
  // ...but NOT when `page` changes.
});
```

A more realistic case is autosave. The effect should save whenever the draft changes, and should record who the author is, but switching the logged-in user alone must not trigger a save:

```typescript
effect(() => {
  const text = draft();                    // tracked: save whenever the draft changes
  const author = untracked(currentUser);   // read, but a user switch alone does not re-save
  api.save({ text, author });
});
```

Reading the situation as "what should wake this effect up?" is the quickest way to decide: anything that should is tracked, anything that is just context is `untracked`.

## Go deeper

`untracked()` accepts any function, so you can wrap a call into other code whose signal reads should not leak into the current effect. This matters most with services you do not control: a logger or analytics helper may read signals internally, and without `untracked()` those reads would silently become dependencies of your effect.

```typescript
effect(() => {
  const id = userId();                      // tracked: re-run when the user changes
  untracked(() => analytics.track(id));     // reads inside here are not dependencies
});
```

Writing to a signal does not create a dependency either, so you do not need `untracked()` just to call `.set()` or `.update()`. It is for *reads*.

If you find yourself reaching for `untracked()` often, treat it as a prompt to look at the design. Usually the effect is doing two jobs, one that depends on the signal and one that merely uses it, and splitting it into two effects makes both clearer.

## Watch out

- Do not use `untracked()` to hide a real dependency. If the output depends on a signal, the effect *should* re-run when it changes.
- It only affects reads made inside it. A signal read earlier in the same effect is still tracked.

## Remember

- Calling a signal in a reactive context makes it a dependency; `untracked()` opts out.
- It works on a signal (`untracked(count)`) or on any function.
- Use it sparingly, only for reads that are incidental to what the code does.

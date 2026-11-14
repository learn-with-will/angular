---
slug: effect-cleanup
title: "Effect cleanup: onCleanup"
topic: signals
kind: technique
summary: "Cancel timers, listeners and requests started in an effect before its next run and on destroy."
tags: [signals, effect, cleanup]
related: [effect, untracked, pitfall-effect-derived-state, fine-grained-reactivity]
since: "20"
---
> **In one line:** The function passed to `effect()` receives `onCleanup`. Register a callback there to stop whatever the run started, before the next run and when the effect is destroyed.

## The idea

An effect re-runs every time a signal it read changes. If a run starts something long-lived, such as a timer, an event listener or an in-flight request, the previous one is still alive when the next run starts. They pile up: two timers firing, two listeners reacting, an old response overwriting a newer one.

`onCleanup` fixes that. The callback you register runs right before the effect runs again, and once more when the owner is destroyed. Each run tidies up after itself.

```sequence
actor cd: Angular | change detection @blue
actor fx: Effect | the callback @primary
actor timer: Timer | `setInterval`
cd -> fx: Runs the effect | `refreshMs()` is 1000
fx -> timer: Starts a timer | and registers `onCleanup`
note cd: `refreshMs.set(500)` | a dependency changes @amber
cd -> fx: Runs the cleanup first | before the next run
fx -> timer: `clearInterval` | the old timer stops
cd -> fx: Runs the effect again | with `refreshMs()` at 500
fx -> timer: Starts a new timer | and registers a new cleanup
```

## See it

```typescript
effect((onCleanup) => {
  const ms = this.refreshMs();                       // tracked: re-run when it changes
  const id = setInterval(() => this.refresh(), ms);

  onCleanup(() => clearInterval(id));                // the old timer stops first
});
```

Change `refreshMs` and Angular first clears the old interval, then runs the effect again with a new one.

## Go deeper

You might ask why not just clear things in `ngOnDestroy`. The reason is frequency: `ngOnDestroy` runs once, when the component goes away, but an effect can re-run dozens of times while the component lives. Only a per-run cleanup can stop the *previous* run's work before the next one starts.

| Moment | Does the cleanup run? |
|---|---|
| Just after the first run | no |
| Before the effect runs again | yes |
| When the owner is destroyed | yes |
| When you call `destroy()` on the `EffectRef` | yes |

The same shape works for anything that needs an undo: removing a listener, aborting a `fetch`, disconnecting an observer.

```typescript
effect((onCleanup) => {
  const controller = new AbortController();
  fetch(`/api/search?q=${this.query()}`, { signal: controller.signal })
    .then(r => r.json())
    .then(results => this.results.set(results))
    .catch(() => {});                    // an aborted fetch rejects; ignore that one

  onCleanup(() => controller.abort());   // a newer query cancels the older request
});
```

Because the cleanup runs when the owner is destroyed too, you get teardown on navigation for free. Listeners follow the same pattern: add in the run, remove in the cleanup.

```typescript
effect((onCleanup) => {
  const el = this.target();                       // a signal holding an element
  const onScroll = () => this.scrolled.set(true);

  el.addEventListener('scroll', onScroll);
  onCleanup(() => el.removeEventListener('scroll', onScroll));
});
```

A good habit is to write the cleanup on the line right after the setup. They are a pair, and keeping them together makes it obvious when one is missing.

Cleanup also covers effects that never re-run. If the component is destroyed after the first run, the cleanup registered in that run still fires once, so the listener or timer cannot outlive the component.

## Watch out

- Without a cleanup, every re-run leaves another timer or subscription running.
- `onCleanup` belongs to one run. Register it each time the effect runs, right after starting the work.
- Reading signals inside the timer callback does not track them. Only reads made directly in the effect body count.

## Remember

- `onCleanup(fn)` runs `fn` before the next run and on destroy.
- Use it for timers, listeners, subscriptions and in-flight work.
- Register it in every run, right after the work it undoes.

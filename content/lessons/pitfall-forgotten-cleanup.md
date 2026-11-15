---
slug: pitfall-forgotten-cleanup
title: "Pitfall: forgetting to clean up"
topic: components
kind: pitfall
summary: "A timer or subscription started in a component keeps running after the component is gone."
tags: [components, memory-leak, cleanup, rxjs]
related: [ng-on-destroy, lifecycle-overview, effect-cleanup, ng-on-init]
---
> **In one line:** Angular destroys a component, but not the interval, listener or subscription you started in it. Those keep running, hold memory and fire callbacks into a component that no longer exists.

## The idea

A component's life ends when it leaves the page, yet browser APIs know nothing about that. `setInterval` will call you every second forever. An `addEventListener` stays attached to `window`. An endless Observable keeps emitting into a subscriber nobody is looking at.

The symptoms arrive slowly: the page gets sluggish after visiting a screen many times, a log line prints from a screen you left, memory climbs in the browser's task manager. Because each leaked piece holds a reference to the old component, the whole component and its data cannot be garbage collected.

The rule is symmetrical: whatever a component starts, it stops. Each source has its own way to stop:

| What you started | How to stop it |
|---|---|
| `setInterval` or `setTimeout` | `clearInterval` or `clearTimeout` in `ngOnDestroy` |
| `addEventListener` | `removeEventListener` in `ngOnDestroy` |
| an endless Observable (`interval`, router events, sockets) | `takeUntilDestroyed()` |
| an `effect()` that starts any of these | `onCleanup` |

## See it

```typescript
// Before: the interval outlives the component and keeps ticking
export class Clock implements OnInit {
  protected readonly now = signal(new Date());

  ngOnInit(): void {
    setInterval(() => this.now.set(new Date()), 1000);
  }
}

// After: stopped when the component is destroyed
export class Clock implements OnInit, OnDestroy {
  protected readonly now = signal(new Date());
  private id?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.id = setInterval(() => this.now.set(new Date()), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.id);
  }
}
```

Visit the page ten times in the "before" version and ten intervals are running at once.

## Go deeper

Not every Observable needs this. A single HTTP request completes after its response, and the `async` pipe and `toSignal()` unsubscribe for you. The streams that leak are the endless ones, so before you subscribe by hand, ask whether it ever completes.

A quick way to hunt a leak is the browser's performance tools: record, navigate to the screen and away a few times, force garbage collection, and see whether the number of nodes and listeners drops back down. If it only grows, something was left running.

## Watch out

- Subscribing to `interval`, `Router.events` or a `Subject` by hand with no `takeUntilDestroyed()` or `unsubscribe()`.
- Cleaning up in `ngOnDestroy` something that `ngOnInit` never stored, such as an interval id you did not keep.
- Assuming a leak is "just a little memory". It also keeps firing callbacks into a dead component, which causes odd bugs.

## Remember

- Whatever a component starts, it must stop.
- Endless streams, timers and listeners are the usual leaks; short HTTP calls are not.
- Use `ngOnDestroy`, `takeUntilDestroyed()` or `DestroyRef`, and keep the stored id or subscription so you can stop it.

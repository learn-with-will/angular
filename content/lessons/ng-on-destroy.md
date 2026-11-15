---
slug: ng-on-destroy
title: "ngOnDestroy and DestroyRef"
topic: components
kind: technique
summary: "Clean up timers, listeners and subscriptions when a component goes away."
tags: [components, lifecycle, cleanup, rxjs]
related: [lifecycle-overview, pitfall-forgotten-cleanup, ng-on-init, effect-cleanup]
since: "16"
---
> **In one line:** Anything a component starts, it must stop. `ngOnDestroy()` runs just before Angular removes it, and `DestroyRef` with `takeUntilDestroyed()` does the same job with less code.

## The idea

Angular removes a component from the page, but it knows nothing about the timer you started or the stream you subscribed to. Those keep running after the component is gone, holding memory and doing pointless work. That is a **memory leak**, and it is one of the most common ones in Angular apps.

`ngOnDestroy` is your guaranteed chance to tidy up. It runs exactly once, right before the component is destroyed. The classic job is to unsubscribe from long-lived Observables, clear timers and intervals, and remove listeners you attached by hand.

Modern Angular has a shorter way for RxJS. `DestroyRef` lets you register a cleanup callback anywhere, and `takeUntilDestroyed()` completes a stream when the component is destroyed. You cannot forget a hook you never needed to write.

## See it

```typescript
// Before: manual teardown
export class Clock implements OnInit, OnDestroy {
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = interval(1000).subscribe(() => this.tick());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

// After: the stream ends with the component
export class Clock {
  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe(() => this.tick());
  }
}
```

Short-lived streams, such as one HTTP request, complete on their own and need no cleanup. It is the endless ones (`interval`, router events, sockets, subjects) that leak.

## Go deeper

`takeUntilDestroyed()` finds the component by being called in an **injection context**, such as a constructor or field initializer. Outside one, for example inside `ngAfterViewInit`, pass the reference explicitly:

```typescript
private readonly destroyRef = inject(DestroyRef);

ngAfterViewInit(): void {
  interval(1000)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => this.draw());

  // Any other cleanup can register itself the same way
  this.destroyRef.onDestroy(() => this.chart.dispose());
}
```

`onDestroy` also suits code that is not RxJS at all, such as disposing of a chart or removing a listener.

## Watch out

- Forgetting to unsubscribe from an endless stream. It keeps running after the component is gone.
- Calling `takeUntilDestroyed()` with no argument outside an injection context. It throws; pass a `DestroyRef`.
- Using `ngOnDestroy` for work that must happen on navigation away. It runs when Angular destroys the component, which a reused route may not do.

## Remember

- Stop what you started: timers, listeners and endless streams.
- `takeUntilDestroyed()` ends an Observable with the component, with no hook to write.
- `DestroyRef.onDestroy()` registers any cleanup, anywhere you can `inject()`.

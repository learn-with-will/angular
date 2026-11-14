---
slug: mark-for-check
title: "markForCheck vs detectChanges"
topic: performance
kind: api
summary: "Two ways to ask for a check from outside Angular's reactivity, and why one of them is the safe default."
tags: [performance, markforcheck, detectchanges, changedetectorref]
related: [onpush-triggers, zoneless-and-signals, pitfall-onpush-mutation, async-pipe]
---
> **In one line:** `markForCheck()` schedules the component for the next change detection pass. `detectChanges()` runs a check right now, which is rarely what you want.

## The idea

Most of the time you never call either. Signals, events and the `async` pipe already request a check. You need one when state changes from somewhere Angular cannot see: a third-party library callback, a raw WebSocket handler, or code run outside the zone.

The two methods differ in *when* they act:

| Method | When it checks | Risk |
|---|---|---|
| `markForCheck()` | on the **next** change detection pass; marks this view and its ancestors | none: it only schedules |
| `detectChanges()` | **synchronously, immediately**, for this view and its children | can throw `ExpressionChangedAfterItHasBeenCheckedError` at the wrong moment |

`markForCheck()` is almost always the right choice. It says "this view is dirty" and lets Angular do the work at a safe time.

## See it

```typescript
@Component({
  selector: 'app-live-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Price: {{ price }}</p>`,
})
export class LiveTicker {
  private readonly cdr = inject(ChangeDetectorRef);
  protected price = 0;

  constructor() {
    thirdPartySocket.onMessage((newPrice: number) => {
      this.price = newPrice;
      this.cdr.markForCheck();   // schedule a check for this view
    });
  }
}
```

The same component written with a signal needs neither: `protected readonly price = signal(0)`, and the callback does `this.price.set(newPrice)`.

## Go deeper

A signal is the better answer whenever you control the state. It removes the `ChangeDetectorRef` injection, the forgotten call, and the whole class of "it only updates when I click something" bugs. In zoneless apps this matters even more: a plain field assigned in a callback is invisible, whereas a signal write schedules a check.

`detectChanges()` has legitimate uses, mostly in tests and in dynamic-view code where you create a component and need its DOM now. In a test, `fixture.detectChanges()` is the standard way to render. In application code, calling it from a lifecycle hook is the usual way to cause the expression-changed error.

Code run through `NgZone.runOutsideAngular()` is deliberately invisible to Angular, used to avoid checks for high-frequency events. If it later needs to show something, write a signal (or call `markForCheck()`) inside `NgZone.run()` at that moment, not on every event.

## Watch out

- Calling `detectChanges()` from `ngOnInit` or `ngAfterViewInit`.
- Forgetting `markForCheck()` for callbacks that Angular cannot see.
- Using either when a signal would remove the need.

## Remember

- `markForCheck()` schedules; `detectChanges()` runs now.
- Prefer a signal for state you own.
- Reserve `detectChanges()` for tests and dynamic views.

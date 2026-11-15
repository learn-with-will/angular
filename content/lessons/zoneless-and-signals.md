---
slug: zoneless-and-signals
title: "Zoneless: OnPush and signals together"
topic: performance
kind: concept
summary: "Without Zone.js, Angular relies on explicit notifications: exactly what OnPush and signals already use."
tags: [performance, zoneless, zonejs, signals]
related: [onpush-triggers, mark-for-check, pitfall-onpush-mutation, change-detection-strategies]
---
> **In one line:** Zoneless Angular runs change detection only when told to: by a signal, an event binding, an `async` pipe or `markForCheck()`. An OnPush plus signals app is already written that way.

## The idea

Zone.js used to monkey-patch `setTimeout`, promises and DOM events so Angular knew *when* something async had happened, and then checked everything. That magic had costs: bundle size, hard-to-read stack traces, and checks after events that changed nothing.

Zoneless removes it. `provideZonelessChangeDetection()` became stable in Angular 20.2 and is the **default for new apps from Angular 21**. Angular now needs a notification, and the notifications are the same triggers OnPush already uses:

| Notification | Triggers a check |
|---|---|
| a signal read in a template changes | yes |
| a template event binding fires | yes |
| an `async` pipe emits | yes |
| `markForCheck()` is called | yes |
| a plain field is assigned in a timer or callback | **no** |

The last row is what breaks code on migration: it worked under Zone.js only because the patched `setTimeout` caused a global check.

## See it

```typescript
bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection()],
});
```

```typescript
// Before: works with Zone.js, silently stale without it
protected count = 0;
constructor() {
  setInterval(() => this.count++, 1000);
}

// After: a signal write is a notification, so it works everywhere
protected readonly count = signal(0);
constructor() {
  setInterval(() => this.count.update((c) => c + 1), 1000);
}
```

## Go deeper

The practical advice is simple: hold UI state in signals, derive with `computed()`, and use the `async` pipe or `toSignal()` for streams. A component written that way needs **no changes** to go zoneless, so learning OnPush and signals well is the on-ramp.

Find the breakers during migration by searching for assignments inside callbacks: `setTimeout`, `setInterval`, promise `.then`, subscriptions, and third-party library handlers. Each is either a plain field that should become a signal, or needs `markForCheck()`.

Testing changes slightly too. In a zoneless test, `fixture.detectChanges()` still works, but code that waited for Zone.js to settle should use `await fixture.whenStable()`.

Libraries that depend on Zone.js behaviour need to be checked individually. Most maintained ones already work, and an old chart or grid that does not will show itself as a view that never updates.

## Watch out

- Assigning plain fields in timers and subscriptions in a zoneless app.
- Assuming "it works in the browser" means it is zoneless-ready: Zone.js may be hiding the bug.
- Forgetting third-party callbacks that need `markForCheck()`.

## Remember

- Zoneless needs explicit notifications: signals, events, `async` pipe, `markForCheck`.
- It is the default for new apps from Angular 21.
- OnPush plus signals is already zoneless-ready.

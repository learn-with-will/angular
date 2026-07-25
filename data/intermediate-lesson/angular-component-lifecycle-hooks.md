title: "Angular Component Lifecycle Hooks"
level: "intermediate"
estimatedTime: 45
tags:
- angular
- lifecycle-hooks
- components
- typescript
- rxjs
- signals

# Angular Component Lifecycle Hooks

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what the Angular component lifecycle is and why Angular exposes it through hooks.
- Correctly implement `ngOnInit`, `ngOnChanges`, `ngAfterViewInit`, and `ngOnDestroy` in standalone components.
- Choose the right hook for a given task: initialization, reacting to input changes, DOM/view access, or cleanup.
- Identify and avoid common mistakes such as premature DOM access and memory leaks from unmanaged subscriptions.
- Apply the modern, recommended cleanup pattern using `DestroyRef` and `takeUntilDestroyed`.

## Why This Concept Exists

Every Angular component goes through a well-defined life: it gets created, its inputs get set, its template gets rendered, it gets checked repeatedly for changes, and eventually it gets removed from the DOM. Angular manages all of this internally — you never call `new MyComponent()` yourself, and you never call `.destroy()` on it either.

Because Angular controls this process, you need a way to "hook into" specific moments without fighting the framework. That's exactly what **lifecycle hooks** are: named methods that Angular calls automatically at predictable points in a component's life.

Without lifecycle hooks, you'd have no reliable way to know:

- When it's safe to fetch data (before the constructor has even finished injecting dependencies? Too early.)
- When a `@ViewChild` reference to a DOM element or child component is actually available.
- When to clean up timers, subscriptions, or event listeners so your app doesn't leak memory.

Lifecycle hooks solve this by giving you clear, guaranteed checkpoints instead of guesswork.

## Concept Explanation

A component's lifecycle consists of a sequence of stages, each with a corresponding hook method. Angular calls these methods **if you define them** — you opt in by implementing the method (and, ideally, its matching TypeScript interface).

Here is the order in which Angular calls the hooks for a component that has at least one `@Input()`:

| Order | Hook | Called when |
|---|---|---|
| 1 | `constructor()` | Component class is instantiated (before Angular sets inputs). Not a lifecycle hook itself, but the starting point. |
| 2 | `ngOnChanges()` | Before `ngOnInit`, and again every time a bound `@Input()` **reference** changes. |
| 3 | `ngOnInit()` | Once, after the first `ngOnChanges` (or immediately if there are no inputs). |
| 4 | `ngDoCheck()` | Immediately after `ngOnInit`, then on every change detection run. |
| 5 | `ngAfterContentInit()` | Once, after content projected via `<ng-content>` has been initialized. |
| 6 | `ngAfterContentChecked()` | After `ngAfterContentInit`, then on every change detection run. |
| 7 | `ngAfterViewInit()` | Once, after the component's own view (and child views) have been fully initialized. |
| 8 | `ngAfterViewChecked()` | After `ngAfterViewInit`, then on every change detection run. |
| — | `ngOnDestroy()` | Just before Angular destroys the component (removes it from the DOM). |

Two important patterns to notice:

1. **"Init" hooks run once.** `ngOnInit`, `ngAfterContentInit`, and `ngAfterViewInit` each fire exactly one time during the component's life.
2. **"Check" hooks run repeatedly.** `ngOnChanges`, `ngDoCheck`, `ngAfterContentChecked`, and `ngAfterViewChecked` run on every change detection cycle — so any expensive logic placed inside them can hurt performance if you're not careful.

### The most commonly used hooks

In everyday Angular development, you will reach for these four far more often than the rest:

- **`ngOnInit`** — the standard place for initialization logic: fetching initial data, setting up subscriptions, initializing local state that depends on `@Input()` values.
- **`ngOnChanges`** — react whenever a parent component passes a new value into an `@Input()`.
- **`ngAfterViewInit`** — the only safe place to read `@ViewChild` / `@ViewChildren` references, because the view isn't guaranteed to exist before this point.
- **`ngOnDestroy`** — clean up anything you started: unsubscribe from Observables, clear timers/intervals, remove manually attached event listeners.

The remaining hooks (`ngDoCheck`, `ngAfterContentInit`, `ngAfterContentChecked`, `ngAfterViewChecked`) are used less frequently — mostly for advanced content-projection scenarios or custom change-detection logic — and are covered briefly later in this lesson.

> **A note on modern Angular and Signals:** If a component's internal state is built with `signal()` and `computed()`, you often don't need `ngOnChanges` or `ngDoCheck` at all — reactive updates happen automatically wherever a signal is read. Lifecycle hooks remain essential, however, for anything tied to *time* (once-only initialization, view readiness, teardown) rather than *data changes*.

## Key Terminology

| Term | Meaning |
|---|---|
| **Lifecycle hook** | A method Angular calls automatically at a specific point in a component's or directive's life (e.g., `ngOnInit`). |
| **Change detection** | Angular's process of checking a component's bindings for updates and refreshing the DOM accordingly. |
| **`SimpleChanges`** | The object passed to `ngOnChanges`, containing the previous and current value of each changed `@Input()`. |
| **`@ViewChild` / `@ViewChildren`** | Decorators that give a component a reference to an element or child component in its own template. |
| **`@ContentChild` / `@ContentChildren`** | Decorators that give a component a reference to content projected into it via `<ng-content>`. |
| **`DestroyRef`** | An injectable class (available since Angular v16) that lets you register a cleanup callback for when a component, directive, or service is destroyed — without implementing `ngOnDestroy`. |
| **`takeUntilDestroyed()`** | An RxJS operator from `@angular/core/rxjs-interop` that automatically completes an Observable subscription when the current context is destroyed. |
| **Injection context** | Code locations (like a constructor or a field initializer) where `inject()` and injection-context-only utilities like `takeUntilDestroyed()` can be called without extra arguments. |

## Syntax Overview

Lifecycle hooks are implemented as plain methods on your component class, following the naming pattern `ngXxx`. Angular calls a method purely by name — you don't need to implement the matching interface for the hook to work — but implementing the interface is strongly recommended because it gives you compile-time errors if you misspell a method name.

```typescript
import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `<p>Example works</p>`
})
export class ExampleComponent implements OnInit, OnChanges, OnDestroy {

  ngOnChanges(changes: SimpleChanges): void {
    // changes is a dictionary keyed by input property name.
    // Each entry has .previousValue, .currentValue, and .firstChange.
  }

  ngOnInit(): void {
    // Runs once, after the first ngOnChanges (or immediately, if there are no inputs).
  }

  ngOnDestroy(): void {
    // Runs once, right before Angular removes this component.
  }
}
```

Key points about the syntax:

- Import each interface (`OnInit`, `OnChanges`, `OnDestroy`, etc.) from `@angular/core`.
- `implements OnInit` (etc.) is optional at runtime but recommended for type safety — TypeScript will now warn you if you forget to define `ngOnInit()`, or if you typo it.
- Hook methods take no parameters, **except** `ngOnChanges(changes: SimpleChanges)`.
- If a hook method isn't defined, Angular simply skips that step — there's no error.

## Real World Analogy

Think of a component's lifecycle like a **hotel room during a guest's stay**:

- **`constructor()`** — the room is built and furnished (bare structure, no guest yet).
- **`ngOnChanges()`** — the front desk updates the reservation details every time the guest changes something (extra nights, different room preference).
- **`ngOnInit()`** — the guest checks in and settles in; this happens once, at the start of the stay.
- **`ngDoCheck()`** — housekeeping does a quick pass whenever needed, even without guest input.
- **`ngAfterViewInit()`** — the guest's initial room setup (TV, curtains, minibar) is confirmed to be fully in place — only after this point can the guest actually *use* those things.
- **`ngOnDestroy()`** — checkout day: keys returned, minibar tab settled, room ready to be cleaned for the next guest. Anything you don't settle here (an open tab, a "do not disturb" sign left on) causes problems for whoever — or whatever — comes next. That's your memory leak.

## Examples

### 1. Basic Example — `ngOnInit` and `ngOnDestroy` with a Timer

This is the classic "start something in `ngOnInit`, clean it up in `ngOnDestroy`" pattern.

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<p>Current time: {{ currentTime }}</p>`
})
export class ClockComponent implements OnInit, OnDestroy {
  currentTime = new Date().toLocaleTimeString();
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // ngOnInit runs once, after Angular has set this component's @Input properties
    // (there are none here). This is the right place to start ongoing work like timers.
    this.intervalId = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }

  ngOnDestroy(): void {
    // Always clean up anything started in ngOnInit. If you skip this, the interval
    // keeps running forever — even after the component is gone — wasting memory
    // and CPU. This is one of the most common Angular memory leaks.
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
```

**Why this matters:** `setInterval` has no idea when your component disappears. Angular won't stop it for you. `ngOnDestroy` is your only guaranteed chance to tear it down.

### 2. Real-World Example — Reacting to Input Changes with `ngOnChanges`

Imagine a card component that displays a user's profile and needs to re-fetch data whenever the parent passes a different `userId`.

```typescript
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subject, Subscription, switchMap } from 'rxjs';
import { UserService } from './user.service';

interface UserSummary {
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-profile-card',
  standalone: true,
  template: `
    @if (user) {
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
    } @else {
      <p>Loading user…</p>
    }
  `
})
export class UserProfileCardComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) userId!: string;

  user: UserSummary | null = null;

  // A Subject we push new userId values into, so we can cancel an in-flight
  // request if the userId changes again before it completes.
  private userIdChanges = new Subject<string>();
  private subscription: Subscription;

  constructor(private userService: UserService) {
    this.subscription = this.userIdChanges
      .pipe(switchMap(id => this.userService.getUser(id)))
      .subscribe(user => (this.user = user));
  }

  ngOnChanges(changes: SimpleChanges): void {
    // ngOnChanges fires before ngOnInit, and again every time a bound @Input
    // reference changes. We check `changes['userId']` in case this component
    // ever gains more inputs in the future.
    if (changes['userId']) {
      this.user = null; // Show the loading state while the new user loads.
      this.userIdChanges.next(this.userId);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
```

**Why `ngOnChanges` and not `ngOnInit` alone:** `ngOnInit` only runs once. If the parent component later binds a *different* `userId` to the same component instance (common in lists, master-detail views, or route-reused components), only `ngOnChanges` will notice.

**Important limitation:** `ngOnChanges` only fires when the bound **reference** changes (e.g., a new string, a new object). If you mutate an object's properties in place without replacing the reference, `ngOnChanges` will **not** fire.

### 3. Best-Practice Example — `ngAfterViewInit` + Modern Cleanup with `DestroyRef`

This example shows the two most important modern conventions: using `ngAfterViewInit` to safely access a `@ViewChild`, and using `DestroyRef` with `takeUntilDestroyed()` instead of writing manual `ngOnDestroy` unsubscribe logic.

```typescript
import {
  Component,
  DestroyRef,
  ElementRef,
  AfterViewInit,
  ViewChild,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-tick-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #tickCanvas width="400" height="120"></canvas>`
})
export class TickCanvasComponent implements AfterViewInit {
  @ViewChild('tickCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // inject() must be called in an injection context — a field initializer
  // (like here) or the constructor both qualify.
  private destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    // @ViewChild references are only guaranteed to be populated once
    // ngAfterViewInit runs, because Angular needs to finish rendering the
    // view first. Reading canvasRef inside ngOnInit would give `undefined`.
    const ctx = this.canvasRef.nativeElement.getContext('2d');

    interval(1000)
      // takeUntilDestroyed(this.destroyRef) automatically unsubscribes when
      // this component is destroyed. We pass destroyRef explicitly because
      // ngAfterViewInit is NOT itself an injection context.
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tick => {
        ctx?.clearRect(0, 0, 400, 120);
        ctx?.fillText(`Tick: ${tick}`, 10, 60);
      });
    // No ngOnDestroy needed for this subscription — one less place to forget cleanup.
  }
}
```

**Why this is best practice:**

- `ChangeDetectionStrategy.OnPush` reduces unnecessary change-detection runs, which pairs well with keeping `ngDoCheck`/`ngAfterViewChecked` logic to a minimum.
- `DestroyRef` + `takeUntilDestroyed()` removes an entire category of bugs — the "forgot to unsubscribe" memory leak — by letting Angular manage cleanup declaratively instead of manually.
- `@ViewChild` is read only inside `ngAfterViewInit`, respecting Angular's rendering guarantees.

## Common Mistakes

- **Reading `@ViewChild` inside `ngOnInit`.** The view hasn't been created yet at that point, so the reference will be `undefined`. Always read view references inside `ngAfterViewInit` (or later).
- **Forgetting to unsubscribe in `ngOnDestroy`.** Subscriptions to long-lived Observables (`interval`, `Router.events`, WebSocket streams, `Subject`s) keep running after the component is gone unless explicitly stopped. This is one of the most common sources of memory leaks in Angular apps.
- **Assuming `ngOnChanges` fires on object mutation.** `ngOnChanges` only triggers on a **new reference**. Mutating a nested property (`this.config.title = 'New'`) without reassigning `this.config` will not trigger it.
- **Putting expensive work in `ngDoCheck` or `ngAfterViewChecked`.** These hooks run on *every* change detection cycle — potentially many times per user interaction. Heavy logic here can noticeably slow down the app.
- **Mutating component state in `ngAfterViewChecked` (or `ngAfterViewInit`) in a way that affects the current view.** This can trigger `ExpressionChangedAfterItHasBeenCheckedError` in development mode, because you're changing a value Angular already finished checking for this cycle. If you must update state after the view renders, wrap it appropriately (e.g., update it in response to an event, or use `queueMicrotask`/`setTimeout(() => ..., 0)` only as a last resort) — and prefer restructuring the component so the value is correct the first time.
- **Not implementing the lifecycle interfaces.** Angular calls hook methods purely by name, so a typo like `ngonInit()` or `ngOnInt()` fails silently — no error, the method just never runs. Implementing `OnInit`, `OnChanges`, etc. turns this into a compile-time error.

## Best Practices

- **Implement the matching interface for every hook you use** (`OnInit`, `OnChanges`, `OnDestroy`, ...) for compile-time safety and better editor autocomplete.
- **Keep hooks thin.** Delegate real work to services; a hook method should mostly *call* things, not *contain* long business logic.
- **Prefer `DestroyRef` + `takeUntilDestroyed()`** over manually managing a `Subscription` or a `destroyed$` Subject for RxJS cleanup — it's less code and impossible to forget.
- **Only use `ngDoCheck` when you truly need custom change detection logic** (e.g., detecting mutations Angular's default checks can't see). For everything else, rely on `ngOnChanges`, inputs, or signals.
- **Combine lifecycle hooks with `ChangeDetectionStrategy.OnPush`** where possible — it reduces how often the "check" hooks run and encourages more predictable, unidirectional data flow.
- **Consider signals for reactive derived state.** If you find yourself using `ngOnChanges` just to recompute a value from an `@Input()`, a `computed()` signal (or an input signal via `input()`) may express the same intent more directly and with less boilerplate.
- **Never assume a `@ViewChild`/`@ContentChild` is available before its corresponding `AfterInit` hook.** Always guard against `undefined` if there's any chance the referenced element is conditionally rendered.

## Summary

- A component's lifecycle runs from `constructor()` through `ngOnDestroy()`, with well-defined checkpoints in between.
- Lifecycle hooks are plain methods (`ngOnInit`, `ngOnChanges`, etc.) that Angular calls automatically — implement the matching interface for type safety.
- `ngOnInit` is for one-time initialization; `ngOnChanges` is for reacting to new `@Input()` values; `ngAfterViewInit` is the earliest safe place to access `@ViewChild`; `ngOnDestroy` is for cleanup.
- "Init" hooks (`ngOnInit`, `ngAfterContentInit`, `ngAfterViewInit`) run once; "Check" hooks (`ngDoCheck`, `ngAfterContentChecked`, `ngAfterViewChecked`, and `ngOnChanges`) can run many times — keep them lightweight.
- `ngOnChanges` only fires on new input **references**, not on in-place mutation.
- Forgetting `ngOnDestroy` cleanup for timers and subscriptions is one of the most common Angular memory leaks.
- The modern, recommended way to manage subscription cleanup is `DestroyRef` combined with `takeUntilDestroyed()` from `@angular/core/rxjs-interop`.
- Signals reduce (but don't eliminate) the need for `ngOnChanges`/`ngDoCheck` for purely data-driven reactivity; lifecycle hooks remain essential for time-based initialization and teardown.

## Flash Cards

**Q:** Which lifecycle hook runs exactly once, right after the first `ngOnChanges` call (or immediately if there are no inputs)?
**A:** `ngOnInit`.

**Q:** Why should `@ViewChild` references only be read inside `ngAfterViewInit` (or later), not `ngOnInit`?
**A:** Because Angular hasn't finished creating the component's view when `ngOnInit` runs, so the reference would be `undefined`.

**Q:** What condition must be true for `ngOnChanges` to fire on a given input?
**A:** The bound value's **reference** must change (a new object/array/primitive value) — mutating an existing object's properties in place does not trigger it.

**Q:** What is the modern, recommended alternative to manually unsubscribing from an Observable inside `ngOnDestroy`?
**A:** Injecting `DestroyRef` and piping the Observable through `takeUntilDestroyed()` from `@angular/core/rxjs-interop`.

**Q:** Why should you avoid putting expensive logic inside `ngDoCheck` or `ngAfterViewChecked`?
**A:** Because these hooks run on every change detection cycle, so expensive work inside them can run many times per user interaction and degrade performance.

## Exercises

### Easy

Create a standalone `LoggerComponent` that logs `"Component created"` to the console in `ngOnInit` and `"Component destroyed"` in `ngOnDestroy`. Add it and remove it from a parent component's template (e.g., behind an `@if` toggle controlled by a button) to observe both logs firing in the browser console.

### Medium

Create a standalone `FilteredListComponent` with a required `@Input() searchTerm: string`. Implement `ngOnChanges` to:
1. Log the previous and current value of `searchTerm` using the `SimpleChanges` object.
2. Filter a hardcoded array of strings (e.g., a list of fruit names) so the template only displays items containing the current `searchTerm`.

Bind `searchTerm` from a parent component to a text `<input>` so you can see the list update and the console log fire as you type.

### Challenging

Build a standalone `ResizableBoxComponent` that:
1. Uses `@ViewChild` and `ngAfterViewInit` to measure the width of a `<div>` in its template and display it.
2. Listens for `window` resize events and updates the displayed width whenever the window is resized.
3. Uses `DestroyRef` and proper cleanup (either `takeUntilDestroyed()` for an RxJS `fromEvent(window, 'resize')` stream, or `destroyRef.onDestroy()` for a manual `addEventListener`/`removeEventListener` pair) so the resize listener does not leak when the component is destroyed.
4. Avoids triggering `ExpressionChangedAfterItHasBeenCheckedError` by making sure the initial width is set before the first change detection check completes, or by updating it in response to an event rather than synchronously inside `ngAfterViewInit` in a way that conflicts with the current check.

## Further Reading

- [Angular Docs — Lifecycle](https://angular.dev/guide/components/lifecycle) — the official, authoritative reference for every lifecycle hook and the order they run in.
- [Angular Docs — Unsubscribing with `takeUntilDestroyed`](https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed) — official guide to the modern RxJS cleanup pattern used in this lesson.
- [Angular API Reference — `takeUntilDestroyed`](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed) — full API signature and usage notes.
- [Angular Docs — Signals](https://angular.dev/guide/signals) — background on the reactive primitive that complements (and sometimes reduces reliance on) `ngOnChanges`/`ngDoCheck`.
- [Angular Docs — Component Inputs](https://angular.dev/guide/components/inputs) — details on `@Input()`, including `required` inputs used in this lesson's examples.

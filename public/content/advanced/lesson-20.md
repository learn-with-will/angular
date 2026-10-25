---
id: lesson-20
slug: performance-optimization-onpush
title: "Performance Optimization with OnPush Change Detection"
level: advanced
order: 22
duration: 55
tags:
  - performance
  - change-detection
  - onpush
  - signals
  - zoneless
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain how Angular's change detection tree works and why unrestricted checking becomes expensive at scale.
- Apply `ChangeDetectionStrategy.OnPush` to components and predict exactly when Angular will and won't re-check them.
- Diagnose and fix the most common OnPush bug: silent UI staleness caused by mutating data instead of replacing it.
- Combine OnPush with Signals (`signal()`, `computed()`, `input()`) to get fine-grained, mostly-automatic change detection.
- Use `ChangeDetectorRef.markForCheck()` correctly when integrating non-Angular data sources, and understand how this pattern prepares an app for **zoneless** change detection.
- Explain the `Eager` and `OnPush` strategies, and which one is the default in your Angular version.
- Load images efficiently with `NgOptimizedImage`.

## Why This Concept Exists

Every Angular application keeps its template in sync with its component state through **change detection**: a pass over the component tree that checks bindings and updates the DOM where values changed.

Before Angular 22, every component used `ChangeDetectionStrategy.Default` unless it opted out. With that strategy, whenever *any* asynchronous event happens anywhere in the app (a click, an HTTP response, a timer, a promise resolving), Angular's scheduler walks the **entire component tree** and checks every component's bindings, even ones that couldn't possibly have changed. Since Angular 22, `OnPush` is the default for components, and the old behavior is called `ChangeDetectionStrategy.Eager` (`Default` still works but is deprecated). `ng update` adds `Eager` to existing components that don't set a strategy, so upgrading doesn't change how they behave.

For small apps this is invisible. For large apps — dashboards with hundreds of widgets, data grids with thousands of rows, deeply nested component trees — re-checking everything on every interaction becomes measurably slow, especially on mid-range mobile devices. A single keystroke in a search box can trigger thousands of unnecessary binding checks in parts of the UI that have nothing to do with that search box.

`ChangeDetectionStrategy.OnPush` exists to solve exactly this problem: it lets you tell Angular, "skip this component (and everything under it) unless I explicitly give you a reason to check it." Used correctly, it turns an O(entire tree) operation into something closer to O(components that actually changed) — often the single highest-leverage performance optimization in a mature Angular codebase.

## Concept Explanation

### The two change detection strategies

Angular components have a `changeDetection` property that accepts one of two values from the `ChangeDetectionStrategy` enum:

- **`Eager`** (called `Default` before Angular 22) — the component is always checked whenever change detection runs, regardless of whether anything relevant to it changed.
- **`OnPush`** (the default for components since Angular 22) — the component is checked only when Angular has a specific, trackable reason to believe something changed.

On Angular 20 and 21 you opt in to `OnPush` per component; from Angular 22 you get it unless you choose `Eager`. Everything below about *how* OnPush decides to check a component is the same in every version.

### What counts as "a reason" under OnPush

Angular will run change detection on an OnPush component's view when **any** of the following happen:

1. **A `@Input()` (or signal `input()`) receives a new reference.** Angular compares the new and old values using strict/reference equality (similar to `Object.is`), *not* a deep comparison. A new primitive value (number, string, boolean) always counts as "new" because equal primitives are already reference-equal. A new object or array only counts as "new" if it's a genuinely different reference.
2. **An event originates from within the component or one of its children** — a `(click)`, `(input)`, a custom `@Output()`/`output()` emission, or a `@HostListener`. When this happens, Angular checks the component *and every ancestor on the path back to the root*, because that path must be walked to reach the component that fired the event — even if those ancestors are themselves OnPush.
3. **An `async` pipe in the template emits a new value.** The `async` pipe internally calls `markForCheck()` for you on every emission, so it "just works" with OnPush — this is one of the most important things to internalize.
4. **You manually call `ChangeDetectorRef.markForCheck()`** (typically when data changes from outside Angular's normal reactivity, such as a third-party callback).
5. **A `Signal` read in the template changes.** This is the modern mechanism (Angular 17+): when a template reads a signal (directly, or via a `computed()`), Angular registers that signal as a dependency of that view. When the signal's value changes, Angular schedules a targeted check of exactly that view — without needing `markForCheck()`, `Zone.js`, or even an OnPush declaration, though declaring OnPush explicitly still helps Angular skip unrelated ancestors sooner and documents your intent.

If none of these occur, Angular **skips the component's view entirely** during that change detection pass — it doesn't even descend into its children, regardless of what strategy the children use.

### Why this requires immutability

Because Angular checks inputs by reference, OnPush only works correctly if you treat data as **immutable**: instead of mutating an existing object or array in place, you create a new one with the updated values (`{ ...obj, prop: newValue }`, `array.map(...)`, `array.filter(...)`, spread syntax, or `signal.update()`). Mutating in place leaves the reference unchanged, so Angular has no way to know something changed — the UI silently goes stale.

### OnPush and Zoneless Angular

Historically, Angular relied on `Zone.js` to monkey-patch async APIs (`setTimeout`, `Promise`, DOM events) so it would know *when* to run change detection at all. As of Angular v20.2, `provideZonelessChangeDetection()` is a **stable** API, and as of Angular v21 it is the **default** for new applications — Zone.js is no longer required.

Zoneless Angular relies entirely on the same explicit signals OnPush already depends on: signal updates, `markForCheck()`, template event bindings, and `async` pipe emissions. In other words, **an app built with OnPush + Signals is already written in the zoneless mental model.** Learning OnPush well is not just a performance technique for today — it's the direct on-ramp to zoneless Angular.

## Key Terminology

| Term | Meaning |
|---|---|
| **Change detection** | Angular's process of checking component bindings and updating the DOM to match component state. |
| **`ChangeDetectionStrategy.Eager`** | The strategy where a component is always checked on every change detection run. Called `Default` before Angular 22 (that name is now deprecated). |
| **`ChangeDetectionStrategy.OnPush`** | The strategy where a component is only checked when it receives new inputs, an event fires within it, an `async` pipe emits, `markForCheck()` is called, or a signal it reads changes. |
| **Reference equality** | Comparing two values by identity (`===` / `Object.is`), not by deep structural comparison. Angular uses this for `@Input()` change detection. |
| **Immutability** | The practice of never mutating existing objects/arrays in place; always producing a new reference when data changes. |
| **`ChangeDetectorRef`** | An injectable service that lets a component manually interact with change detection. |
| **`markForCheck()`** | Marks the current view (and its ancestors) as needing to be checked on the *next* change detection cycle. Cheap and asynchronous-friendly. |
| **`detectChanges()`** | Synchronously runs change detection on the current view and its children *immediately*. More powerful but easy to misuse (can cause `ExpressionChangedAfterItHasBeenCheckedError`, and it's more expensive than scheduling). |
| **`Signal`** | A reactive primitive (`signal()`, `computed()`, `input()`) that tracks its own dependents. Reading a signal in a template automatically wires up fine-grained updates. |
| **Zoneless change detection** | An Angular scheduling mode (stable since v20.2, default since v21) that removes `Zone.js` and schedules change detection purely from explicit notifications. |

## Syntax Overview

Enabling OnPush on a standalone component:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-widget',
  changeDetection: ChangeDetectionStrategy.OnPush, // <-- opt in here
  template: `<p>{{ value }}</p>`,
})
export class WidgetComponent {
  value = 'Hello';
}
```

Manually scheduling a check from a non-reactive source (e.g. a third-party callback):

```typescript
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({ /* ...OnPush component... */ })
export class LiveTickerComponent {
  private cdr = inject(ChangeDetectorRef);
  price = 0;

  constructor() {
    thirdPartySocket.onMessage((newPrice: number) => {
      this.price = newPrice;
      this.cdr.markForCheck(); // tell Angular this view needs checking
    });
  }
}
```

Enabling zoneless change detection at bootstrap (Angular v20.2+, default in v21+):

```typescript
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});
```

## Real World Analogy

Think of Angular's change detector as a **building inspector** doing rounds.

With the **Eager** strategy (called `Default` before Angular 22), the inspector walks into every single room on every floor, every time *any* alarm goes off anywhere in the building — even a doorbell three floors away. Exhausting, and mostly wasted effort.

With **OnPush**, each room has a sign on the door: *"Only enter if (a) someone hands you a new file through the mail slot, (b) an alarm goes off inside this room, or (c) I personally radio you and tell you to check."* The inspector skips every room without one of those triggers — and doesn't even bother opening the door to peek at what's behind it. If you only ever slide *the same file back through the same slot with a page changed* (mutation), the inspector never notices — from the outside, nothing new arrived.

Signals go a step further: instead of a general "something happened in this room" sign, each room has sensors wired to specific objects. The inspector gets paged directly and only for the exact object that changed — no walking required at all.

## Examples

### 1. Basic Example — Mutation vs. Replacement

This example shows the single most common OnPush bug, and the one-line fix.

```typescript
// user-card.component.ts
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

interface User {
  name: string;
  age: number;
}

@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <h3>{{ user.name }}</h3>
      <p>Age: {{ user.age }}</p>
    </div>
  `,
})
export class UserCardComponent {
  @Input({ required: true }) user!: User;
}
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { UserCardComponent } from './user-card.component';

@Component({
  selector: 'app-root',
  imports: [UserCardComponent],
  template: `
    <app-user-card [user]="user" />
    <button (click)="mutateUser()">Have a birthday (mutation — UI won't update)</button>
    <button (click)="replaceUser()">Have a birthday (replacement — UI updates)</button>
  `,
})
export class AppComponent {
  user: { name: string; age: number } = { name: 'Alice', age: 30 };

  mutateUser() {
    // ❌ Same object reference. OnPush sees no new @Input(), so it skips
    // UserCardComponent entirely. The DOM stays stuck at the old age.
    this.user.age++;
  }

  replaceUser() {
    // ✅ A brand-new object reference. Angular detects the new @Input()
    // and checks UserCardComponent, updating the DOM correctly.
    this.user = { ...this.user, age: this.user.age + 1 };
  }
}
```

**Why it matters:** this is the exact bug that makes OnPush feel "broken" to newcomers. The fix is never to abandon OnPush — it's to fix the mutation.

### 2. Real-World Example — OnPush with `async` Pipe and Modern Control Flow

A product list fed by an HTTP call. Notice that OnPush and the `async` pipe cooperate perfectly with no manual `markForCheck()` needed — the pipe calls it for you on every emission.

```typescript
// product.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

```typescript
// product-list.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe, AsyncPipe } from '@angular/common';
import { ProductService } from './product.service';

@Component({
  selector: 'app-product-list',
  imports: [AsyncPipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (product of products$ | async; track product.id) {
        <li>{{ product.name }} — {{ product.price | currency }}</li>
      } @empty {
        <li>No products found.</li>
      }
    </ul>
  `,
})
export class ProductListComponent {
  private productService = inject(ProductService);

  // The async pipe subscribes, unsubscribes automatically on destroy,
  // and calls markForCheck() on every emission — no manual wiring needed.
  products$ = this.productService.getProducts();
}
```

**Why it matters:** you rarely need to inject `ChangeDetectorRef` manually just to render observable data — the `async` pipe already does the right thing under OnPush. The `track product.id` expression also keeps DOM node reuse efficient once change detection *does* run, which matters for large lists.

### 3. Best-Practice Example — OnPush + Signals (the Modern Default)

This example uses `signal()` for state and `computed()` for derived values — the pattern Angular's own team now recommends as the default way to write components, because it gives you fine-grained updates automatically, works identically in zone-based and zoneless apps, and requires no manual `markForCheck()` calls at all.

```typescript
// shopping-cart.component.ts
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-shopping-cart',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Cart ({{ itemCount() }} items)</h2>

    @for (item of items(); track item.id) {
      <div class="line">
        <span>{{ item.name }} × {{ item.quantity }}</span>
        <button (click)="decrement(item.id)" [disabled]="item.quantity === 0">−</button>
        <button (click)="increment(item.id)">+</button>
      </div>
    }

    <p><strong>Total: {{ total() | currency }}</strong></p>
  `,
})
export class ShoppingCartComponent {
  // Signals hold state. Angular tracks exactly which template bindings
  // read which signal, so an update to `items` triggers a targeted
  // re-render — no Zone.js, no manual markForCheck(), fully OnPush-safe.
  items = signal<CartItem[]>([
    { id: 1, name: 'Keyboard', price: 79, quantity: 1 },
    { id: 2, name: 'Mouse', price: 25, quantity: 2 },
  ]);

  // Derived signals recompute only when a signal they depend on changes,
  // and are memoized between reads.
  itemCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  total = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  increment(id: number): void {
    // .update() always produces a new array — immutability is built in.
    this.items.update(items =>
      items.map(item => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }

  decrement(id: number): void {
    this.items.update(items =>
      items.map(item =>
        item.id === id && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  }
}
```

**Why it matters:** every mutation goes through `signal.update()` with an immutable transformation, so the "mutation bug" from Example 1 becomes structurally impossible. If this same app later adopts `provideZonelessChangeDetection()`, this component needs **zero changes** — it was already written the zoneless way.

### Beyond change detection: images with `NgOptimizedImage`

Large images are often the slowest part of a page, and no change detection strategy fixes that. `NgOptimizedImage` (the `ngSrc` attribute) applies the usual image fixes for you:

```typescript
import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product-hero',
  imports: [NgOptimizedImage],
  template: `
    <!-- The main image above the fold: load it first -->
    <img ngSrc="/images/hero.jpg" width="1200" height="600" priority alt="Kettlebells on a rack" />

    <!-- Images further down are lazy-loaded automatically -->
    <img ngSrc="/images/detail.jpg" width="400" height="300" alt="Close-up of the handle" />
  `,
})
export class ProductHero {}
```

- Images are **lazy-loaded** by default; `priority` loads the most important one eagerly.
- `width` and `height` (or `fill`) are required, so the page doesn't jump while images load.
- With an image loader for your CDN, Angular generates `srcset`s so each device downloads a suitable size.

## Common Mistakes

1. **Mutating objects/arrays instead of replacing them.** `this.items.push(x)` or `this.user.age++` leaves the reference unchanged, so OnPush components never see the update. Always produce a new reference (spread, `map`/`filter`, or `signal.update()`).
2. **Assuming OnPush means "this component will never re-render."** OnPush only skips checks when there's *no valid reason* to check. Events inside the component (and the ancestor path to it) still trigger checks — OnPush prunes unrelated branches, it doesn't disable change detection.
3. **Calling `detectChanges()` when `markForCheck()` is what's needed.** `detectChanges()` runs synchronously right away and can trigger `ExpressionChangedAfterItHasBeenCheckedError` if called at the wrong lifecycle moment. `markForCheck()` just schedules the component for the next cycle, which is safer and usually what you actually want.
4. **Forgetting to call `markForCheck()` for state changed from outside Angular's reactivity** — e.g. a raw WebSocket `onmessage` handler, a third-party charting library's callback, or code run via `NgZone.runOutsideAngular()`. Without a signal-based state model, Angular has no way to know these changes happened.
5. **Applying OnPush to a few leaf components while the rest of the app still mutates shared state.** OnPush is most effective — and safest — when immutability is a project-wide convention, not a per-component afterthought. A single mutating service can quietly break several OnPush components downstream.
6. **Expecting deep/structural equality on `@Input()`.** Angular does not compare object contents; it compares references. Passing `{...sameData}` on every parent render (a *new* object with identical values) will trigger a full re-check of the child even though nothing meaningfully changed — this wastes exactly the work you were trying to save.

## Best Practices

- **Use `OnPush` everywhere.** It's the default since Angular 22. On Angular 20 and 21, add `changeDetection: ChangeDetectionStrategy.OnPush` to every new component, and treat `Eager`/`Default` as the exception you reach for only when you have a specific reason.
- **Prefer Signals (`signal()`, `computed()`, `input()`) over manual `@Input()` + `ChangeDetectorRef` wiring.** Signals give you the fine-grained update behavior OnPush was designed to enable, with far less boilerplate and no risk of a forgotten `markForCheck()`.
- **Make immutability a project-wide rule, not a per-component decision.** Use `readonly` types, spread syntax, and array methods that return new arrays (`map`, `filter`, `concat`) instead of in-place mutators (`push`, `splice`, `sort`).
- **Use the `async` pipe instead of manual `.subscribe()`** wherever practical — it handles both the `markForCheck()` call and the unsubscription for you.
- **Reach for `markForCheck()`, not `detectChanges()`,** unless you have a concrete reason to force a synchronous, immediate check.
- **Use `track` in `@for` blocks (or `trackBy` in `*ngFor`)** so that once change detection does run on a list, Angular reuses existing DOM nodes instead of recreating them.
- **Plan for zoneless.** Since `provideZonelessChangeDetection()` is stable (v20.2+) and the default for new apps (v21+), writing OnPush + Signal-based components today means your app is largely zoneless-ready already.
- **Measure before you optimize.** Use Angular DevTools' change detection profiler to confirm which components are actually being checked unnecessarily before refactoring — OnPush adds real complexity, so apply it where the tree walk demonstrably matters.

## Summary

- The `Eager` strategy (called `Default` before Angular 22) checks every component on every change detection run; `OnPush` checks a component only when there's a specific, trackable reason to. `OnPush` is the default for components since Angular 22.
- OnPush triggers: a new `@Input()`/`input()` reference, an event inside the component's subtree, an `async` pipe emission, a manual `markForCheck()` call, or a signal read in the template changing.
- OnPush prunes subtrees, it doesn't disable change detection app-wide — the path from root to any component that fired an event is always checked.
- OnPush requires immutable data updates; mutating an object in place is invisible to Angular's reference-based input comparison.
- The `async` pipe already calls `markForCheck()` internally, so it "just works" with OnPush.
- `markForCheck()` schedules a check; `detectChanges()` runs one immediately and synchronously — prefer the former unless you need the latter's immediacy.
- Signals (`signal()`, `computed()`, `input()`) integrate directly with change detection, giving fine-grained updates without manual triggers, Zone.js, or even declaring OnPush explicitly (though declaring it is still good practice).
- Zoneless change detection (stable since Angular v20.2, default since v21) relies on the same explicit notification mechanisms OnPush already uses — OnPush + Signals is the direct path toward a zoneless app.
- Always profile with Angular DevTools before restructuring components purely for performance.

## Flash Cards

**Q: What does `ChangeDetectionStrategy.OnPush` do?**
A: It tells Angular to skip checking a component's view (and its subtree) unless a specific trigger occurs — a new input reference, an event inside the subtree, an `async` pipe emission, or a manual `markForCheck()` call.

**Q: Why does mutating an object passed via `@Input()` fail to update an OnPush component?**
A: Angular detects new inputs by comparing references (similar to `Object.is`), so mutating a property in place leaves the reference unchanged and Angular sees nothing to update.

**Q: What's the difference between `markForCheck()` and `detectChanges()`?**
A: `markForCheck()` marks the component and its ancestors as needing a check on the next change detection cycle; `detectChanges()` synchronously runs change detection immediately on that component and its children.

**Q: Do Signals require OnPush or Zone.js to update the UI?**
A: No — reading a signal in a template registers it as a dependency, so Angular schedules a targeted update when it changes, independent of Zone.js and fully compatible with OnPush.

**Q: What is zoneless change detection and how does it relate to OnPush?**
A: A stable Angular scheduling mode (since v20.2, default since v21) that removes Zone.js and relies purely on explicit change notifications — signals, `markForCheck()`, events, and `async` pipe emissions — the exact same triggers OnPush already depends on.

## Exercises

**Easy**
You're given an `AppComponent` using the eager strategy (`ChangeDetectionStrategy.Eager`, or `Default` before Angular 22) with a `TodoListComponent` child. The parent adds items with `this.todos.push(newTodo)`. Convert `TodoListComponent` to `OnPush`, then fix the resulting stale-UI bug by changing the parent's add logic to produce a new array reference instead of mutating the existing one.

**Medium**
Build a `NotificationBadgeComponent` (OnPush) that displays an unread count. Wire it to a mock service that simulates a raw WebSocket: `socket.onMessage(count => { ... })`, called *outside* Angular's normal reactivity. First implement it correctly using `ChangeDetectorRef.markForCheck()` inside the callback. Then refactor the service to expose the count as a `signal<number>()` instead, update the component to read the signal directly, and remove the manual `markForCheck()` call entirely — confirm the UI still updates correctly.

**Challenging**
You have a `DashboardComponent` containing a `SearchBoxComponent` and a `WidgetListComponent` (which renders 50+ `WidgetComponent` children). Currently, typing in the search box causes visible lag because every keystroke re-checks all 50+ widgets even though the search term has nothing to do with their data. Using Angular DevTools' change detection profiler, confirm which components are being checked unnecessarily. Then: (1) apply `OnPush` throughout the tree, (2) ensure the search term is held in a `signal()` local to `SearchBoxComponent` and only exposed via an `output()`, (3) compute the filtered widget list in `DashboardComponent` with a `computed()` signal, and (4) re-profile to confirm `WidgetComponent` instances are no longer checked on every keystroke unless their own filtered data actually changed. As a stretch goal, try enabling `provideZonelessChangeDetection()` and confirm the app still behaves correctly.

## Further Reading

- [Skipping component subtrees — Angular](https://angular.dev/best-practices/skipping-subtrees)
- [Angular Signals guide](https://angular.dev/guide/signals)
- [Zoneless Angular guide](https://angular.dev/guide/zoneless)
- [`provideZonelessChangeDetection()` API reference](https://angular.dev/api/core/provideZonelessChangeDetection)
- [`ChangeDetectionStrategy` API reference](https://angular.dev/api/core/ChangeDetectionStrategy)
- [`ChangeDetectorRef` API reference](https://angular.dev/api/core/ChangeDetectorRef)
- [Component inputs guide (`input()` signals)](https://angular.dev/guide/components/inputs)

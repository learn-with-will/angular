---
id: lesson-21
slug: heavy-computation-web-workers-pure-pipes
title: "Heavy Computation: Web Workers & Pure Pipes"
level: advanced
order: 22
duration: 55
tags:
  - web-workers
  - pipes
  - performance
  - change-detection
  - memoization
---

> **A note on naming:** As of the current Angular style guide, generated files and classes drop the `.component`/`.pipe`/`.service` suffixes (e.g. `user-profile.ts` / `class UserProfile` instead of `user-profile.component.ts` / `class UserProfileComponent`). This lesson follows that convention. If you're working in an older codebase or tutorial, you'll still see the suffixed style — both work identically at runtime.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain why long-running computations on Angular's main thread cause a frozen, unresponsive UI.
- Scaffold, wire up, and safely terminate a Web Worker using the Angular CLI, including a fallback for environments where workers aren't available.
- Explain precisely how Angular's **pure pipes** decide whether to re-run their `transform()` method, and why that decision is based on reference equality, not deep equality.
- Avoid the most common mistake with pure pipes: mutating data in place and expecting the template to update.
- Combine Web Workers and pure pipes in a single, production-realistic pattern: offload the computation, then memoize the formatting.

## Why This Concept Exists

Two very different performance problems both fall under "heavy computation" in a UI framework, and Angular gives you a dedicated tool for each.

**Problem 1: A single computation is big enough to block the frame.** Browsers are single-threaded for JavaScript execution on the main thread. That same thread runs your application logic, Angular's change detection, layout, painting, and input handling. If you run a computation that takes, say, 400ms — sorting a huge array, running a pathfinding algorithm, parsing a large file — the browser cannot paint a new frame, respond to a click, or scroll during that time. The tab visibly freezes. **Web Workers** solve this by running that computation on an entirely separate OS thread, with its own event loop, leaving the main thread free to keep the UI responsive.

**Problem 2: A cheap-ish computation runs far too often.** Angular's change detection re-evaluates template expressions frequently — on user events, timer callbacks, HTTP responses, and signal updates. If a template calls a method directly (`{{ formatReport() }}`), that method reruns on *every single check*, even if the data it depends on hasn't changed at all. For a computation that's non-trivial (formatting a large list, aggregating data, running a regex over text), this adds up to wasted work, dozens of times a second. **Pure pipes** solve this by memoizing: Angular only re-invokes the pipe's `transform()` method when its input has actually changed, and simply reuses the last computed output otherwise.

Neither tool replaces the other. Workers solve *where* work runs (which thread). Pure pipes solve *how often* work runs (only when necessary). The best-practice example later in this lesson shows why you often want both at once.

## Concept Explanation

### Web Workers: a second thread with no shortcuts

A Web Worker is a separate JavaScript execution context (`DedicatedWorkerGlobalScope`) that runs in parallel to your main application thread. It has its own event loop and its own global scope — there is no `window`, no `document`, and no access to Angular's dependency injection, component tree, or DOM. This isolation is precisely what makes it safe to run expensive, blocking code there: whatever happens inside the worker cannot stall rendering on the main thread.

Because a worker doesn't share memory with the main thread, the two sides can't call each other's functions or read each other's variables directly. They can only communicate by **passing messages**:

- The main thread sends data with `worker.postMessage(data)`.
- The worker receives it via its `message` event (`addEventListener('message', ...)`).
- The worker sends results back with its own `postMessage(result)`.
- The main thread receives them via `worker.onmessage`.

The data you pass through `postMessage()` is **copied** using the browser's structured clone algorithm — it is not shared by reference. This is safe (no race conditions on shared objects) but has a cost: copying a very large array or object takes time proportional to its size. For very large numeric payloads, you can avoid that copy entirely using **transferable objects** (like `ArrayBuffer`), which move ownership of the underlying memory instead of duplicating it — more on this in Best Practices.

Angular's CLI has first-class support for scaffolding workers correctly, including the extra `tsconfig.worker.json` your worker file needs (since it targets the `webworker` lib instead of the DOM lib your app code targets).

### Pure pipes: memoization built into the template layer

A **pipe** in Angular is a class implementing `PipeTransform` that transforms a value directly inside a template expression, using the `|` syntax: `{{ value | myPipe }}`. Every pipe is **pure by default** — you don't need to opt in.

Here's the precise mechanism: on every change-detection pass, Angular checks whether a pure pipe's inputs have changed since the last time it ran. That check is:

- For primitives (`string`, `number`, `boolean`): compared **by value** (`===`).
- For objects and arrays: compared **by reference** (`===`) — Angular does *not* look inside the object to see if any property changed.

If none of the inputs changed by this definition, Angular skips calling `transform()` entirely and reuses the previously computed output. If any input did change, `transform()` runs again, and its new return value becomes the new cached output.

This has an important, easy-to-miss consequence: **the cache holds exactly one entry — the most recent call.** A pure pipe is not a general-purpose memoization table keyed by every distinct input you've ever passed it; it only remembers the last input/output pair. If your template flips between two different input values across renders, the pipe recomputes every time.

The reference-equality rule is also why pure pipes pair so naturally with **immutable data patterns**. If you mutate an array in place (`items.push(newItem)`), the array's reference never changes, so a pure pipe watching that array won't notice anything happened — even though the actual contents did change. This is the single most common source of "my pipe isn't updating" bugs, covered in detail in Common Mistakes.

### Where signals fit in

Angular's `computed()` signal offers the same *lazy, memoized* behavior as a pure pipe, but it works anywhere in your TypeScript code — not just inside templates. A `computed()` signal doesn't recalculate until you read it, and once read, it caches its result until one of the signals it depends on changes. Use pure pipes for transformations that only ever need to happen at the point of display in a template; use `computed()` for derived values your component logic needs to reason about directly. The two are complementary, and the best-practice example combines a worker, a service built on signals, and a pure pipe together.

## Key Terminology

| Term | Meaning |
|---|---|
| **Web Worker** | A JavaScript program that runs on a separate background thread, isolated from the DOM and main-thread state. |
| **Main thread** | The single thread that runs your application code, Angular's change detection, layout, and rendering by default. |
| **`postMessage()` / `onmessage`** | The only communication channel between a worker and the main thread; asynchronous, message-based. |
| **Structured clone algorithm** | The browser mechanism that *copies* data passed through `postMessage()`, rather than sharing it by reference. |
| **Transferable object** | An object (e.g. `ArrayBuffer`) whose underlying memory can be *moved* to another thread instead of copied, for zero-copy performance. |
| **Pure pipe** | The default pipe type; `transform()` re-runs only when a primitive input's value or an object/array input's reference changes. |
| **Impure pipe** | A pipe explicitly marked `pure: false`; `transform()` re-runs on every change-detection cycle regardless of input changes. |
| **Memoization** | Caching the result of an expensive call so repeated calls with the same input can skip recomputation. |
| **Reference equality** | Comparing whether two variables point to the *same* object in memory (`===`), as opposed to comparing their contents. |
| **`DestroyRef`** | An injectable Angular API used to register cleanup logic (like `worker.terminate()`) that runs when a component or service is destroyed. |
| **`computed()`** | A signal that derives its value from other signals; lazily evaluated and memoized, usable outside templates. |

## Syntax Overview

**1. Scaffold a worker with the Angular CLI:**

```bash
ng generate web-worker <location>
# e.g.
ng generate web-worker app/prime-finder/prime-finder
```

This creates a `*.worker.ts` file, ensures a `tsconfig.worker.json` exists so the worker file is compiled against the `webworker` library instead of the DOM library, and wires the build so `new Worker(new URL(...))` is bundled correctly.

**2. The worker side — receive a message, do work, send a result:**

```typescript
/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const result = /* expensive computation using `data` */ data;
  postMessage(result);
});
```

**3. The main-thread side — create the worker, listen, send, and clean up:**

```typescript
if (typeof Worker !== 'undefined') {
  const worker = new Worker(new URL('./prime-finder.worker', import.meta.url));

  worker.onmessage = ({ data }) => {
    console.log('Result from worker:', data);
    worker.terminate(); // always terminate when you're done with it
  };

  worker.onerror = (error) => console.error('Worker error', error);

  worker.postMessage({ upperBound: 100_000 });
} else {
  // Fallback: some environments (older browsers, certain SSR contexts) have no Worker support.
}
```

**4. A pure pipe — the `@Pipe` decorator and `PipeTransform` interface:**

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'myTransform',
  // `pure` defaults to `true`; shown here only for clarity.
  pure: true,
})
export class MyTransformPipe implements PipeTransform {
  transform(value: number, factor: number = 1): number {
    return value * factor;
  }
}
```

Used in a template: `{{ someSignal() | myTransform:2 }}`. In a standalone component, the pipe must be added to that component's `imports` array — there's no `NgModule` `declarations` list to register it in.

## Real World Analogy

**Web Workers** are like hiring a second chef in a separate kitchen. If your one chef (the main thread) has to stop taking orders, stop plating dishes, and stop talking to customers for ten minutes to reduce a complicated sauce, your restaurant grinds to a halt. Give that sauce to a second chef in another kitchen, and the first chef keeps serving customers the whole time — they just wait for a plate to be handed through the pass-through window when it's ready.

**Pure pipes** are like a smart cashier preparing your itemized receipt. If a new customer walks up and asks "can I see my total again?" five times while standing at the same register with the same items in their basket, a naive cashier re-adds every item from scratch each time. A smart cashier remembers: "nothing in your basket changed since I last added it up — here's the same total." The moment you actually add or remove an item (a *new* basket, not the same one with something silently swapped inside it), the cashier recalculates.

## Examples

### Example 1 — Basic: Seeing pure pipe memoization in action

This example proves, with a `console.log`, that a pure pipe's `transform()` only runs when its actual input changes — not when unrelated component state changes and triggers change detection.

```typescript
// expensive-format-pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'expensiveFormat' })
export class ExpensiveFormatPipe implements PipeTransform {
  transform(value: number): string {
    console.log('ExpensiveFormatPipe: recalculating…');

    // A stand-in for a genuinely non-trivial synchronous computation.
    let checksum = 0;
    for (let i = 0; i < 2_000_000; i++) {
      checksum += Math.sqrt(i) % (value || 1);
    }

    return `${value.toLocaleString()} (checksum: ${checksum.toFixed(2)})`;
  }
}
```

```typescript
// pipe-demo.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ExpensiveFormatPipe } from './expensive-format-pipe';

@Component({
  selector: 'app-pipe-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExpensiveFormatPipe],
  template: `
    <p>Formatted value: {{ inputValue() | expensiveFormat }}</p>

    <button (click)="incrementUnrelatedCounter()">
      Unrelated clicks: {{ unrelatedCounter() }}
    </button>

    <button (click)="changeInputValue()">Change input value</button>
  `,
})
export class PipeDemo {
  readonly inputValue = signal(7);
  readonly unrelatedCounter = signal(0);

  protected incrementUnrelatedCounter(): void {
    // Triggers change detection, but does NOT change `inputValue`.
    this.unrelatedCounter.update((count) => count + 1);
  }

  protected changeInputValue(): void {
    // Changes the value the pipe actually depends on.
    this.inputValue.update((value) => value + 1);
  }
}
```

**What to notice:** open the console. Clicking "Unrelated clicks" runs change detection (the counter updates on screen) but never logs `"recalculating…"` — the pipe's cached output is reused. Clicking "Change input value" logs it every time, because the input the pipe actually depends on changed.

### Example 2 — Real-world: Finding primes without freezing the UI

This example moves a genuinely expensive computation (checking every number below a bound for primality) into a worker, so the main thread — and any CSS animation or user interaction — stays responsive the entire time.

```typescript
// prime-finder.worker.ts
/// <reference lib="webworker" />

interface PrimeRequest {
  upperBound: number;
}

interface PrimeResponse {
  primes: number[];
  elapsedMs: number;
}

function isPrime(candidate: number): boolean {
  if (candidate < 2) return false;
  for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
    if (candidate % divisor === 0) return false;
  }
  return true;
}

addEventListener('message', ({ data }: MessageEvent<PrimeRequest>) => {
  const start = performance.now();
  const primes: number[] = [];

  for (let n = 2; n <= data.upperBound; n++) {
    if (isPrime(n)) {
      primes.push(n);
    }
  }

  const response: PrimeResponse = { primes, elapsedMs: performance.now() - start };
  postMessage(response);
});
```

```typescript
// prime-finder.ts
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

interface PrimeRequest {
  upperBound: number;
}
interface PrimeResponse {
  primes: number[];
  elapsedMs: number;
}

@Component({
  selector: 'app-prime-finder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>
      Find primes below:
      <input type="number" [value]="upperBound()" (change)="onUpperBoundChange($event)" />
    </label>

    <button (click)="findPrimes()" [disabled]="isCalculating()">Calculate</button>

    @if (isCalculating()) {
      <p>Calculating on a background thread — try scrolling or clicking elsewhere.</p>
    }

    @if (result(); as found) {
      <p>Found {{ found.primes.length }} primes in {{ found.elapsedMs.toFixed(1) }}ms.</p>
    }
  `,
})
export class PrimeFinder {
  private worker: Worker | undefined;

  readonly upperBound = signal(200_000);
  readonly isCalculating = signal(false);
  readonly result = signal<PrimeResponse | null>(null);

  constructor() {
    // Guarantees the worker is stopped no matter how this component is destroyed.
    inject(DestroyRef).onDestroy(() => this.worker?.terminate());
  }

  protected onUpperBoundChange(event: Event): void {
    this.upperBound.set((event.target as HTMLInputElement).valueAsNumber);
  }

  protected findPrimes(): void {
    if (typeof Worker === 'undefined') {
      // Fallback for environments without worker support (e.g. some SSR contexts).
      console.warn('Web Workers are not supported here; skipping background calculation.');
      return;
    }

    this.worker?.terminate(); // cancel any in-flight calculation first
    this.isCalculating.set(true);

    this.worker = new Worker(new URL('./prime-finder.worker', import.meta.url));

    this.worker.onmessage = ({ data }: MessageEvent<PrimeResponse>) => {
      this.result.set(data);
      this.isCalculating.set(false);
      this.worker?.terminate();
    };

    this.worker.onerror = (error) => {
      console.error('Prime finder worker failed', error);
      this.isCalculating.set(false);
      this.worker?.terminate();
    };

    const request: PrimeRequest = { upperBound: this.upperBound() };
    this.worker.postMessage(request);
  }
}
```

**What to notice:** the computation itself can take hundreds of milliseconds for a large bound, yet the "Calculate" button's disabled state updates instantly and the page never stops responding to input, because the loop runs on the worker's thread, not the main thread.

### Example 3 — Best practice: Layering a worker with a pure pipe

Real applications often need *both* techniques together: a worker to keep an expensive computation off the main thread, and a pure pipe to memoize how the *result* of that computation gets formatted for display — so re-rendering the UI for unrelated reasons doesn't redo formatting work either.

```typescript
// dataset-analysis.worker.ts
/// <reference lib="webworker" />

export interface DatasetStats {
  mean: number;
  median: number;
  min: number;
  max: number;
}

addEventListener('message', ({ data }: MessageEvent<number[]>) => {
  const sorted = [...data].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const middle = Math.floor(sorted.length / 2);

  const stats: DatasetStats = {
    mean: sum / sorted.length,
    median: sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };

  postMessage(stats);
});
```

```typescript
// dataset-worker-client.ts
import { Injectable, signal } from '@angular/core';
import type { DatasetStats } from './dataset-analysis.worker';

@Injectable({ providedIn: 'root' })
export class DatasetWorkerClient {
  private worker: Worker | undefined;

  readonly isProcessing = signal(false);
  readonly stats = signal<DatasetStats | null>(null);
  readonly error = signal<string | null>(null);

  analyze(values: number[]): void {
    if (typeof Worker === 'undefined') {
      this.error.set('Web Workers are not supported in this environment.');
      return;
    }

    this.worker?.terminate();
    this.isProcessing.set(true);
    this.error.set(null);

    this.worker = new Worker(new URL('./dataset-analysis.worker', import.meta.url));

    this.worker.onmessage = ({ data }: MessageEvent<DatasetStats>) => {
      // Writing to a signal notifies Angular's reactivity graph directly,
      // so this works correctly whether the app uses zone-based or zoneless change detection.
      this.stats.set(data);
      this.isProcessing.set(false);
      this.worker?.terminate();
    };

    this.worker.onerror = () => {
      this.error.set('The worker failed to analyze the dataset.');
      this.isProcessing.set(false);
      this.worker?.terminate();
    };

    this.worker.postMessage(values);
  }

  cancel(): void {
    this.worker?.terminate();
    this.isProcessing.set(false);
  }
}
```

```typescript
// dataset-summary-pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import type { DatasetStats } from './dataset-analysis.worker';

@Pipe({ name: 'datasetSummary' })
export class DatasetSummaryPipe implements PipeTransform {
  transform(stats: DatasetStats | null): string {
    if (!stats) {
      return 'No analysis yet.';
    }

    console.log('DatasetSummaryPipe: formatting…');
    return (
      `mean ${stats.mean.toFixed(2)} · median ${stats.median.toFixed(2)} ` +
      `· range [${stats.min.toFixed(2)}, ${stats.max.toFixed(2)}]`
    );
  }
}
```

```typescript
// dataset-analyzer.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatasetWorkerClient } from './dataset-worker-client';
import { DatasetSummaryPipe } from './dataset-summary-pipe';

@Component({
  selector: 'app-dataset-analyzer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatasetSummaryPipe],
  template: `
    <button (click)="analyzeSampleDataset()" [disabled]="client.isProcessing()">
      Analyze 2,000,000 values
    </button>

    @if (client.isProcessing()) {
      <p>Crunching numbers on a background thread…</p>
    }

    @if (client.error(); as message) {
      <p class="error">{{ message }}</p>
    }

    <p>{{ client.stats() | datasetSummary }}</p>
  `,
})
export class DatasetAnalyzer {
  protected readonly client = inject(DatasetWorkerClient);

  protected analyzeSampleDataset(): void {
    const values = Array.from({ length: 2_000_000 }, () => Math.random() * 1000);
    this.client.analyze(values);
  }
}
```

**Why this is the best-practice shape:**
- The worker owns the expensive part (sorting and aggregating two million numbers) so the "Analyze" button and any surrounding UI stay responsive.
- `DatasetWorkerClient` centralizes worker creation, messaging, error handling, and termination — the component doesn't know a worker is even involved.
- `DatasetSummaryPipe` is pure, so if this component re-renders for an unrelated reason, the formatting string is *not* rebuilt — it's only rebuilt when `client.stats()` actually returns a new object from the worker.

## Common Mistakes

1. **Calling an expensive method directly in a template.** `{{ getFormattedReport() }}` re-runs on every change-detection cycle, with no memoization at all. Move the logic into a pure pipe or a `computed()` signal instead.
2. **Mutating an array/object and expecting a pure pipe to notice.** `this.items.push(newItem)` keeps the same array reference, so a pure pipe watching `items` won't recompute. Create a new reference instead: `this.items.set([...this.items(), newItem])`.
3. **Assuming a pure pipe caches more than the last call.** The cache holds exactly one entry. If your template alternates between two input values across renders, the pipe recomputes on every render — it is not a general memoization table.
4. **Reaching for `pure: false` "just in case."** Impure pipes re-run on *every* change-detection cycle regardless of whether their inputs changed, which can be very costly on large lists. Reserve `pure: false` for the rare case where a transformation depends on genuinely mutable state Angular can't observe by reference — and prefer restructuring your data to avoid needing it at all.
5. **Forgetting to terminate a worker.** A worker you never call `terminate()` on keeps running in the background even after the component that created it is gone, silently consuming CPU and memory. Always terminate on completion, on error, *and* on component/service destruction (via `DestroyRef`).
6. **Trying to touch the DOM or Angular's DI inside a worker.** A worker has no `window`, no `document`, and no access to Angular's injector — it's a separate global scope. Send whatever the worker needs as plain, structured-clonable data in the message payload.
7. **Sending non-cloneable data through `postMessage()`.** Class instances with methods, functions, and DOM nodes cannot cross the structured-clone boundary. Send plain objects, arrays, and primitives (or typed arrays as transferable objects).
8. **Not guarding for missing Worker support.** Some environments — certain server-side rendering contexts in particular — don't have the `Worker` global at all. Always check `typeof Worker !== 'undefined'` and provide a same-thread fallback.

## Best Practices

- Reserve Web Workers for computations that would meaningfully block the main thread (tens of milliseconds or more). Spinning up a worker for trivially cheap work adds overhead without benefit.
- Keep pipes pure by default. Combine them with immutable data updates (`[...array, item]`, `{...obj, prop: value}`) so reference-equality checks actually reflect real changes.
- Use `computed()` signals for derived values your TypeScript logic needs directly; use pure pipes for transformations that only ever matter at the point of display in a template.
- Wrap a worker's lifecycle (creation, messaging, error handling, termination) in a dedicated injectable class so components stay declarative and the pattern is reusable across features.
- Always pair worker creation with cleanup: terminate on success, on error, and register a `DestroyRef.onDestroy()` callback as a safety net.
- For large numeric payloads, prefer typed arrays transferred via the transfer list (`worker.postMessage(buffer, [buffer])`) over plain arrays, to avoid the cost of the structured clone copy.
- Scaffold workers with `ng generate web-worker <location>` so the CLI sets up `tsconfig.worker.json` and the build pipeline consistently, rather than wiring it by hand.
- Always guard worker usage with `typeof Worker !== 'undefined'` and provide a working fallback, since some execution environments (including certain SSR setups) don't support workers at all.

## Summary

- Web Workers run JavaScript on a separate background thread, so CPU-intensive work doesn't block rendering or user input on the main thread.
- Workers communicate only through message passing (`postMessage`/`onmessage`); data is copied by the structured clone algorithm, not shared by reference.
- Workers have no access to the DOM, `window`, or Angular's dependency injection — they're an isolated execution context.
- Scaffold workers with `ng generate web-worker <location>`, and always guard usage with a `typeof Worker !== 'undefined'` fallback.
- Angular pipes are pure by default: `transform()` only re-runs when a primitive input's value changes, or an object/array input's reference changes.
- Pure pipe memoization is based on reference equality and holds only the most recent call — mutating data in place won't trigger recalculation.
- Impure pipes (`pure: false`) re-run on every change-detection cycle regardless of input changes, and should be used sparingly.
- `computed()` signals offer the same lazy, memoized behavior as pure pipes, but work throughout your TypeScript code, not just templates.
- Combining a worker (for the heavy computation) with a pure pipe or `computed()` (for memoized formatting) keeps the UI responsive while avoiding redundant work on both ends.
- Always terminate workers you no longer need to avoid leaking background threads.

## Flash Cards

**Q: What problem do Web Workers solve in an Angular app?**
A: They move CPU-intensive computation off the main UI thread onto a separate background thread, so long-running work doesn't freeze rendering, animations, or user input.

**Q: How do the main thread and a worker exchange data?**
A: Only through message passing via `postMessage()`/`onmessage`. The data is copied using the structured clone algorithm — or moved with zero copy using transferable objects — never shared by direct reference.

**Q: What does "pure" mean for an Angular pipe?**
A: Its `transform()` method only re-executes when a primitive input changes value, or an object/array input changes by reference — not on every change-detection cycle.

**Q: Why doesn't a pure pipe re-run after `array.push(item)`?**
A: `push()` mutates the array in place, so its reference stays the same. Pure pipes compare non-primitive inputs by reference, so Angular sees "no change" even though the contents changed.

**Q: What Angular API offers similar lazy, memoized derivation but works outside templates too?**
A: `computed()` signals — they recompute only when a dependency signal changes, and cache the result until then.

## Exercises

**Easy:** Create a pure pipe named `wordCount` that takes a string and returns the number of words in it, logging `"wordCount: recalculating"` to the console every time `transform()` runs. Build a small standalone component with a text `signal` bound to an `<input>` and a separate "Increment unrelated counter" button. Confirm in the console that typing in the text field triggers recalculation, but clicking the unrelated button does not.

**Medium:** Use `ng generate web-worker` to scaffold a worker that sorts an array of 500,000 random numbers. Wire it into a component with a "Sort" button, a loading indicator shown only while the worker is running, and a `typeof Worker !== 'undefined'` fallback message. Make sure the worker is terminated both when the sort completes and when the component is destroyed.

**Challenging:** Combine both techniques into a single feature: a service that wraps a worker computing word-frequency counts for a large block of text (return, for example, the top 10 most frequent words with their counts), exposed as signals (`isProcessing`, `result`, `error`). Add a pure pipe that formats the result array into a display string. In your component, verify — using `console.log` inside the pipe and a visible CSS spinner during processing — that (a) the spinner keeps animating smoothly while the worker runs on a large input, proving the main thread isn't blocked, and (b) the formatting pipe only logs a new recalculation when the worker actually emits a new result, not when unrelated component state changes.

## Further Reading

- [Angular — Background processing using web workers](https://angular.dev/ecosystem/web-workers)
- [Angular — `ng generate web-worker` CLI reference](https://angular.dev/cli/generate/web-worker)
- [Angular — Pipes guide](https://angular.dev/guide/templates/pipes)
- [Angular — Signals guide (`computed()`)](https://angular.dev/guide/signals#computed-signals)
- [Angular — Coding style guide](https://angular.dev/style-guide)
- [MDN — Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [MDN — Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)

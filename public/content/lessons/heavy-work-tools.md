---
slug: heavy-work-tools
title: "Two kinds of heavy computation"
topic: performance
kind: concept
summary: "A computation can be too big for one frame, or cheap but run far too often. Each problem has its own tool."
tags: [performance, web-workers, pure-pipes, computed]
related: [web-worker-basics, pure-pipe-memoization, onpush-triggers, change-detection-strategies]
---
> **In one line:** A Web Worker fixes *where* work runs (off the main thread). A pure pipe or `computed()` fixes *how often* it runs. They solve different problems.

## The idea

"Heavy computation" hides two separate problems, and picking the wrong tool does nothing.

**Problem 1: one run is too long.** JavaScript on the main thread also runs change detection, layout, painting and input handling. A 400 ms sort or parse blocks all of them: the tab freezes. A **worker** runs it on another thread.

**Problem 2: a cheap run happens too often.** A template that calls a method, `{{ formatReport() }}`, re-runs it on every check, even if its data did not change. A **pure pipe** or **`computed()`** remembers the last result.

| Symptom | Cause | Tool |
|---|---|---|
| the page freezes during one action | a single long computation | Web Worker |
| fast action, but the page feels sluggish overall | a method re-run on every check | pure pipe or `computed()` |
| both | a long computation re-run too often | `computed()` plus a worker |

## See it

```typescript
// Problem 2: re-runs on every change detection pass
template: `<p>{{ formatReport() }}</p>`

// Fix: a computed signal re-runs only when its inputs change
protected readonly report = computed(() => format(this.rows()));
template: `<p>{{ report() }}</p>`
```

```typescript
// Problem 1: this blocks the main thread for the whole loop
const primes = findPrimes(5_000_000);

// Fix: send it to a worker (next lessons) and keep the UI responsive
worker.postMessage({ upperBound: 5_000_000 });
```

## Go deeper

Measure before choosing. The browser's Performance panel shows a long task as a red-flagged block on the main thread, and Angular DevTools shows how often bindings are evaluated. If no single task is long, a worker is the wrong tool, however heavy the algorithm sounds.

Often the cheapest fix is avoiding the work. Sort and filter on the server, paginate or virtualise the list, or cache the result. A worker moves the cost to another thread, but it still spends the CPU, and it adds copying and complexity.

The two tools combine well. A signal-based service can hold the state, send it to a worker when it changes, and expose the result as another signal, while a pure pipe formats the final value for display. Each part does one job.

## Watch out

- Using a pure pipe for a computation that is too long, which still blocks the frame the first time.
- Reaching for a worker when the real problem is a method called from the template.
- Moving work to a worker without measuring that it was long.

## Remember

- Worker: *where* it runs. Pure pipe or `computed()`: *how often*.
- Diagnose first: one long task, or many repeated ones.
- Often the best fix is doing less work.

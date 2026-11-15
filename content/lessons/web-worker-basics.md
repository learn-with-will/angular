---
slug: web-worker-basics
title: "Web Workers"
topic: performance
kind: technique
summary: "Run a heavy computation on another thread, talk to it with messages, and always terminate it."
tags: [performance, web-workers, postmessage, threads]
related: [heavy-work-tools, pure-pipe-memoization, onpush-triggers, ng-on-destroy]
---
> **In one line:** A worker is a separate thread with no DOM and no Angular. You send it data with `postMessage`, it sends a result back, and you `terminate()` it when done.

## The idea

A worker runs your code in parallel to the UI, with its own event loop and its own global scope. There is no `window`, no `document` and no dependency injection, which is the point: nothing it does can stall rendering.

Because memory is not shared, you cannot call its functions. You exchange **messages**:

```sequence
actor main: Main thread
actor worker: Worker
main -> worker: `postMessage({ upperBound })`
note worker: Heavy loop runs here, UI stays responsive @green
worker --> main: `postMessage({ primes })`
main -> worker: `terminate()`
```

Data sent through `postMessage` is **copied** with the structured clone algorithm, not shared. That is safe, since there are no races on shared objects, but copying a very large payload takes time proportional to its size.

## See it

```bash
ng generate web-worker app/prime-finder/prime-finder
```

```typescript
// prime-finder.worker.ts
/// <reference lib="webworker" />

addEventListener('message', ({ data }: MessageEvent<{ upperBound: number }>) => {
  const primes: number[] = [];
  for (let n = 2; n <= data.upperBound; n++) {
    if (isPrime(n)) primes.push(n);
  }
  postMessage({ primes });
});
```

```typescript
// main thread, inside a component or service
if (typeof Worker !== 'undefined') {
  const worker = new Worker(new URL('./prime-finder.worker', import.meta.url));
  worker.onmessage = ({ data }) => {
    this.primes.set(data.primes);
    worker.terminate();                  // always release the thread
  };
  worker.postMessage({ upperBound: 100_000 });
}
```

## Go deeper

The CLI generator is worth using: it creates a `tsconfig.worker.json` so the worker file compiles against the `webworker` library instead of the DOM one, and wires the build so `new Worker(new URL(...))` is bundled correctly.

Terminate what you no longer need, including in `ngOnDestroy` or through `DestroyRef`. A worker that is never terminated keeps its thread and memory alive for the life of the page.

For large numeric data, **transferable objects** such as `ArrayBuffer` move ownership instead of copying: `worker.postMessage(buffer, [buffer])`. After the transfer the sender can no longer use the buffer, but the cost no longer depends on its size.

Check `typeof Worker !== 'undefined'` and provide a fallback. Some environments, notably server rendering, have no `Worker`. Hold the result in a signal so the view updates in a zoneless app, since the `onmessage` callback is outside Angular's reactivity.

## Watch out

- Forgetting `terminate()`.
- Sending huge objects repeatedly instead of transferring buffers.
- Calling `new Worker` during server rendering.

## Remember

- A worker has its own thread and no DOM or Angular.
- Communicate by `postMessage`; data is copied, buffers can be transferred.
- Terminate it, and write results into a signal.

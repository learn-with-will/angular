---
slug: what-is-observable
title: "What is an Observable?"
topic: rxjs
kind: concept
summary: "A lazy stream of values over time, with a contract of next, then error or complete."
tags: [rxjs, observable, subscribe, contract]
related: [observable-vs-promise, creation-functions, pipe-and-operators, unsubscribe-cleanup]
---
> **In one line:** An Observable is a blueprint for a stream of values delivered over time. Nothing happens until you subscribe.

## The idea

Angular is full of asynchronous events: HTTP responses, clicks, form changes, route changes, timers, sockets. Callbacks and Promises get messy when you need to cancel work, combine sources, or react to *many* values over time.

**RxJS** models all of those as **Observables**. Subscribing starts the stream, and the stream can then emit three kinds of notification:

| Notification | Meaning | How often |
|---|---|---|
| `next` | a value | zero, one or many times |
| `error` | the stream failed and ended | at most once, instead of complete |
| `complete` | the stream finished successfully | at most once, instead of error |

That is the Observable **contract**: any number of `next`, then optionally exactly one `error` *or* `complete`. After either, the stream is finished and sends nothing more.

```sequence
actor src: Observable
actor obs: Observer
obs -> src: `subscribe()`
src --> obs: `next(1)`
src --> obs: `next(2)`
src --> obs: `complete()`
note obs: Nothing arrives after this @green
```

## See it

```typescript
const numbers$ = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});

const subscription = numbers$.subscribe({
  next: (value) => console.log('Received:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Stream complete'),
});

subscription.unsubscribe(); // stop listening and release resources
```

The `$` suffix on `numbers$` is a convention that makes streams easy to spot.

## Go deeper

Five pieces make up the vocabulary. The **Observable** is the stream. The **Observer** is the object with `next`, `error` and `complete` callbacks. The **Subscription** is what `subscribe()` returns, with `unsubscribe()` to stop. **Operators** are functions that turn one Observable into another. A **Subject** is both an Observable and an Observer, so you can push values into it by hand.

Angular exposes Observables in many places: `HttpClient` methods, `ActivatedRoute.paramMap`, `router.events`, and a form control's `valueChanges`. Learning the contract once explains all of them.

Signals now cover simple synchronous state, but streams that need time, cancellation or combining are still RxJS territory, and the two convert freely, as a later lesson shows.

It also helps to know what a Subscription carries. Subscriptions can be combined with `add`, so a parent can end several at once, and `closed` tells you whether it already ended. In practice you rarely manage this by hand, since `takeUntilDestroyed()`, the `async` pipe and `toSignal` do it for you.

What matters is the mental model: a stream is a function you start, that pushes notifications to you, and that you can stop. Every operator you learn next is built on that single idea.

## Watch out

- Expecting anything to run before you subscribe.
- Forgetting a stream is finished after `error` or `complete`.
- Assuming `next` fires only once, as a Promise would resolve.

## Remember

- An Observable is lazy: no subscriber, no work.
- The contract is `next*`, then `error` or `complete`.
- `subscribe()` returns a Subscription you can `unsubscribe()`.

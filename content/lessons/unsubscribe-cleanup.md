---
slug: unsubscribe-cleanup
title: "Ending subscriptions safely"
topic: rxjs
kind: technique
summary: "async pipe, toSignal and takeUntilDestroyed: the three ways to avoid leaks, and where takeUntilDestroyed may be called."
tags: [rxjs, unsubscribe, takeuntildestroyed, memory-leak]
related: [what-is-observable, creation-functions, ng-on-destroy, async-pipe]
---
> **In one line:** A subscription to a stream that never completes must be ended. Prefer the `async` pipe or `toSignal`, and use `takeUntilDestroyed()` for manual subscriptions.

## The idea

A subscription keeps its callbacks, and everything they reference, alive. For a stream that completes, such as one HTTP call, that ends on its own. For `interval`, `fromEvent`, `valueChanges` or a `Subject`, nothing ends it, so a destroyed component keeps running its callbacks and cannot be garbage-collected.

Choose by how much control you need:

| Approach | Best for | Cleanup |
|---|---|---|
| `async` pipe | showing a stream in the template | automatic |
| `toSignal()` | reading a stream as state | automatic, when the injection context is destroyed |
| `takeUntilDestroyed()` | side effects in component or service logic | automatic |
| stored `Subscription` plus `ngOnDestroy` | legacy code only | manual |

## See it

```typescript
export class OrderTracker {
  private readonly http = inject(HttpClient);
  protected readonly order = signal<Order | null>(null);

  constructor() {
    // The constructor is an injection context, so no argument is needed
    this.socket.messages$
      .pipe(takeUntilDestroyed())
      .subscribe((msg) => this.order.set(msg));
  }
}
```

```typescript
export class OrderPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);   // captured in a field

  ngOnInit(): void {
    this.api.current().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
```

## Go deeper

`takeUntilDestroyed()` with no argument needs an **injection context**: a constructor or a field initialiser. `ngOnInit` is not one, so calling it there without arguments throws an error. The fix is the second form above: inject `DestroyRef` as a field and pass it in.

A manual subscription is rarely the best answer. If you only store a result, `toSignal(obs$, { initialValue })` removes both the subscription and the callback. If you only display it, the `async` pipe does. Reserve `subscribe` for genuine side effects such as logging, navigating or writing to storage.

`toSignal()` also needs an injection context, and it unsubscribes when that context ends. In a root service that means never, so a root-level `toSignal` on a long-lived stream stays subscribed for the life of the app, which is usually what you want for app-wide state.

## Watch out

- Subscribing to a never-ending stream with no cleanup.
- Calling `takeUntilDestroyed()` with no argument in `ngOnInit`.
- Using `subscribe` just to copy a value into a field.

## Remember

- Finite streams clean up on their own; infinite ones need help.
- Prefer `async` pipe, `toSignal`, then `takeUntilDestroyed()`.
- No argument is allowed only in an injection context.

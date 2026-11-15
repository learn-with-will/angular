---
slug: pitfall-leaky-facade
title: "Pitfall: a facade that leaks"
topic: di
kind: pitfall
summary: "A service that exposes writable signals, HTTP verbs or raw streams stops hiding anything."
tags: [facade, services, encapsulation, signals]
related: [facade-pattern, signal-state-service, optimistic-update, as-readonly]
---
> **In one line:** A facade only helps while it hides the subsystem. Writable signals, HTTP-verb method names and exposed raw Observables each hand the internals back to the components.

## The idea

The point of a facade is that components do not need to know how data is fetched, stored or changed. Each shortcut below quietly gives some of that knowledge back, and the facade becomes a pass-through that costs you indirection and saves nothing.

| Leak | Why it hurts | Fix |
|---|---|---|
| `readonly entries = signal([])` | any component can call `entries.set([])` | keep it private; expose `asReadonly()` or `computed()` |
| `postEntry()`, `getEntries()` | the method names reveal HTTP | name intents: `add()`, `load()` |
| `facade.http$` | components still subscribe and map responses | expose signals and intent methods |
| `state().entries.push(x)` | same reference, so readers are not notified | build a new object or array |
| one facade with 40 methods | a monolith in disguise | one facade per feature |

A facade that leaks also becomes hard to change later. If components depend on the HTTP shape, renaming an API field means editing every component again, which is exactly what the pattern was supposed to prevent.

## See it

```typescript
// Before: leaks a writable signal and an HTTP-shaped method
@Injectable({ providedIn: 'root' })
export class DiaryFacade {
  readonly entries = signal<ExerciseSet[]>([]);          // anyone can .set() this
  postEntry(entry: NewExerciseSet) { return this.http.post('/api/diary', entry); }
}

// After: private state, read-only view, an intent method
@Injectable({ providedIn: 'root' })
export class DiaryFacade {
  private readonly _entries = signal<ExerciseSet[]>([]);
  readonly entries = this._entries.asReadonly();

  add(entry: NewExerciseSet): void {
    this.api.create(entry).subscribe(saved =>
      this._entries.update(list => [...list, saved]),
    );
  }
}
```

The only way to change the diary is now `add()`, so every rule about adding lives in one place.

## Go deeper

Two more leaks are subtler. Facades depending on each other in a circle (`DiaryFacade` injects `ExercisesFacade` and the reverse) is a sign that a shared piece belongs in a lower-level service both can use.

Long-lived subscriptions inside a root service live as long as the app. HTTP calls complete on their own and need nothing, but a WebSocket subscription held by a root service keeps the connection open after every consumer is gone. Let consumers connect and disconnect, or provide the service at the feature level so it is destroyed with the feature.

A good test of a facade is to read a component that uses it and ask whether it mentions HTTP, response shapes or `.set()` anywhere. If it does, something leaked.

## Watch out

- Exposing the writable signal because it is shorter than writing `asReadonly()`.
- Letting a component subscribe to a raw response stream from the facade. Return signals instead.
- Growing one "god facade" for the whole app. Split by feature.

## Remember

- A facade must hide HTTP, raw responses and writable state.
- Name methods after intents, expose read-only signals, and update state immutably.
- One facade per feature, and check long-lived subscriptions for teardown.

---
slug: facade-pattern
title: "The facade pattern"
topic: di
kind: pattern
summary: "Put one simple, purpose-built service in front of HTTP, state and rules for a feature."
tags: [di, facade, services, signals]
related: [signal-state-service, optimistic-update, pitfall-leaky-facade, smart-and-presentational]
---
> **In one line:** A facade is a feature's single front door: private state, read-only signals for reading, and methods named after what the user wants, with HTTP and other details hidden behind it.

## The idea

When a component talks to `HttpClient` directly it must know a lot: the URL, the response shape, when to reload, how to handle errors, who else needs the same data. Spread over a few screens that gives duplicate requests and copies of state that disagree, fat components full of subscriptions, fragile code when an API field is renamed, and slow tests that mock HTTP for every scenario.

Two ideas fix this together. The **singleton** gives you one shared instance, which Angular's injector provides for free. The **facade** puts a small interface in front of the messy details. Components ask the facade for data and tell it what the user wants. Everything else is the facade's job.

```flow
page: Smart component | reads signals, calls intents @blue
facade: Facade | state, rules and caching @primary
api: API service | HTTP and mapping only @amber
page -> facade: intents
facade -> api: requests
```

A good facade has four parts: **private, writable state** (usually one signal holding an object), **public read-only selectors** (`computed()` values such as `entries`, `loading`, `error`), **intent methods** (`load()`, `add(entry)`, `remove(id)`), and **no leaked internals**, so components never see `HttpClient` or a writable signal.

## See it

```typescript
interface DiaryState { entries: ExerciseSet[]; loading: boolean; error: string | null }

@Injectable({ providedIn: 'root' })
export class DiaryFacade {
  private readonly api = inject(DiaryApi);
  private readonly state = signal<DiaryState>({ entries: [], loading: false, error: null });

  readonly entries = computed(() => this.state().entries);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  load(): void {
    this.patch({ loading: true, error: null });
    this.api.list().subscribe({
      next: entries => this.patch({ entries, loading: false }),
      error: () => this.patch({ loading: false, error: 'Could not load your diary.' }),
    });
  }

  private patch(changes: Partial<DiaryState>): void {
    this.state.update(current => ({ ...current, ...changes }));
  }
}
```

The page now has no `HttpClient`, no `subscribe()` and no error handling: it calls `diary.load()` and reads `diary.entries()`.

## Go deeper

Keep HTTP in a thin API service and state in the facade, so each class stays small: the API service knows endpoints, the facade knows state and rules. The facade can also cache: skip the request when the list is already loaded, and navigating away and back costs nothing. Any other component that injects it, such as a dashboard widget, sees the same data and updates with it.

A signal facade covers most apps. Consider NgRx SignalStore or a global store when many features modify the same state, or when a large team wants one enforced convention. A facade is a good stepping stone: components that only talk to a facade do not change when its insides become a store.

Subscribing inside a root service is fine for HTTP, which completes after one response. Streams that never end, such as sockets, need a teardown plan.

## Watch out

- Providing the facade again in a component, which creates a second instance and splits the state.
- Letting components call the API service directly "just once". The facade stops being the single front door.
- Naming methods after HTTP verbs, such as `postEntry()`. Name intents after what the user wants.

## Remember

- A facade has private state, read-only selectors, intent methods and no leaked internals.
- Keep HTTP in an API service and state and rules in the facade.
- One facade per feature, provided once, shared by every component that needs it.

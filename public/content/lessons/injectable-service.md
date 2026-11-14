---
slug: injectable-service
title: "@Injectable and providedIn"
topic: di
kind: api
summary: "Mark a class as a service Angular can create and share, with providedIn: 'root'."
tags: [di, services, injectable, singleton]
related: [inject-function, provider-scopes, injector-tree, signal-state-service]
---
> **In one line:** `@Injectable({ providedIn: 'root' })` registers a class as an app-wide, tree-shakable singleton that any component or service can ask Angular for.

## The idea

Imagine a component that must fetch data, log errors and check permissions. Without dependency injection it would create `new HttpService()`, `new LoggerService()` and `new AuthService(...)` itself. Three problems follow: the component is welded to specific implementations, every component creates its own copy so nothing shares state, and wiring chains of dependencies by hand gets tedious.

**Dependency injection** (DI) inverts that. The class does not build its dependencies; it *declares* what it needs and Angular's **injector** creates and delivers them. A **service** is just a focused class (fetching data, logging, shared state) made available to DI with `@Injectable`.

`providedIn: 'root'` is the modern way to register it, and it brings three things:

| You get | What it means |
|---|---|
| **Singleton** | one shared instance for the whole app |
| **Tree-shakable** | if nothing ever injects the service, it is dropped from the bundle |
| **No wiring** | no need to add it to any `providers` array |

## See it

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }
}
```

```typescript
@Component({
  selector: 'app-example',
  template: `<button (click)="onClick()">Log</button>`,
})
export class Example {
  private readonly logger = inject(LoggerService);

  onClick(): void {
    this.logger.log('Button clicked!');
  }
}
```

The component never writes `new LoggerService()`. It asks, and Angular supplies the shared instance.

## Go deeper

Services can depend on other services, and DI resolves the whole chain. A `TaskService` that injects `HttpClient` works without you constructing anything: Angular builds `HttpClient` first, then `TaskService`, then hands the result to whoever asked.

A component that only knows a service's public methods is easy to test. Swap the real service for a fake, and the component is none the wiser. That loose coupling is the main reason to use DI at all.

Singletons are shared, which is a feature and a hazard. Storing per-user mutable state in a root service can leak between unrelated parts of the app, and between users when rendering on a server. Scope stateful services narrower when the state should not be global.

## Watch out

- Creating a service with `new`. You bypass DI, lose the shared instance and lose the ability to substitute it in tests.
- Forgetting `provideHttpClient()` (or the matching `provide...()` function) in `app.config.ts`. Injecting `HttpClient` then fails with a "No provider" error.
- Putting per-user state in a root singleton without a reset plan.

## Remember

- A service is a focused class made injectable with `@Injectable`.
- `providedIn: 'root'` gives an app-wide, tree-shakable singleton with no `providers` entry.
- Components ask for services; they never construct them.

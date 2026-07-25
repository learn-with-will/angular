---
id: lesson-04
slug: services-and-dependency-injection
title: "Services & Dependency Injection"
level: intermediate
order: 13
duration: 45
tags:
  - services
  - di
  - inject
  - architecture
  - injection-token
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what Dependency Injection (DI) is and why Angular is built around it.
- Create an injectable service using `@Injectable()` and register it with `providedIn: 'root'`.
- Inject dependencies into components and other services using both the `inject()` function and constructor injection.
- Use Angular's hierarchical injector system to scope services to specific parts of your application.
- Use `InjectionToken` to inject configuration values and non-class dependencies, and swap implementations for testing.

---

## Why This Concept Exists

Imagine a component that needs to fetch data from a backend, log errors, and check user permissions. Without DI, the component would have to create its own instances of an `HttpService`, a `LoggerService`, and an `AuthService` itself, using `new`:

```typescript
class TaskListComponent {
  private http = new HttpService();
  private logger = new LoggerService();
  private auth = new AuthService(this.http, this.logger); // AuthService needs its own dependencies too
}
```

This quickly becomes a problem:

- **Tight coupling** — the component is locked to *specific concrete implementations*. Swapping `HttpService` for a mock in a test means editing the component itself.
- **Duplicated instances** — every component creates its own copy of services, even when they should share state (like a single logged-in user).
- **Manual wiring** — as dependency chains grow (a service needing a service needing a service), constructing objects by hand becomes tedious and error-prone.

**Dependency Injection (DI)** solves this by inverting control: instead of a class creating its own dependencies, an external system (the **Angular injector**) *provides* them. The class simply declares what it needs, and Angular figures out how to construct and deliver it.

This gives you:

- **Loose coupling** — components depend on abstractions (a service's public API), not on how that service is built.
- **Singleton sharing** — by default, one instance of a service can be shared across your whole app.
- **Easy testing** — you can swap a real service for a fake/mock one without touching the component's code.
- **Tree-shakability** — Angular can remove services from your final bundle if nothing ends up using them.

---

## Concept Explanation

### The Injector and the Injection Tree

Angular DI revolves around **injectors**. An injector is an object responsible for creating and caching instances of dependencies (services, values, tokens) and handing them out when requested.

Angular maintains a **hierarchy of injectors**, roughly mirroring your component tree:

1. **Environment injectors** (root level and any lazy-loaded routes) — these hold app-wide, tree-shakable singletons, typically registered via `providedIn: 'root'`.
2. **Element injectors** — created for each component/directive instance that declares its own `providers` array. These allow you to scope a service to a component and its children.

When a component asks for a dependency, Angular walks **up** the injector tree — starting at the component's own element injector, then its parent, and so on up to the root — until it finds a provider that satisfies the request. This is called **hierarchical dependency injection**, and it's what lets you have both app-wide singletons *and* component-scoped instances of the same service class.

### Services

A **service** is just a plain TypeScript class with a focused responsibility — fetching data, logging, managing shared state, talking to browser APIs, etc. What makes it "injectable" is the `@Injectable()` decorator, which tells Angular's compiler that this class can participate in DI (and lets Angular resolve *its* own constructor dependencies too).

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }
}
```

`providedIn: 'root'` is the modern, recommended way to register a service. It means:

- The service is a **singleton** — one shared instance for the whole application.
- The service is **tree-shakable** — if no code ever injects `LoggerService`, it's dropped from the production bundle entirely.
- You do **not** need to manually add it to any `providers` array to use it app-wide.

### Consuming a Service: `inject()` vs. the Constructor

There are two ways to ask the injector for a dependency:

**1. The `inject()` function (recommended in modern Angular)**

```typescript
import { Component, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Component({
  selector: 'app-example',
  template: `<button (click)="onClick()">Log</button>`,
})
export class ExampleComponent {
  private logger = inject(LoggerService);

  onClick(): void {
    this.logger.log('Button clicked!');
  }
}
```

**2. Constructor injection (the classic approach, still fully supported)**

```typescript
import { Component } from '@angular/core';
import { LoggerService } from './logger.service';

@Component({
  selector: 'app-example',
  template: `<button (click)="onClick()">Log</button>`,
})
export class ExampleComponent {
  constructor(private logger: LoggerService) {}

  onClick(): void {
    this.logger.log('Button clicked!');
  }
}
```

Both are functionally equivalent — Angular resolves `LoggerService` from the injector tree either way. `inject()` is generally preferred going forward because it:

- Works as a plain field initializer, so it's easier to combine with class inheritance (no need to forward every dependency through `super()`).
- Can be used inside functions that run in an **injection context** (not just constructors) — for example, inside a route guard function or an `effect()`.
- Keeps constructors free of long parameter lists.

> **Injection context**: `inject()` only works where Angular is actively constructing something and knows *which* injector to use — for example, in field initializers, constructors, or factory functions Angular calls directly (like a functional route guard). Calling `inject()` inside a `setTimeout` callback or after an `await`, for instance, will throw an error because Angular is no longer "inside" the injection context at that point.

### Where Services Get Registered

You can register (provide) a service in a few places, and *where* you register it determines its scope:

| Registration | Scope | When to use |
|---|---|---|
| `@Injectable({ providedIn: 'root' })` | Whole app, one singleton | Default choice for most services |
| `providers: [...]` on a route (`Route.providers`) | One lazy-loaded route subtree | Feature-specific state that shouldn't leak app-wide |
| `providers: [...]` on a `@Component` | That component and its children | A fresh instance per component, or overriding a root service for one part of the UI |

---

## Key Terminology

- **Dependency Injection (DI)**: A design pattern where a class receives its dependencies from an external source instead of creating them itself.
- **Service**: A class with a narrow, reusable responsibility (data access, logging, state, utilities) that is designed to be injected.
- **`@Injectable()`**: A decorator that marks a class as available for DI and lets Angular resolve *its* constructor/field dependencies.
- **Provider**: A recipe that tells the injector *how* to create a value for a given token (e.g., "use this class," "use this existing value," "call this factory function").
- **Injector**: The runtime object that holds provider recipes and creates/caches/returns instances when something is injected.
- **Injection Token (`InjectionToken`)**: An object used as a unique, type-safe identifier for a dependency that isn't a class (e.g., a config object, a string, a browser API).
- **Injection Context**: The specific place/time during app execution where calling `inject()` is valid, because Angular knows which injector to use.
- **Hierarchical Injectors**: Angular's tree of injectors (root/environment and per-component element injectors) that DI requests walk upward through.
- **Tree-shakable Provider**: A provider (like one declared via `providedIn: 'root'`) that the bundler can remove entirely if the service is never injected anywhere.

---

## Syntax Overview

```typescript
// 1. Declaring an injectable service (singleton, tree-shakable)
@Injectable({ providedIn: 'root' })
export class MyService {}

// 2. Injecting with the inject() function (recommended)
export class MyComponent {
  private myService = inject(MyService);
}

// 3. Injecting via the constructor (still valid)
export class MyComponent {
  constructor(private myService: MyService) {}
}

// 4. Scoping a service to a single component (a fresh instance per component)
@Component({
  selector: 'app-widget',
  providers: [MyService],
  template: `...`,
})
export class WidgetComponent {}

// 5. Creating and providing a non-class dependency with InjectionToken
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://api.example.com',
});

// Injecting a token works the same way as injecting a class
export class MyService {
  private baseUrl = inject(API_BASE_URL);
}

// 6. Overriding a provider (e.g., in tests, or to plug in an alternate implementation)
{ provide: MyService, useClass: MockService }
{ provide: API_BASE_URL, useValue: 'https://staging.example.com' }
{ provide: MyService, useFactory: () => new MyService(inject(HttpClient)) }
```

Notes on the provider object syntax:

- `useClass` — instantiate a (possibly different) class to satisfy the token.
- `useValue` — provide a pre-built value directly (no instantiation).
- `useFactory` — call a function to compute the value, optionally injecting further dependencies inside it.
- `useExisting` — alias one token to an already-registered one.

---

## Real World Analogy

Think of Angular DI like **ordering room service at a hotel** instead of cooking your own meal.

- You (the **component**) don't grow the vegetables, buy the equipment, or hire a chef yourself — you just call the front desk and *ask* for what you need ("I'd like a coffee").
- The **hotel's kitchen** (the **injector**) already knows how to prepare that item, has the equipment ready, and sends it up.
- If you're staying in a **suite with its own private kitchenette** (a **component with its own `providers`**), you get a fresh, private coffee maker just for your room, separate from the shared one downstairs.
- If the hotel switches coffee brands (**swapping a provider**, e.g., for testing), you still just say "coffee" — you don't need to change how you order.

You never call `new Coffee()` yourself. You declare what you want, and the system responsible for creating it hands it to you.

---

## Examples

### 1. Basic Example — A Simple Injectable Service

A `GreetingService` that a standalone component injects and uses directly.

```typescript
// greeting.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // Singleton, available app-wide, tree-shakable
})
export class GreetingService {
  greet(name: string): string {
    return `Hello, ${name}! Welcome to Angular DI.`;
  }
}
```

```typescript
// greeting.component.ts
import { Component, inject } from '@angular/core';
import { GreetingService } from './greeting.service';

@Component({
  selector: 'app-greeting',
  template: `<p>{{ message }}</p>`,
})
export class GreetingComponent {
  private greetingService = inject(GreetingService);

  // Computed once when the component is created
  message = this.greetingService.greet('Learner');
}
```

**What's happening:**
- `@Injectable({ providedIn: 'root' })` registers `GreetingService` with the root injector — no extra setup needed in `app.config.ts`.
- `inject(GreetingService)` retrieves the shared singleton instance.
- Since Angular v19+, components are standalone by default, so there's no `standalone: true` flag or `NgModule` required to make this work — just declare `imports` if the template needs other components/directives/pipes (none are needed here).

---

### 2. Real-World Example — An HTTP Data Service with Loading/Error State

A `TaskService` that wraps `HttpClient` calls, injected into a component that renders a task list.

```typescript
// task.model.ts
export interface Task {
  id: number;
  title: string;
  completed: boolean;
}
```

```typescript
// task.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from './task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  completeTask(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, { completed: true });
  }
}
```

```typescript
// task-list.component.ts
import { Component, inject, signal } from '@angular/core';
import { TaskService } from './task.service';
import { Task } from './task.model';

@Component({
  selector: 'app-task-list',
  template: `
    @if (loading()) {
      <p>Loading tasks...</p>
    } @else if (error()) {
      <p>Something went wrong: {{ error() }}</p>
    } @else {
      <ul>
        @for (task of tasks(); track task.id) {
          <li>
            {{ task.title }}
            <button (click)="markDone(task.id)" [disabled]="task.completed">
              {{ task.completed ? 'Done' : 'Mark done' }}
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class TaskListComponent {
  private taskService = inject(TaskService);

  tasks = signal<Task[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  markDone(id: number): void {
    this.taskService.completeTask(id).subscribe((updated) => {
      this.tasks.update((list) =>
        list.map((t) => (t.id === updated.id ? updated : t)),
      );
    });
  }
}
```

For `HttpClient` to be available for injection, register it once in your app config:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()],
};
```

**What's happening:**
- `TaskService` itself injects `HttpClient` using `inject()` — DI works recursively, so services can depend on other services.
- `TaskListComponent` never touches `HttpClient` directly; it only knows about `TaskService`'s public methods. This keeps the component focused on presentation, and the data-fetching logic reusable and testable on its own.
- Because `TaskService` is a root singleton, any other component that injects it shares the *same* instance — useful if you later add in-memory caching.

---

### 3. Best-Practice Example — `InjectionToken` + Scoped Providers for Testability

This example shows two best practices together: using an `InjectionToken` for configuration, and overriding a provider at the component level (useful for feature-specific behavior and for testing).

```typescript
// feature-flags.token.ts
import { InjectionToken } from '@angular/core';

export interface FeatureFlags {
  darkModeEnabled: boolean;
  betaFeaturesEnabled: boolean;
}

// A token with a default factory: works out-of-the-box, but can be overridden anywhere in the tree
export const FEATURE_FLAGS = new InjectionToken<FeatureFlags>('FEATURE_FLAGS', {
  providedIn: 'root',
  factory: () => ({ darkModeEnabled: false, betaFeaturesEnabled: false }),
});
```

```typescript
// theme.service.ts
import { Injectable, inject } from '@angular/core';
import { FEATURE_FLAGS } from './feature-flags.token';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private flags = inject(FEATURE_FLAGS);

  isDarkModeEnabled(): boolean {
    return this.flags.darkModeEnabled;
  }
}
```

```typescript
// beta-panel.component.ts
// This component overrides FEATURE_FLAGS just for itself and its children,
// without affecting the rest of the app.
import { Component } from '@angular/core';
import { FEATURE_FLAGS } from './feature-flags.token';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-beta-panel',
  providers: [
    {
      provide: FEATURE_FLAGS,
      useValue: { darkModeEnabled: true, betaFeaturesEnabled: true },
    },
  ],
  template: `<p>Dark mode here: {{ theme.isDarkModeEnabled() }}</p>`,
})
export class BetaPanelComponent {
  constructor(public theme: ThemeService) {}
}
```

**Why this is a best practice:**
- **Type-safe configuration**: `InjectionToken<FeatureFlags>` gives full TypeScript checking on what gets injected — unlike a raw string or magic value.
- **Sensible defaults, easy overrides**: the `factory` gives every consumer a safe default, while any subtree of the app can override it via a local `providers` array — no global state mutation required.
- **Testability**: in a unit test, you can supply a fake value for the same token instead of the real one:

```typescript
// theme.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { FEATURE_FLAGS } from './feature-flags.token';

describe('ThemeService', () => {
  it('reports dark mode as enabled when the flag is set', () => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: FEATURE_FLAGS, useValue: { darkModeEnabled: true, betaFeaturesEnabled: false } },
      ],
    });

    const service = TestBed.inject(ThemeService);
    expect(service.isDarkModeEnabled()).toBe(true);
  });
});
```

No mocking libraries, no monkey-patching — just provide a different value for the same token, and the class under test is none the wiser.

---

## Common Mistakes

1. **Using `new` to create a service manually.**
   ```typescript
   // ❌ Bypasses DI entirely — you lose singleton sharing and testability
   private logger = new LoggerService();
   ```
   Always let Angular provide the instance via `inject()` or constructor injection.

2. **Registering a service in multiple places by habit (old NgModule reflex).**
   Adding a service to a component's `providers` array "just in case" creates a *new instance* scoped to that component — which silently breaks state sharing if you expected a singleton. Only add a service to `providers` when you deliberately want a scoped instance.

3. **Calling `inject()` outside an injection context.**
   ```typescript
   // ❌ Throws an error — this runs asynchronously, outside the injection context
   ngOnInit() {
     setTimeout(() => {
       const service = inject(MyService);
     }, 1000);
   }
   ```
   Call `inject()` synchronously in a field initializer, constructor, or a factory function Angular invokes directly. If you need a dependency later, capture it in a field first, then use it inside the callback.

4. **Forgetting that `providedIn: 'root'` services are singletons.**
   Storing per-user or per-request mutable state in a root service without resetting it can cause data to "leak" between unrelated parts of the app (or between users, in SSR). Scope stateful services to a route or component when the state shouldn't be global.

5. **Injecting `HttpClient` (or other library services) without providing them.**
   Forgetting `provideHttpClient()` (or the equivalent `provide...()` function) in `app.config.ts` results in a runtime "No provider for HttpClient" error. Standalone apps must explicitly opt into these features.

6. **Using string tokens instead of `InjectionToken`.**
   ```typescript
   // ❌ No type safety, risk of naming collisions
   @Inject('apiUrl') private apiUrl: string
   ```
   Prefer a strongly-typed `InjectionToken<string>` instead — it prevents collisions and gives you autocomplete and type checking.

---

## Best Practices

- **Default to `providedIn: 'root'`** for services unless you have a specific reason to scope them narrower — it's simpler and keeps your bundle tree-shakable.
- **Prefer `inject()` over constructor injection** in new code for consistency, easier inheritance, and use in non-constructor injection contexts (guards, resolvers, `effect()`).
- **Keep services focused** on one responsibility (data access, a single domain's state, a single browser API wrapper) rather than building "god services" that do everything.
- **Depend on abstractions where it matters.** For services likely to be swapped or mocked heavily (e.g., an analytics provider), consider an `InjectionToken` or abstract class so implementations can be swapped without touching consumers.
- **Scope stateful services intentionally.** Use route-level or component-level `providers` when a service's state should reset or be isolated per feature/page, instead of relying on a root singleton.
- **Use `InjectionToken` for non-class values** (config objects, primitives, functions, browser globals like `window`/`document`) rather than trying to inject them as plain values without a token.
- **Avoid logic in constructors that isn't DI-related.** Constructors should mainly wire up injected dependencies; put actual initialization logic in `ngOnInit` or, in modern Angular, in field initializers/`effect()` where appropriate.
- **Override providers for testing, not for hacking around design.** If you find yourself constantly overriding a provider to fix a design problem, it's often a sign the service's responsibilities need to be split up.

---

## Summary

- Dependency Injection (DI) lets classes declare what they need instead of constructing it themselves; Angular's **injector** supplies it.
- A **service** is a plain class marked with `@Injectable()`, typically registered with `providedIn: 'root'` for an app-wide, tree-shakable singleton.
- You can inject dependencies using the modern **`inject()` function** (recommended) or classic **constructor injection** — both resolve from the same injector tree.
- Angular's **hierarchical injectors** let you scope services globally, per-route, or per-component by placing them in the right `providers` array.
- **`InjectionToken`** provides type-safe DI for non-class values like configuration objects, and pairs well with a `factory` for sensible defaults.
- Providers can be customized with `useClass`, `useValue`, `useFactory`, or `useExisting` — this is the mechanism behind swapping implementations and mocking in tests.
- `inject()` only works inside a valid **injection context** — synchronously, during construction or in functions Angular calls directly.
- Good DI hygiene (focused services, intentional scoping, sensible defaults) is what makes Angular apps loosely coupled and easy to test.

---

## Flash Cards

**Q: What is the recommended way to register a service so it's a singleton available throughout the app?**
A: Add `@Injectable({ providedIn: 'root' })` to the service class — no need to list it in a `providers` array manually.

**Q: What's the main advantage of `inject()` over constructor injection?**
A: It works as a plain field initializer (simplifying inheritance) and can be used inside any valid injection context, not just constructors — e.g., inside functional route guards or `effect()`.

**Q: If you add a service that's already `providedIn: 'root'` to a component's own `providers` array, what happens?**
A: That component (and its children) gets its own separate instance of the service, scoped to that component subtree, instead of sharing the app-wide singleton.

**Q: When should you use an `InjectionToken` instead of a class for DI?**
A: When the dependency isn't a class — for example, configuration objects, primitive values, functions, or browser APIs like `window`.

**Q: Why does calling `inject()` inside a `setTimeout` callback throw an error?**
A: Because `inject()` must run synchronously within a valid injection context (e.g., during construction), and Angular is no longer in that context once an asynchronous callback fires.

---

## Exercises

### Easy
Create a standalone `CounterService` with `providedIn: 'root'` that exposes a `count` value (you can use a `signal<number>(0)`) and methods `increment()` and `reset()`. Inject it into a component using `inject()` and display the count in the template with two buttons calling those methods.

### Medium
Build a `NotificationService` that stores a list of in-app messages (e.g., `{ id: number; text: string; type: 'info' | 'error' }`) in a signal. Add methods `addNotification(text: string, type: 'info' | 'error')` and `dismiss(id: number)`. Create two components — a `HeaderComponent` that shows a notification count badge, and a `NotificationListComponent` that lists and can dismiss notifications — and confirm both are reading from the *same* shared instance of the service (since it's `providedIn: 'root'`).

### Challenging
Create an `InjectionToken<{ retryAttempts: number }>` called `HTTP_RETRY_CONFIG` with a default factory value of `{ retryAttempts: 3 }`. Build an `ApiService` that injects this token and logs how many retry attempts it would perform before making a (simulated) request. Then create a feature component that overrides `HTTP_RETRY_CONFIG` in its own `providers` array with `{ retryAttempts: 0 }`, and verify — by injecting `ApiService` in both a "default" area of the app and inside this feature component — that each context receives a differently-configured behavior *without changing `ApiService`'s code*. Optionally, write a unit test using `TestBed` that supplies a mock value for `HTTP_RETRY_CONFIG`.

---

## Further Reading

- [Angular Docs — Dependency injection in Angular](https://angular.dev/guide/di)
- [Angular Docs — Understanding dependency injection](https://angular.dev/guide/di/dependency-injection)
- [Angular Docs — Creating an injectable service](https://angular.dev/guide/di/creating-injectable-service)
- [Angular Docs — Defining dependency providers](https://angular.dev/guide/di/defining-dependency-providers)
- [Angular Docs — Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [Angular Docs — The `inject()` function and injection context](https://angular.dev/guide/di/dependency-injection-context)
- [Angular Docs — HttpClient](https://angular.dev/guide/http)
- [Angular Docs — Testing services](https://angular.dev/guide/testing/services)

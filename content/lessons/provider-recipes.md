---
slug: provider-recipes
title: "useClass, useValue, useFactory, useExisting"
topic: di
kind: api
summary: "The four provider recipes that tell the injector how to produce a dependency."
tags: [di, providers, useclass, usevalue, usefactory]
related: [injection-token, injectable-service, provider-scopes, inject-function]
---
> **In one line:** A provider is a recipe: *when someone asks for this token, give them that*. The four recipes are `useClass`, `useValue`, `useFactory` and `useExisting`.

## The idea

When you write `providers: [LoggerService]`, you use a shorthand: "provide `LoggerService` by constructing `LoggerService`". The long form is an object with a token (`provide`) and one recipe, and it lets you change *what* is delivered without changing who asks.

That is how you swap a real service for a fake in a test, point a token at configuration, or compute a value from other dependencies.

| Recipe | Delivers | Typical use |
|---|---|---|
| `useClass` | an instance of a (possibly different) class | swap an implementation, or a mock in tests |
| `useValue` | a ready-made value, no instantiation | configuration, constants, fakes |
| `useFactory` | whatever a function returns | compute a value, injecting other things |
| `useExisting` | the same instance as another token | alias one token to an existing one |

## See it

```typescript
providers: [
  // Anyone who asks for MyService gets a MockService instead
  { provide: MyService, useClass: MockService },

  // A fixed value for a token
  { provide: API_BASE_URL, useValue: 'https://staging.example.com' },

  // Computed from other dependencies
  { provide: MyService, useFactory: () => new MyService(inject(HttpClient)) },

  // An alias: asking for Logger gives the ConsoleLogger instance
  { provide: Logger, useExisting: ConsoleLogger },
],
```

The consumers do not change. They still call `inject(MyService)` and receive whatever the recipe delivers.

## Go deeper

`useClass` with an abstract class is how you program against an interface. Declare `abstract class Notifier { abstract send(msg: string): void }`, provide `{ provide: Notifier, useClass: EmailNotifier }`, and consumers inject `Notifier` without knowing the implementation. Changing the delivery channel is a one-line change in the providers.

`useFactory` runs in an injection context, so you can call `inject()` inside it to build a value from other services. The factory runs once per injector and its result is cached.

In tests, `useValue` and `useClass` are the everyday tools: provide a fake for the real thing and the class under test does not notice. No mocking library is needed for that.

## Watch out

- Using `useClass` for a class that needs constructor arguments you cannot supply. Use `useFactory` to build it.
- Expecting `useValue` to create anything. It hands out the exact value you give it, so objects are shared.
- Mixing up `useExisting` and `useClass`. `useClass` creates a *new* instance; `useExisting` reuses one that is already registered.

## Remember

- A provider maps a token to a recipe; consumers keep asking for the token.
- `useClass` swaps the class, `useValue` gives a value, `useFactory` computes one, `useExisting` aliases.
- These recipes are how you substitute services in tests.

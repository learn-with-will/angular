---
slug: injection-context
title: "Injection context"
topic: di
kind: concept
summary: "inject() only works while Angular is constructing something and knows which injector to use."
tags: [di, inject, context, async]
related: [inject-function, injectable-service, effect, ng-on-destroy]
---
> **In one line:** An injection context is a moment when Angular is actively creating something and knows which injector to use. `inject()` works inside one and throws outside it.

## The idea

When you call `inject(LoggerService)`, Angular must decide *which* injector to ask. It knows only while it is running your code on purpose: building a component, creating a service, or calling a guard. During that window the "current injector" is set. Once your code runs later, from a timer or after an `await`, the window has closed and `inject()` has no idea where to look.

The practical rule is to call `inject()` synchronously, while the thing is being created:

| Place | `inject()` works? |
|---|---|
| a field initializer | yes |
| the constructor | yes |
| a factory function Angular calls (`useFactory`, `InjectionToken` factory) | yes |
| a functional route guard, resolver or interceptor | yes |
| `ngOnInit` or another lifecycle hook | no |
| inside `setTimeout`, a promise callback or after `await` | no |

The same idea explains why `effect()`, `afterNextRender()` and `takeUntilDestroyed()` also want to be created in a constructor: they are looking for the current injector too.

## See it

```typescript
// Before: inject() runs later, outside the injection context, and throws
ngOnInit(): void {
  setTimeout(() => {
    const service = inject(MyService);       // error
  }, 1000);
}

// After: capture it first, in a field initializer, then use it later
private readonly service = inject(MyService);

ngOnInit(): void {
  setTimeout(() => this.service.refresh(), 1000);
}
```

The field is created synchronously when the component is built, so the dependency is already in hand when the timer fires.

## Go deeper

When you genuinely need to run code that calls `inject()` later, capture the injector and run it explicitly:

```typescript
private readonly injector = inject(Injector);

later(): void {
  runInInjectionContext(this.injector, () => {
    const service = inject(MyService);
    service.refresh();
  });
}
```

`effect()` accepts an `{ injector }` option for the same reason, so you can create one outside the constructor. The pattern is always the same: grab the `Injector` while you can, and hand it over when you cannot.

Most of the time you do not need this. A field initializer that injects what you need is simpler than any of the workarounds.

## Watch out

- Calling `inject()` in `ngOnInit`. It is not an injection context; use a field initializer instead.
- Calling it inside a callback or after `await`. Capture the dependency in a field first.
- Reaching for `runInInjectionContext` when a field would do. It is a last resort.

## Remember

- `inject()` works only while Angular is constructing something.
- Field initializers, constructors, factories and functional guards qualify; lifecycle hooks and async callbacks do not.
- Capture dependencies in fields, or keep the `Injector` and use `runInInjectionContext`.

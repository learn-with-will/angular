---
slug: inject-function
title: "inject()"
topic: di
kind: api
summary: "Ask the injector for a dependency anywhere in an injection context, with options to change the lookup."
tags: [di, inject, constructor, options]
related: [injectable-service, injection-context, injector-tree, provider-scopes]
since: "14"
---
> **In one line:** `inject(Token)` returns a dependency from the current injector. It is the modern replacement for constructor injection, and it also works in guards, resolvers and `effect()`.

## The idea

There are two ways to ask for a dependency. Constructor injection, the classic way, lists dependencies as constructor parameters. The `inject()` function, the recommended way, calls the injector from a field initializer or any function Angular runs in an injection context.

They are equivalent for components. Angular resolves the same service either way. `inject()` is preferred because it works as a plain field initializer, so subclassing does not force you to forward every dependency through `super()`, it keeps constructors free of long parameter lists, and it can be used outside classes entirely.

```typescript
// Before: constructor injection
export class Example {
  constructor(private readonly logger: LoggerService) {}
}

// After: inject() as a field initializer
export class Example {
  private readonly logger = inject(LoggerService);
}
```

## See it

`inject()` takes an options object that changes where the injector looks. These options replace the `@Optional()`, `@Self()`, `@SkipSelf()` and `@Host()` decorators used with constructor injection:

```typescript
// null instead of throwing, if nothing provides Logger
private readonly logger = inject(Logger, { optional: true });

// only a provider declared on this component or directive itself
private readonly state = inject(EditorState, { self: true });

// skip this element and start at the parent, e.g. a menu finding its parent menu
private readonly parentMenu = inject(Menu, { skipSelf: true, optional: true });

// stop the search at the host component
private readonly form = inject(FormGroupDirective, { host: true, optional: true });
```

| Option | Effect |
|---|---|
| `optional` | return `null` if there is no provider |
| `self` | look only on this element's own injector |
| `skipSelf` | start at the parent, skipping this element |
| `host` | stop the search at the host component |

## Go deeper

Because `inject()` is just a function call, you can wrap it. A helper such as `function injectUser() { return inject(AuthService).user; }` can be reused in many components and keeps them tidy. It must still be called where `inject()` works, which is the topic of the injection context lesson.

For functional route guards, resolvers and interceptors there is no class and no constructor, so `inject()` is the *only* way to reach services. That alone is a reason to learn it well.

Constructor injection is still fully supported and you will see it in a lot of code. Nothing is wrong with it. New code simply reads better with `inject()`.

## Watch out

- Calling `inject()` in the wrong place, such as inside a `setTimeout` or after an `await`. It throws outside an injection context.
- Forgetting `{ optional: true }` for a dependency that may not exist. The default is to throw a "No provider" error.
- Mixing styles in one class, with some dependencies in the constructor and others from `inject()`. Pick one so the class is easy to read.

## Remember

- `inject(Token)` replaces constructor parameters and works in guards, resolvers and `effect()`.
- Options (`optional`, `self`, `skipSelf`, `host`) change where the injector looks.
- It only works in an injection context.

---
slug: injection-token
title: "InjectionToken"
topic: di
kind: api
summary: "Inject values that are not classes, such as configuration, with a typed token."
tags: [di, injectiontoken, configuration, testing]
related: [provider-recipes, inject-function, injectable-service, provider-scopes]
---
> **In one line:** A class can be its own injection key, but a string, number, object or function cannot. An `InjectionToken<T>` gives such values a typed key.

## The idea

Injecting a service works because the class itself is the token: asking for `LoggerService` identifies exactly what you want. A base URL, a feature-flag object or `window` is not a class, so there is nothing to ask for by name.

The old workaround was a string token such as `@Inject('apiUrl')`. It has no type information and two libraries can collide on the same string. An **`InjectionToken`** fixes both. The token is a real object, so it is unique, and its generic type tells TypeScript what you will get back.

A token can carry a default through `providedIn` and a `factory`, so it works out of the box and can still be overridden anywhere in the tree.

## See it

```typescript
// Before: a magic string, no type safety, collision risk
constructor(@Inject('apiUrl') private readonly apiUrl: string) {}

// After: a typed token with a default
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://api.example.com',
});

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = inject(API_BASE_URL);   // typed as string
}
```

Overriding it for another environment is one provider, wherever the override belongs:

```typescript
providers: [{ provide: API_BASE_URL, useValue: 'https://staging.example.com' }]
```

## Go deeper

Tokens suit any shape, not just strings. A configuration object gets an interface, and the token carries it:

```typescript
export interface FeatureFlags { darkMode: boolean; beta: boolean }

export const FEATURE_FLAGS = new InjectionToken<FeatureFlags>('FEATURE_FLAGS', {
  providedIn: 'root',
  factory: () => ({ darkMode: false, beta: false }),
});
```

Tokens are also the cleanest way to reach browser globals. Angular already ships `DOCUMENT` as a token, so `inject(DOCUMENT)` is preferred over touching `document` directly, which keeps code working under server-side rendering and easy to fake in a test.

In a test, supply another value for the same token and the class under test is none the wiser: `{ provide: FEATURE_FLAGS, useValue: { darkMode: true, beta: false } }`. No mocking library, no patching.

## Watch out

- Using a string as a token. It carries no type and can collide with another library's string.
- Giving a token no default and then forgetting to provide it. Without a `factory`, injection fails until something provides a value.
- Creating a new `InjectionToken` on every import by accident. Define it once and export it.

## Remember

- `InjectionToken<T>` keys non-class values and carries their type.
- Add `providedIn` and a `factory` for a sensible, overridable default.
- Provide another value for the same token to change configuration or fake it in tests.

---
slug: narrowing-unknown
title: "unknown and narrowing"
topic: architecture
kind: technique
summary: "Accept outside data as unknown, then narrow it with typeof, instanceof, in or a type guard before use."
tags: [typescript, unknown, narrowing, type-guards]
related: [types-erased-at-runtime, discriminated-unions, interface-type-class, utility-types-and-satisfies]
---
> **In one line:** `unknown` accepts any value but forbids using it until you narrow it. A type guard turns a runtime check into a compile-time type.

## The idea

`any` turns the checker off. `unknown` is its safe twin: it can hold anything, but every operation on it is a compile error until you have proved what it is. That makes it the right type for data you did not create.

Narrowing is how you prove it. Each of these tells TypeScript to treat the value as something more specific inside the branch:

| Check | Narrows | Example |
|---|---|---|
| `typeof x === 'string'` | primitives | `string`, `number`, `boolean` |
| `x instanceof Date` | class instances | `Date`, `Error`, `HttpErrorResponse` |
| `'id' in x` | objects by property | picks the union member that has `id` |
| a type predicate `x is T` | anything you can check | `isStoredSettings(x)` |

A **type predicate** is a function returning `value is Settings`. If it returns true, the compiler treats the argument as `Settings` from then on.

## See it

```typescript
interface StoredSettings {
  theme: 'light' | 'dark';
  fontSize: number;
}

function isStoredSettings(value: unknown): value is StoredSettings {
  return (
    typeof value === 'object' &&
    value !== null &&
    'theme' in value &&
    (value.theme === 'light' || value.theme === 'dark') &&
    'fontSize' in value &&
    typeof value.fontSize === 'number'
  );
}

export function readSettings(): StoredSettings {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('settings') ?? 'null');
    return isStoredSettings(parsed) ? parsed : { theme: 'light', fontSize: 16 };
  } catch {
    return { theme: 'light', fontSize: 16 };   // corrupt or blocked storage
  }
}
```

## Go deeper

`localStorage` is a good example because it is untrusted in three ways: the user can edit it, an older version of your app may have written a different shape, and reading it can throw (private mode, blocked storage). Treat every read as `unknown` plus a guard plus a safe default.

Notice `value !== null` before `'theme' in value`. `typeof null === 'object'`, so without that check the `in` operator throws on `null`. Small details like this are why a shared guard, written once and tested, beats ad-hoc checks scattered around the code.

A schema library removes the hand-written guard: `settingsSchema.safeParse(parsed)` validates and infers the type from one definition. Use hand-written predicates for small shapes and a schema for anything large or shared.

Never lie in a predicate. If `isStoredSettings` returns true for something that is not a `StoredSettings`, the compiler trusts it, and you are back to unchecked data with extra confidence.

## Watch out

- Using `any` or `as T` instead of narrowing `unknown`.
- Forgetting `null` when checking for an object.
- Writing a type predicate that is looser than the type it claims.

## Remember

- `unknown` forces a check; `any` skips it.
- Narrow with `typeof`, `instanceof`, `in` or a predicate.
- Read untrusted storage as `unknown`, with a guard and a default.

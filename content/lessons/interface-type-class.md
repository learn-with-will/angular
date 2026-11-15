---
slug: interface-type-class
title: "Interface, type alias or class?"
topic: architecture
kind: concept
summary: "Three ways to describe a shape. Pick by whether you need a runtime value, a union, or only a contract."
tags: [typescript, interface, type-alias, class]
related: [types-erased-at-runtime, discriminated-unions, utility-types-and-satisfies, data-service]
---
> **In one line:** Use `interface` or `type` for data shapes that exist only at compile time, and `class` when you need a runtime value with behaviour.

## The idea

All three can describe an object, but they differ in what exists after compilation.

| Construct | Exists at runtime? | Use for |
|---|---|---|
| `interface` | no, erased | object shapes, API data, component inputs |
| `type` alias | no, erased | unions, intersections, mapped types, function types |
| `class` | **yes**, a real constructor | services, components, anything with methods and state to instantiate |

An `interface` and a `type` for an object are nearly interchangeable. The practical differences are that a `type` can describe **unions** (`'asc' | 'desc'`) and computed shapes, while an `interface` can be extended and merged. Many teams pick one for object shapes and use the other where it is needed.

Angular's own building blocks are classes, because DI needs a runtime token. Data passing through them is usually an interface.

## See it

```typescript
// Data from an API: a compile-time shape, no runtime cost
export interface ExerciseSet {
  id: string;
  exercise: string;
  reps: number;
}

// A union: only a type alias can express this
export type SortOrder = 'asc' | 'desc';

// Behaviour and state: a class, used as a DI token too
@Injectable({ providedIn: 'root' })
export class DiaryStore {
  private readonly _sets = signal<ExerciseSet[]>([]);
  readonly sets = this._sets.asReadonly();
}
```

## Go deeper

Do not make a `class` for plain data "to be safe". A class with only fields forces `new`, hides the data shape behind a constructor, and does not match the JSON that arrives from `HttpClient`, which is a plain object, not an instance. `instanceof` checks on such objects fail, since they were never constructed with `new`.

Strings that are really a fixed set deserve a union type, not `string`. `type Status = 'idle' | 'loading' | 'error'` lets the compiler catch a typo and lets a `switch` check that it handled every case.

A useful default for new code: `interface` for object shapes, `type` for unions and combinations, `class` only when something must be instantiated or injected. The exact split matters less than being consistent within a project.

Prefer `readonly` properties and `ReadonlyArray` for data you do not intend to mutate. That documents the immutability that OnPush and signals rely on, and the compiler enforces it.

## Watch out

- Using a class for plain data, then failing `instanceof` on JSON.
- Typing a fixed set of strings as `string`.
- Mixing interface and type for the same kind of shape without a convention.

## Remember

- Interface and type are erased; class exists at runtime.
- Unions need `type`; injection and behaviour need `class`.
- Use `readonly` to document intended immutability.

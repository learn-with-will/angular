---
slug: utility-types-and-satisfies
title: "Utility types, satisfies and as const"
topic: architecture
kind: api
summary: "Derive new types from existing ones instead of rewriting them, and check values without losing precision."
tags: [typescript, utility-types, satisfies, as-const]
related: [interface-type-class, narrowing-unknown, data-service, types-erased-at-runtime]
---
> **In one line:** `Partial`, `Pick`, `Omit`, `Record` and `Readonly` derive types from one source of truth. `satisfies` checks a value against a type without widening it.

## The idea

Rewriting a near-copy of an interface is how types drift apart. A utility type derives the variant from the original, so a field added to the source appears everywhere automatically.

| Utility | Produces | Typical use |
|---|---|---|
| `Partial<T>` | all fields optional | a patch or update payload |
| `Pick<T, 'a' \| 'b'>` | only the listed fields | a list row showing two fields |
| `Omit<T, 'id'>` | everything except | a create payload without the server id |
| `Record<K, V>` | an object keyed by `K` | a lookup table |
| `Readonly<T>` | all fields `readonly` | immutable state |

## See it

```typescript
interface ExerciseSet {
  id: string;
  exercise: string;
  reps: number;
  notes?: string;
}

type NewExerciseSet = Omit<ExerciseSet, 'id'>;                 // creating: no id yet
type ExerciseSetPatch = Partial<Omit<ExerciseSet, 'id'>>;      // updating: any subset
type SetRow = Pick<ExerciseSet, 'id' | 'exercise'>;            // a list shows two fields

create(draft: NewExerciseSet): Observable<ExerciseSet> {
  return this.http.post<ExerciseSet>('api/sets', draft);
}
update(id: string, patch: ExerciseSetPatch): Observable<ExerciseSet> {
  return this.http.patch<ExerciseSet>(`api/sets/${id}`, patch);
}
```

## Go deeper

`satisfies` solves a different problem. Annotating a value with a type (`const routes: Record<string, string> = {...}`) widens it: every key becomes `string`, and you lose the exact keys. `satisfies` checks the value against the type **but keeps the precise type**:

```typescript
const labels = {
  easy: 'Easy',
  hard: 'Hard',
} satisfies Record<string, string>;

labels.easy;     // fine
labels.medium;   // compile error: the exact keys are kept
```

`as const` freezes a literal to its narrowest form: `const levels = ['easy', 'hard'] as const` has the type `readonly ['easy', 'hard']`, from which you derive a union with `type Level = (typeof levels)[number]`. One array then drives both the runtime list and the compile-time type, so they cannot disagree.

Derive, do not duplicate. If you write `NewExerciseSet` by hand next to `ExerciseSet`, someone will add a field to one and forget the other, and the compiler will not notice until a request fails.

## Watch out

- Hand-copying an interface instead of deriving it.
- Annotating a config object and losing its exact keys.
- Declaring a list of options and a union of the same strings separately.

## Remember

- `Partial`, `Pick`, `Omit`, `Record` derive from one source.
- `satisfies` validates and keeps the precise type.
- `as const` plus `typeof` derives a union from a runtime list.

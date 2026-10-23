---
id: lesson-30
slug: typescript-patterns-for-angular
title: "TypeScript Patterns for Angular"
level: intermediate
order: 18
duration: 40
tags:
  - typescript
  - design-patterns
  - type-guards
  - unknown
  - utility-types
---

## Learning Objectives

By the end of this lesson you will be able to:

- Choose between an `interface`, a `type` alias, and a `class` for each kind of Angular code.
- Let type inference do the work inside functions while still annotating public boundaries.
- Model "one of several shapes" with union and discriminated union types, and make the compiler check you handled every case.
- Narrow types safely with `typeof`, `instanceof`, `in`, and custom type predicates (`value is T`).
- Replace `any` with `unknown` wherever data enters your app from the outside world.
- Use the utility types `Partial`, `Pick`, `Omit`, `Readonly`, and `Record`, plus `satisfies` and `as const`.

## Why This Concept Exists

Angular is built on TypeScript. Dependency injection uses class types as tokens, `strictTemplates` type-checks your HTML, and typed reactive forms infer their value types. But TypeScript only protects you as much as you let it:

- **`any` switches the checker off.** One `any` from an HTTP call can flow through services, components, and templates without a single warning.
- **Casts lie.** `JSON.parse(raw) as UserProgress` compiles fine even when `raw` is a corrupted string from three versions ago.
- **Types disappear at runtime.** `http.get<Order>()` doesn't check the response. It only tells the compiler what you *hope* the server sent.

The patterns in this lesson are about making the compiler work for you inside the app, and about guarding the edges where untyped data comes in.

## Concept Explanation

### Types disappear at runtime

TypeScript compiles to plain JavaScript. `interface` and `type` declarations are erased completely. Compile a file that only contains interfaces and you get an empty file. Classes survive because they're real JavaScript.

This matters because:

- You can't check `value instanceof ExerciseSet` if `ExerciseSet` is an interface.
- `HttpClient.get<T>()` is a *promise to the compiler*, not a runtime check.
- Anything that arrives as text (HTTP bodies, `localStorage`, `postMessage`, URL params) must be checked by your code if you need guarantees.

### Interface vs. type alias vs. class

| Use | Reach for | Why |
|---|---|---|
| Shape of plain data (API responses, DTOs, models) | `interface` | Readable, extendable, erased at runtime. Matches JSON, which has no methods. |
| Unions, function signatures, mapped/derived types | `type` alias | Only `type` can express `A \| B`, `Omit<T, 'id'>`, or `(x: number) => string`. |
| Something with behavior and dependencies | `class` | Components, services, directives, pipes. Angular instantiates them and injects into them. |
| A contract a class must follow | `interface` + `implements` | `implements OnInit` is the classic Angular example. |

A common mistake is declaring a `class` for API data. The objects `HttpClient` returns are plain JSON objects, never instances of your class. Their methods won't exist, and `instanceof` returns `false`.

### Inference: annotate the boundaries, infer the rest

TypeScript infers the type of `let count = 0` (`number`), of array literals, and of most return values. Writing `const name: string = 'Mario'` adds nothing.

A good rule:

- **Annotate** public boundaries: service method parameters and return types, `input<T>()`, `output<T>()`, and `signal<T>()` when the initial value doesn't describe the full type (for example `signal<Order | null>(null)`).
- **Infer** everything local: variables, `computed()` results, and callback parameters.

Annotating return types on public methods also protects you from changes. If someone edits the method body so it returns something different, the error appears in the method, not in twenty callers.

### Unions and discriminated unions

A **union** says "one of these": `type Id = string | number`.

A **discriminated union** gives every member a shared literal field (the *discriminant*), usually `type`, `kind`, or `status`:

```typescript
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
```

Check `state.status === 'success'` and TypeScript knows `state.data` exists. It also knows `message` doesn't. This is much safer than one object with optional fields (`{ loading?: boolean; data?: T; error?: string }`), which allows nonsense combinations like "loading *and* error *and* data".

### Narrowing: `typeof`, `instanceof`, `in`, and type predicates

Narrowing means turning a wide type into a specific one inside a branch:

- **`typeof x === 'string'`** works for primitives: `string`, `number`, `boolean`, `undefined`, `function`, `object`.
- **`x instanceof HttpErrorResponse`** works for classes, because classes exist at runtime.
- **`'socialSecurityNumber' in x`** checks for a property. Since TypeScript 4.9 it also lets you read that property off an `unknown` object.
- **Custom type predicates** are functions whose return type is `value is T`. When they return `true`, TypeScript treats `value` as `T` in that branch. Use them when the check is too long to repeat, or to name a rule like `isPerson`.

### `unknown`: the safe "I don't know yet"

Both `any` and `unknown` accept any value. The difference is what you can do next:

- With `any`, you can do *anything*: call methods, read properties, pass it anywhere. Nothing is checked.
- With `unknown`, you can do *nothing* until you narrow it. The compiler forces the check.

Use `unknown` at trust boundaries: `JSON.parse` results, `catchError((error: unknown) => …)`, `postMessage` data, and anything else that comes from outside your code.

### Utility types you will use every week

- **`Partial<T>`**: every property optional. Good for update payloads and the values of typed forms.
- **`Pick<T, K>` / `Omit<T, K>`**: keep or drop properties. `Omit<ExerciseSet, 'id'>` describes "a set that hasn't been saved yet".
- **`Readonly<T>`**: properties can't be reassigned. Good for state you expose from a service.
- **`Record<K, V>`**: an object with keys of type `K` and values of type `V`, for example `Record<LessonLevel, string>`.

### `satisfies` and `as const`

- **`as const`** freezes a literal so TypeScript keeps the exact values: `const LEVELS = ['beginner', 'intermediate'] as const` gives the type `readonly ['beginner', 'intermediate']`, not `string[]`.
- **`satisfies`** checks that a value matches a type *without widening it*. `{ ... } satisfies Record<LessonLevel, string>` errors if you forget a level, but each value keeps its precise type.

## Key Terminology

- **Type erasure**: TypeScript removes type-only code (interfaces, type aliases, annotations) when compiling to JavaScript.
- **Type inference**: the compiler working out a type from a value or expression without an annotation.
- **Union type**: a type that can be any one of several types, written `A | B`.
- **Discriminated union**: a union whose members share a literal property that tells them apart.
- **Narrowing**: refining a wide type to a more specific one inside a code branch.
- **Type predicate**: a function return type of the form `value is T` that narrows its argument when the function returns `true`.
- **`unknown`**: the type-safe top type. It accepts any value, but must be narrowed before use.
- **Exhaustiveness check**: using the `never` type so the compiler errors if a `switch` misses a union member.
- **Utility types**: built-in generic types (`Partial`, `Pick`, `Omit`, `Readonly`, `Record`) that transform other types.

## Syntax Overview

```typescript
// Interface for plain data
interface ExerciseSet {
  id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
}

// Derived types
type NewExerciseSet = Omit<ExerciseSet, 'id'>;
type ExerciseSetPatch = Partial<NewExerciseSet>;

// Discriminated union
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// Custom type predicate
function isExerciseSet(value: unknown): value is ExerciseSet {
  return typeof value === 'object' && value !== null && 'id' in value && 'exercise' in value;
}

// Exhaustiveness helper
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

// satisfies keeps literal types while checking completeness
const LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} satisfies Record<'beginner' | 'intermediate' | 'advanced', string>;
```

## Real World Analogy

Think of your app as an office building with a mailroom.

- An **interface** is the label format the building expects on every package: name, floor, department.
- A **class** is an employee. They have a job, they *do* things, and HR (dependency injection) hires them.
- Mail from outside is **`unknown`**. Until someone opens the package and checks it, nobody upstairs should touch it.
- A **type predicate** is the mailroom clerk who inspects the package and stamps it "verified: invoice".
- **`any`** is a package that skips the mailroom entirely and goes straight to the CEO's desk.
- A **discriminated union** is color-coded envelopes. Red means invoice, blue means contract. One glance at the color tells you what's inside and which fields to expect.

## Examples

### 1. Basic Example: Modeling API data with interfaces and utility types

A gym diary service where the server owns the `id`. New entries don't have one yet, and updates may send only some fields.

```typescript
// exercise-set.model.ts
export interface ExerciseSet {
  id: string;
  date: string; // ISO date from the API
  exercise: string;
  sets: number;
  reps: number;
}

export type NewExerciseSet = Omit<ExerciseSet, 'id'>;
export type ExerciseSetPatch = Partial<NewExerciseSet>;

export interface ExerciseSetListResponse {
  hasNext: boolean;
  items: ExerciseSet[];
}
```

```typescript
// exercise-sets.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ExerciseSet,
  ExerciseSetListResponse,
  ExerciseSetPatch,
  NewExerciseSet,
} from './exercise-set.model';

@Injectable({ providedIn: 'root' })
export class ExerciseSetsService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/diary';

  // Public methods: annotate parameters and return types.
  list(): Observable<ExerciseSet[]> {
    return this.http.get<ExerciseSetListResponse>(this.url).pipe(map((res) => res.items));
  }

  create(entry: NewExerciseSet): Observable<ExerciseSet> {
    return this.http.post<ExerciseSet>(this.url, entry);
  }

  update(id: string, patch: ExerciseSetPatch): Observable<ExerciseSet> {
    return this.http.patch<ExerciseSet>(`${this.url}/${id}`, patch);
  }
}
```

**Why this works:** one interface is the source of truth, and `Omit`/`Partial` derive the other shapes from it. If you rename `reps` to `repetitions`, every derived type and every caller updates or errors together. `create()` also refuses an object that already has an `id`, which documents who owns that field.

### 2. Real-World Example: Reading `localStorage` safely with `unknown` and a type guard

This portal saves your progress in `localStorage`. That data can be missing, hand-edited, or from an older version of the app, so it must be checked before you trust it.

```typescript
// progress.model.ts
export interface UserProgress {
  completedLessons: string[];
  bookmarkedLessons: string[];
  quizResults: Record<string, { score: number; passed: boolean; completedAt: string }>;
}

export const EMPTY_PROGRESS: Readonly<UserProgress> = {
  completedLessons: [],
  bookmarkedLessons: [],
  quizResults: {},
};
```

```typescript
// progress.guards.ts
import { UserProgress } from './progress.model';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isUserProgress(value: unknown): value is UserProgress {
  return (
    typeof value === 'object' &&
    value !== null &&
    // Since TS 4.9, `in` lets us read the property off an unknown object.
    'completedLessons' in value &&
    isStringArray(value.completedLessons) &&
    'bookmarkedLessons' in value &&
    isStringArray(value.bookmarkedLessons) &&
    'quizResults' in value &&
    typeof value.quizResults === 'object' &&
    value.quizResults !== null
  );
}
```

```typescript
// progress.store.ts
import { Injectable, signal } from '@angular/core';
import { EMPTY_PROGRESS, UserProgress } from './progress.model';
import { isUserProgress } from './progress.guards';

const STORAGE_KEY = 'angular-learning-progress';

@Injectable({ providedIn: 'root' })
export class ProgressStore {
  private readonly _progress = signal<UserProgress>(this.read());
  readonly progress = this._progress.asReadonly();

  private read(): UserProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // JSON.parse returns `any`. Assigning it to `unknown` forces a check.
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return isUserProgress(parsed) ? parsed : structuredClone(EMPTY_PROGRESS);
    } catch {
      // Corrupted JSON: start fresh instead of crashing the app.
      return structuredClone(EMPTY_PROGRESS);
    }
  }
}
```

**Why this works:** the only place that touches raw text is `read()`. Everything after it gets a real `UserProgress`. If you had written `JSON.parse(raw) as UserProgress`, a corrupted value would crash the dashboard later, far from the cause.

### 3. Best-Practice Example: A discriminated union with an exhaustive `switch`

This portal supports five quiz question types. Each has a different answer shape, which makes it a textbook discriminated union.

```typescript
// quiz.model.ts (simplified)
interface Base {
  id: string;
  prompt: string;
}

export type QuizQuestion =
  | (Base & { type: 'single-choice'; answer: string })
  | (Base & { type: 'multiple-choice'; answer: string[] })
  | (Base & { type: 'fill-blank'; answer: string[] }) // accepted spellings
  | (Base & { type: 'ordering'; answer: string[] })
  | (Base & { type: 'match-pair'; pairs: { left: string; right: string }[] });

export type QuestionType = QuizQuestion['type']; // derived, never out of sync

export type AnswerValue = string | string[] | Record<string, string>;
```

```typescript
// grade.ts
import { AnswerValue, QuestionType, QuizQuestion } from './quiz.model';

function assertNever(value: never): never {
  throw new Error(`Unhandled question: ${JSON.stringify(value)}`);
}

const isList = (value: AnswerValue): value is string[] => Array.isArray(value);

const isMap = (value: AnswerValue): value is Record<string, string> =>
  typeof value === 'object' && !Array.isArray(value);

const sameItems = (a: string[], b: string[]) =>
  a.length === b.length && a.every((item) => b.includes(item));

export function isCorrect(question: QuizQuestion, answer: AnswerValue): boolean {
  switch (question.type) {
    case 'single-choice':
      return answer === question.answer;
    case 'multiple-choice':
      return isList(answer) && sameItems(answer, question.answer);
    case 'fill-blank': {
      if (typeof answer !== 'string') return false;
      const given = answer.trim().toLowerCase();
      return question.answer.some((accepted) => accepted.trim().toLowerCase() === given);
    }
    case 'ordering':
      return isList(answer) && answer.join('|') === question.answer.join('|');
    case 'match-pair':
      return isMap(answer) && question.pairs.every((pair) => answer[pair.left] === pair.right);
    default:
      // If someone adds a sixth question type and forgets this switch,
      // `question` is no longer `never` here and compilation fails.
      return assertNever(question);
  }
}

// `satisfies` errors if a type is missing, but keeps each label's literal type.
export const QUESTION_LABELS = {
  'single-choice': 'Pick one',
  'multiple-choice': 'Pick all that apply',
  'fill-blank': 'Type the answer',
  ordering: 'Put in order',
  'match-pair': 'Match the pairs',
} satisfies Record<QuestionType, string>;
```

**Why this is best practice:** `QuestionType` is derived from the union, so there's one source of truth. Inside each `case`, TypeScript knows exactly which `answer` shape exists. The `assertNever` default turns "we forgot to handle the new question type" from a production bug into a compile error. `satisfies` gives the label table the same protection.

## Common Mistakes

- **Using `String`, `Number`, and `Boolean` as types.** Those are JavaScript wrapper *objects*. Always write lowercase `string`, `number`, `boolean`.
- **Letting `any` creep in.** `http.get<any>()`, `catchError((e: any) => …)`, or an untyped `JSON.parse` result spreads unchecked data through the app. Use a real type, or `unknown` plus a guard.
- **Casting instead of checking.** `value as UserProgress` silences the compiler but checks nothing at runtime. Reach for a type predicate when the data comes from outside.
- **Believing `get<T>()` validates the response.** It doesn't. If the backend contract matters, validate at the edge (a type guard, or a schema library such as Zod or Valibot).
- **Declaring classes for API data.** JSON objects are never class instances, so methods and `instanceof` won't work. Use interfaces for data.
- **Optional-field soup instead of a union.** `{ loading?: boolean; data?: T; error?: string }` allows impossible states. A discriminated union makes them impossible to write.
- **Sprinkling `!` (non-null assertion) to make errors go away.** Prefer narrowing, a default value, or `input.required<T>()` for inputs a component can't work without.
- **Over-annotating.** `const total: number = a + b` is noise. Annotate boundaries and let inference handle locals.

## Best Practices

- Keep `"strict": true` in `tsconfig.json` and `strictTemplates` in the Angular compiler options. New CLI projects enable both.
- Model plain data with `interface`, combinations with `type`, and behavior with `class`.
- Derive related types (`Omit`, `Partial`, `QuizQuestion['type']`) instead of copying them by hand.
- Use discriminated unions for "one of several states", and add an `assertNever` default so every `switch` is exhaustive.
- Treat every boundary (HTTP, storage, messages, URLs) as `unknown` until a guard proves its shape.
- Put type guards in their own small, pure functions. They're easy to unit-test.
- Prefer string literal unions (`'idle' | 'loading'`) over `enum` for simple sets of values. They're erased at compile time and read naturally in templates.
- Use `satisfies` for lookup tables and configuration objects, so you get completeness checks without losing literal types.

## Summary

- TypeScript types are erased at runtime, so data from outside your code must be checked by your code.
- Use interfaces for data shapes, type aliases for unions and derived types, and classes for things with behavior.
- Annotate public boundaries and let inference handle the rest.
- Discriminated unions model mutually exclusive states. `assertNever` makes the compiler check that every case is handled.
- Narrow with `typeof`, `instanceof`, `in`, and custom `value is T` predicates.
- `unknown` is the safe replacement for `any`: it accepts anything but forces a check before use.
- `Partial`, `Pick`, `Omit`, `Readonly`, and `Record` derive new types from existing ones. `satisfies` checks a value without widening it.

## Flash Cards

**Q: Why can't you use `instanceof` with an interface?**
A: Interfaces are erased when TypeScript compiles to JavaScript, so there's nothing left to check against at runtime. Only classes exist at runtime.

**Q: What is the practical difference between `any` and `unknown`?**
A: Both accept any value, but `any` lets you do anything with it unchecked, while `unknown` lets you do nothing until you narrow it with a type check.

**Q: What makes a union "discriminated"?**
A: Every member shares a property with a different literal value (for example `status: 'loading' | 'success' | 'error'`), so checking that one property tells TypeScript exactly which member you have.

**Q: How does `assertNever` make a `switch` exhaustive?**
A: In the `default` branch, the value should have type `never` if every case was handled. Passing it to a function that only accepts `never` causes a compile error as soon as a new, unhandled member is added to the union.

**Q: When would you use `satisfies` instead of a type annotation?**
A: When you want TypeScript to check that a value matches a type (for example, that a label table covers every level) but still keep the precise literal types of its values instead of widening them.

## Exercises

**Easy**
Create an `Exercise` interface (`id`, `description`) and derive `NewExercise` (without `id`) and `ExercisePatch` (all fields optional, without `id`). Type the parameters and return values of `create()` and `update()` methods in an `ExercisesService`.

**Medium**
Write `isExerciseList(value: unknown): value is Exercise[]` and use it to safely load a cached exercise list from `sessionStorage`. Fall back to an empty array if the stored value is missing, invalid JSON, or the wrong shape. Write two unit tests: one with valid data and one with a corrupted string.

**Challenging**
Model a page's data with `type LoadState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; message: string }`. Store it in a `signal<LoadState<Exercise[]>>`, derive `items` and `errorMessage` with `computed()` using narrowing, and write a `describeState()` function with an exhaustive `switch`. Then add a fifth status, `'empty'`, and confirm the compiler points you at every place that needs updating.

## Further Reading

- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TypeScript 4.9 release notes: `satisfies` and `in` narrowing](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [Angular: Template type checking](https://angular.dev/tools/cli/template-typecheck)
- [Angular coding style guide](https://angular.dev/style-guide)

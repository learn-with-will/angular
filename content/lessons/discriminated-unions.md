---
slug: discriminated-unions
title: "Discriminated unions and exhaustive switches"
topic: architecture
kind: pattern
summary: "Model alternatives with a shared tag, so the compiler forces you to handle every case."
tags: [typescript, unions, exhaustive, state-modeling]
related: [narrowing-unknown, interface-type-class, reducer-feature, types-erased-at-runtime]
---
> **In one line:** Give each variant a literal `kind` field. A `switch` on it narrows each branch, and an `assertNever` default turns a forgotten case into a compile error.

## The idea

Many values are "one of several shapes": a question that is multiple-choice or fill-in, a request that is loading, loaded or failed. A bag of optional fields (`error?`, `data?`, `loading?`) lets impossible combinations exist, such as `loading: true` with an `error`.

A **discriminated union** makes each shape its own type with a shared literal tag. Impossible states cannot be written.

| Bag of optionals | Discriminated union |
|---|---|
| `{ loading: boolean; data?: T; error?: string }` | `{ status: 'loading' } \| { status: 'ok'; data: T } \| { status: 'error'; message: string }` |
| `data` may be missing while "ok" | `data` exists exactly when `status` is `'ok'` |
| new state means checking every consumer by hand | new state breaks every non-exhaustive `switch` at compile time |

## See it

```typescript
type Question =
  | { kind: 'single-choice'; prompt: string; options: string[]; answer: number }
  | { kind: 'fill-blank'; prompt: string; answers: string[] }
  | { kind: 'ordering'; prompt: string; items: string[] };

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

function isCorrect(question: Question, response: unknown): boolean {
  switch (question.kind) {
    case 'single-choice':
      return response === question.answer;          // question is narrowed here
    case 'fill-blank':
      return typeof response === 'string' && question.answers.includes(response);
    case 'ordering':
      return JSON.stringify(response) === JSON.stringify(question.items);
    default:
      return assertNever(question);                 // compile error if a case is missing
  }
}
```

## Go deeper

The `default` branch is the trick. After handling every variant, the remaining type is `never`, so passing `question` to `assertNever(value: never)` compiles. Add a fourth `kind` to the union and forget the `switch`: `question` is no longer `never` at that point, and the build fails exactly where the case is missing.

Inside each `case`, the compiler narrows `question` to that variant, so `question.options` is available only for `'single-choice'`. That removes casts and optional chaining that would otherwise creep in.

The same pattern models UI and store state well. A `signal<LoadState<Product[]>>` with `idle | loading | loaded | failed` variants makes the template an `@switch` over `state().status`, and the reducer cases correspond one to one with the variants.

Choose a meaningful tag name (`kind`, `type`, `status`) and use it consistently across the codebase. It is the contract every `switch` relies on, and it should be a string literal, not a plain `string`.

## Watch out

- Optional-field bags that allow impossible states.
- A `switch` with no `assertNever` default, which silently ignores new variants.
- Typing the tag as `string` instead of a literal.

## Remember

- One shared literal tag; each variant carries its own fields.
- `switch` narrows per case; `assertNever` enforces exhaustiveness.
- Model loading, loaded and failed as variants, not flags.

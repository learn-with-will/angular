---
slug: pitfall-forms-module-and-name
title: "Pitfall: missing FormsModule or name"
topic: forms
kind: pitfall
summary: "The two errors every template-driven form hits first, and a way to spot each in seconds."
tags: [forms, ngmodel, errors, bugs]
related: [ngmodel-two-way, template-driven-form, pitfall-silent-directive, forms-two-approaches]
---
> **In one line:** If `ngModel` is not recognised, `FormsModule` is missing. If it throws inside a `<form>`, the input has no `name`.

## The idea

Two small omissions cause almost every beginner error with `ngModel`. They look different, so each is easy to diagnose once you know the symptom.

| Symptom | Cause | Fix |
|---|---|---|
| *Can't bind to 'ngModel' since it isn't a known property of 'input'* | `FormsModule` is not imported | add it to the component's `imports` |
| *If ngModel is used within a form tag, either the name attribute must be set or the form control must be defined as 'standalone'* | the input has no `name` | add `name="..."` |

The second one exists because `name` is the **key** Angular registers the control under in the form's value object. Without it there is no key, so Angular refuses rather than guessing.

A single input *outside* any `<form>` has no group to register in, so it does not need a `name`.

## See it

```typescript
// Before: both mistakes in one component
@Component({
  template: `
    <form>
      <input [(ngModel)]="city" />
    </form>
  `,
})
export class Bad {
  city = '';
}

// After: import the module and name the control
@Component({
  imports: [FormsModule],
  template: `
    <form>
      <input name="city" [(ngModel)]="city" />
    </form>
  `,
})
export class Good {
  city = '';
}
```

## Go deeper

Sometimes you want an `ngModel` inside a form that should *not* join it, for example a "filter" box sitting in the same `<form>` as unrelated fields. Opt out with `[ngModelOptions]="{ standalone: true }"`, and the missing `name` is no longer an error.

The missing-module case is the same family as the silent directive: with an unknown *property* binding Angular reports an error, but a plain attribute such as `required` on an element whose directive is not imported just does nothing. A form that never validates is often a missing import.

Because components are standalone, there is no shared module to supply `FormsModule` for you. Every component that uses `ngModel` imports it directly.

## Watch out

- Importing `ReactiveFormsModule` and expecting `ngModel` to work. It is `FormsModule`.
- Duplicate `name` values in one form. The second control overwrites the first in the value object.
- Adding `standalone: true` to silence the name error when the input should actually be in the form.

## Remember

- *Can't bind to ngModel* means import `FormsModule`.
- Inside a `<form>`, every `ngModel` needs a unique `name`.
- `standalone: true` opts one control out of the form.

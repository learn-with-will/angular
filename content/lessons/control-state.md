---
slug: control-state
title: "Control state: valid, touched, dirty"
topic: forms
kind: concept
summary: "Every form control tracks six pieces of state you can read and style, in both form styles."
tags: [forms, state, touched, dirty, pending]
related: [template-validation, reactive-validation-errors, async-validator, form-reset-and-raw-value]
---
> **In one line:** A control knows its `value`, whether it passes its validators, whether the user has changed it, and whether they have visited it. Messages and styling are built from those flags.

## The idea

All controls, in template-driven and reactive forms alike, extend `AbstractControl`. They share the same state, which is why one mental model covers both:

| State | Means | Becomes true when |
|---|---|---|
| `valid` / `invalid` | passes all validators or not | validators run |
| `pristine` / `dirty` | the value is untouched or changed | the **user** edits the value |
| `untouched` / `touched` | never focused, or focused then left | the field loses focus (blur) |
| `pending` | an async validator is still running | an async validator starts |
| `errors` | an object of failures, or `null` | a validator fails |
| `value` | the current value | any change |

`dirty` and `touched` are independent. Tabbing through a field makes it `touched` but not `dirty`, and changing a value through code with `setValue()` does **not** make it `dirty`, because the user did not do it.

Angular mirrors these onto the element as CSS classes (`ng-valid`, `ng-invalid`, `ng-pristine`, `ng-dirty`, `ng-untouched`, `ng-touched`, `ng-pending`), so you can style a field without any template logic.

## See it

```css
/* Style invalid fields, but only once the user has been there */
input.ng-invalid.ng-touched {
  border-color: #c0392b;
}

input.ng-valid.ng-dirty {
  border-color: #2e7d32;
}
```

```typescript
const email = new FormControl('', { nonNullable: true, validators: Validators.email });

email.setValue('not-an-email');
console.log(email.invalid, email.dirty, email.touched); // true false false

email.markAsTouched();
console.log(email.touched);                              // true
```

## Go deeper

The usual condition for showing an error is `invalid && (touched || dirty)`. Add `!pending` when an async validator is involved, so a stale error never flashes while a new check is running.

You can set state yourself: `markAsTouched()`, `markAsDirty()`, `markAsPristine()`, and `markAllAsTouched()` on a group. The last one is the standard way to reveal every message when someone presses Submit on an untouched form.

Parent controls roll up their children. A group is `invalid` if any child is, and `dirty` if any child is. That is why one `form.invalid` check covers the whole form.

## Watch out

- Showing errors on `invalid` alone, so a pristine form already looks broken.
- Expecting `setValue()` to make a control `dirty`. Only user changes do.
- Forgetting `pending`, so a stale error appears next to a "checking" indicator.

## Remember

- Six states: value, valid, pristine/dirty, untouched/touched, pending, errors.
- `touched` is about focus; `dirty` is about the user changing the value.
- Style with the `ng-*` classes, and roll up through groups.

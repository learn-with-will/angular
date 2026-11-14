---
slug: form-builder
title: "FormBuilder and typed forms"
topic: forms
kind: api
summary: "Build the same model in a third of the code with FormBuilder, and keep the types clean."
tags: [forms, formbuilder, typed-forms, nonnullable]
related: [reactive-form-model, nested-groups, form-array, inject-function]
---
> **In one line:** `inject(NonNullableFormBuilder)` gives you short syntax for controls, groups and arrays, with types that never contain an unwanted `null`.

## The idea

Writing `new FormControl(...)` and `new FormGroup(...)` for every field gets noisy. `FormBuilder` is a small service that creates the same objects with less ceremony. It adds nothing new, and the result is identical.

The detail worth learning is **`nonNullable`**. A plain control resets to `null`, so its type is `string | null` everywhere you read it. A non-nullable control resets to its initial value, and its type stays `string`.

| Builder | `reset()` gives | Type of `form.value.email` |
|---|---|---|
| `fb.group({ email: [''] })` | `null` | `string \| null \| undefined` |
| `fb.nonNullable.group({ email: [''] })` | `''` | `string \| undefined` |
| `inject(NonNullableFormBuilder).group(...)` | `''` | `string \| undefined` |

For the type with no `undefined` at all, read `getRawValue()` instead of `value`; the next-but-one lesson explains why.

## See it

```typescript
@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './signup.html',
})
export class Signup {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    newsletter: [false],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue(); // { email: string; password: string; newsletter: boolean }
  }
}
```

Each field is `[initialValue, validators, asyncValidators]`. Pass a single validator or an array.

## Go deeper

Types come from the initial values, so there is nothing to declare. If a field starts empty but holds a number later, give the type explicitly: `this.fb.control<number | null>(null)`.

Prefer `inject()` over constructor injection, as everywhere else in modern Angular. Note that the builder must be created *before* the field that uses it. Property initialisers run in order, so declare `fb` above `form`.

For a large form, you can split the model into small functions that each return a group (`buildAddressGroup(fb)`), then compose them. Each piece stays readable and testable.

## Watch out

- Using plain `FormBuilder` and getting `string | null` types after `reset()`.
- Declaring `form` above `fb`, so `fb` is `undefined` when the initialiser runs.
- Passing validators as the third element when you meant the second. Order is value, sync, async.

## Remember

- `NonNullableFormBuilder` is shorter and keeps types free of `null`.
- A field is `[initial, validators, asyncValidators]`.
- Declare `fb` before the form that uses it.

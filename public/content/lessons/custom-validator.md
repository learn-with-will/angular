---
slug: custom-validator
title: "Custom validators and factories"
topic: forms
kind: technique
summary: "A validator is just a function. Write one for your own rule, and a factory when it needs a parameter."
tags: [forms, validation, validators, factories]
related: [reactive-form-model, cross-field-validator, async-validator, validator-directive]
---
> **In one line:** A synchronous validator is a function from a control to `null` (valid) or an object that says what is wrong. A factory returns such a function so you can configure it.

## The idea

Built-in validators cover the common cases. Real apps add their own rules: "no spaces", "at least one digit", "must be 18 or older". Angular does not need a special API for that, because a validator is only a function with this shape:

```typescript
type ValidatorFn = (control: AbstractControl) => ValidationErrors | null;
```

| It returns | Meaning |
|---|---|
| `null` | the value is valid |
| `{ key: details }` | invalid; the key names the rule and the details explain it |

Angular calls it whenever the value changes and merges the result into `control.errors`. Most useful validators take a parameter, so they are written as **factories**: a function that *returns* the validator.

## See it

```typescript
// A plain validator: it IS the function
export const noSpaces: ValidatorFn = (control) =>
  /\s/.test(control.value ?? '') ? { noSpaces: true } : null;

// A factory: calling it RETURNS the validator
export function minAge(min: number): ValidatorFn {
  return (control) => {
    const value = control.value;
    return value != null && value < min
      ? { minAge: { required: min, actual: value } }
      : null;
  };
}

readonly form = this.fb.group({
  username: ['', [Validators.required, noSpaces]],   // no parentheses
  age: [0, [minAge(18)]],                            // parentheses: a call
});
```

In the template, `form.controls.age.errors?.['minAge']?.required` gives the number to show in the message.

## Go deeper

Keep each validator to **one concern**, and let `Validators.required` own the empty case. Return `null` for an empty value so you do not report two errors for one problem.

Validators must tolerate `null` and `undefined`, a legitimate initial value for many controls. Calling `.trim()` on `control.value` directly throws; use `control.value ?? ''`.

Exported top-level functions are trivially unit-testable with no component:

```typescript
expect(noSpaces(new FormControl('a b'))).toEqual({ noSpaces: true });
expect(minAge(18)(new FormControl(21))).toBeNull();
```

Give error keys clear, unique names (`usernameTaken`, `passwordMismatch`) so templates can target one failure precisely.

## Watch out

- Writing `minAge` instead of `minAge(18)`. You pass the factory itself, which has the wrong signature.
- Not guarding against `null` in `control.value`.
- Bundling several rules into one validator, so one error key hides which rule failed.

## Remember

- A validator returns `null` or an errors object.
- A factory is a function that returns a validator; call it when you attach it.
- Keep validators pure, single-purpose and exported, so they are easy to test.

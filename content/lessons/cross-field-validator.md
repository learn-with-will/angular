---
slug: cross-field-validator
title: "Cross-field validation"
topic: forms
kind: technique
summary: "Rules that compare two fields, like password confirmation, belong on the group that contains both."
tags: [forms, validation, formgroup, cross-field]
related: [custom-validator, nested-groups, form-array, reactive-validation-errors]
---
> **In one line:** A single control cannot see its siblings. Attach a validator that compares fields to the **smallest group that contains all of them**.

## The idea

"Confirm password must match password" involves two fields. A validator on `confirmPassword` would have no way to read `password`, because a control only knows its own value and its parent. The parent, however, can read both children.

So the rule goes on the parent `FormGroup`, and the error appears on the group, not on a field.

```tree
FormGroup `passwordGroup` | validator: `passwordsMatch` @primary
  FormControl `password` | `required`, `minLength(8)` @blue
  FormControl `confirmPassword` | `required` @blue
```

| Where the rule lives | Can it compare siblings? | Where `errors` appears |
|---|---|---|
| a `FormControl` | no | on that control |
| the parent `FormGroup` | yes | on the group |
| a `FormArray` | yes, across all items | on the array |

## See it

```typescript
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

readonly form = this.fb.group({
  passwordGroup: this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  ),
});
```

```html
<fieldset formGroupName="passwordGroup">
  <input type="password" formControlName="password" />
  <input type="password" formControlName="confirmPassword" />
  @if (form.controls.passwordGroup.hasError('passwordMismatch') &&
       form.controls.passwordGroup.controls.confirmPassword.touched) {
    <p class="error">Passwords do not match.</p>
  }
</fieldset>
```

## Go deeper

The group validator runs whenever *either* child changes, so the message updates as the user edits the first password, not just the confirmation.

The same idea works on a `FormArray`, where one validator sees every item at once: "no duplicate emails", or "between 1 and 5 entries".

```typescript
export function uniqueValues(): ValidatorFn {
  return (control) => {
    const values: string[] = (control.value ?? []).map((v: string) => v.trim().toLowerCase()).filter(Boolean);
    const duplicates = values.filter((v, i) => values.indexOf(v) !== i);
    return duplicates.length ? { duplicates: { values: [...new Set(duplicates)] } } : null;
  };
}
```

Put the rule on the *smallest* group containing the fields it needs. Attaching everything to the root group works, but then every rule's error lives in one place, and a failing cross-field rule makes the whole form invalid for a reason far from the fields involved.

## Watch out

- Attaching a comparison to a single `FormControl`. It cannot read siblings.
- Looking for the error on the field, not the group.
- Putting every cross-field rule on the root form.

## Remember

- Compare fields from the parent group's validator.
- The error is on the group; read it with `group.hasError(...)`.
- Use the smallest group that holds the fields involved.

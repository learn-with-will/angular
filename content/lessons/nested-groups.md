---
slug: nested-groups
title: "Nested groups"
topic: forms
kind: technique
summary: "Mirror the sections of your UI with nested FormGroups and formGroupName."
tags: [forms, formgroup, nesting, structure]
related: [reactive-form-model, form-builder, cross-field-validator, template-driven-form]
---
> **In one line:** A `FormGroup` can contain other groups. Bind each one with `formGroupName`, and the value comes out nested in the same shape.

## The idea

Real forms have sections: an address, billing details, preferences. A flat form with fields called `addressStreet` and `addressCity` works but reads badly, and you cannot validate or disable a section as a unit.

A nested group gives each section its own control. It has its own `valid`, `touched` and `dirty` state, it can carry its own validators, and it produces a clean object for your API.

| Flat | Nested |
|---|---|
| `{ name, street, city }` | `{ name, address: { street, city } }` |
| validate each field separately | `address.invalid` covers the section |
| disable fields one by one | `address.disable()` disables them all |

The template mirrors the model. `formGroupName="address"` moves the binding scope into that group, so the inputs inside it use their short names.

## See it

```typescript
readonly form = this.fb.group({
  fullName: ['', Validators.required],
  address: this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
  }),
});
```

```html
<form [formGroup]="form">
  <input formControlName="fullName" placeholder="Full name" />

  <fieldset formGroupName="address">
    <legend>Address</legend>
    <input formControlName="street" placeholder="Street" />
    <input formControlName="city" placeholder="City" />
    <input formControlName="postalCode" placeholder="Postal code" />
  </fieldset>
</form>
```

Reading a nested control in the class uses the typed `controls` path: `this.form.controls.address.controls.city`.

## Go deeper

Using a real `<fieldset>` with a `<legend>` is more than tidy markup. Screen readers announce the group name before each field, so the structure helps accessibility too.

Group-level state rolls up. `form.controls.address.invalid` is true when any address field is invalid, which lets you show one "please complete your address" message or highlight the section, instead of annotating each field.

You can reuse a section by building it in a function, `buildAddressGroup(fb)`, and calling it twice for billing and shipping. Each call returns a fresh, independent group.

Template-driven forms do the same job with `ngModelGroup`, so the idea transfers directly.

## Watch out

- Using the wrong name in `formGroupName`; it must match the key in the model.
- Reusing *one* group instance in two places. Controls are not shareable, so build a new group per use.
- Forgetting `formGroupName` and binding inner controls at the top level, which throws *Cannot find control*.

## Remember

- Nest groups to mirror UI sections and the shape of the data.
- `formGroupName` scopes the template binding.
- Group state rolls up from its children.

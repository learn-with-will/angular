---
slug: reactive-form-model
title: "The reactive form model"
topic: forms
kind: concept
summary: "FormControl, FormGroup and FormArray form a tree you build in TypeScript and bind to the template."
tags: [forms, reactive, formcontrol, formgroup]
related: [forms-two-approaches, form-builder, nested-groups, form-array]
---
> **In one line:** A reactive form is a tree of control objects in your class. The model is the source of truth, and the template only binds to it.

## The idea

Template-driven forms hide the model. Reactive forms put it in plain sight, which makes it easy to inspect, test and change without touching the DOM. It is built from three types, all extending `AbstractControl`:

```tree
FormGroup `profileForm` | the whole form @primary
  FormControl `username` | one input @blue
  FormGroup `address` | a named section @primary
    FormControl `street` | one input @blue
    FormControl `city` | one input @blue
  FormArray `skills` | an unnamed list, size unknown @amber
    FormControl | item 0 @blue
    FormControl | item 1 @blue
```

| Type | Use it for |
|---|---|
| `FormControl` | one value: a text box, checkbox or select |
| `FormGroup` | a *named* set of controls, such as a whole form or an address |
| `FormArray` | an *ordered* list whose length is not known in advance |

You then connect the tree to the template with directives from `ReactiveFormsModule`: `[formGroup]`, `formControlName`, `formGroupName` and `formArrayName`.

## See it

```typescript
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" type="email" />
      <input formControlName="password" type="password" />
      <button type="submit" [disabled]="form.invalid">Log in</button>
    </form>
  `,
})
export class Login {
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  onSubmit(): void {
    console.log(this.form.getRawValue()); // { email: string; password: string }
  }
}
```

## Go deeper

Controls are **typed**. The control types are inferred from the initial values, so `form.value.emial` is a compile error rather than a silent `undefined`. `nonNullable: true` keeps the type as `string` instead of `string | null`, because without it `reset()` sets the value to `null`.

Validation here is just functions. A validator takes a control and returns `null` (valid) or an object describing what is wrong. That is why custom validators are so approachable, and the next lessons build on it.

`[formGroup]="form"` binds the whole `<form>`; `formControlName="email"` binds one input to the control with that key inside the group.

## Watch out

- Forgetting `ReactiveFormsModule`. `[formGroup]` then fails with *Can't bind to 'formGroup'*.
- Building the form inside a method that runs repeatedly, so user input is lost.
- Leaving `nonNullable` off and getting `null` after `reset()`.

## Remember

- Build the tree once in the class; bind with `[formGroup]` and `formControlName`.
- Group = named, Array = ordered, Control = one value.
- Use `nonNullable` so types stay clean after `reset()`.

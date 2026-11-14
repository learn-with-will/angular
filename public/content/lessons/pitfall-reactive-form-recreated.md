---
slug: pitfall-reactive-form-recreated
title: "Pitfall: rebuilding the form model"
topic: forms
kind: pitfall
summary: "A form built inside a getter or method is recreated on every change detection and eats the user's input."
tags: [forms, reactive, change-detection, bugs]
related: [reactive-form-model, forms-two-approaches, form-value-changes, form-builder]
---
> **In one line:** Build the `FormGroup` once, as a field. If it is created inside a method or getter that Angular calls repeatedly, every call produces a fresh, empty form.

## The idea

The template calls `form` on every change detection pass. If `form` is a *getter* or *method* that builds a new group each time, the template keeps binding to brand-new controls. Whatever the user typed was in the previous object, which is now garbage, so the input snaps back to empty or loses focus after each keystroke.

It looks like a bug in Angular, but it is a bug in where the model is created.

| Where the form is built | Result |
|---|---|
| A class field: `form = this.fb.group(...)` | built once, state persists |
| The constructor | built once, state persists |
| A method or getter | rebuilt on every call, input is lost |

The same family of mistake is **mixing styles**. Putting `[(ngModel)]` inside a `[formGroup]` makes two systems fight for ownership of one input, and Angular throws at runtime.

## See it

```typescript
// Before: a new FormGroup on every change detection pass
get form(): FormGroup {
  return this.fb.group({ email: ['', Validators.required] });
}

// After: created once; the same object every time
readonly form = this.fb.group({ email: ['', Validators.required] });
```

```html
<!-- Before: two systems own one input; throws at runtime -->
<form [formGroup]="form">
  <input formControlName="email" [(ngModel)]="email" />
</form>

<!-- After: reactive only -->
<form [formGroup]="form">
  <input formControlName="email" />
</form>
```

## Go deeper

You can confirm the diagnosis in seconds by putting a `console.log('built')` in the builder. If it prints on every keystroke, the form is being recreated.

A related trap is rebuilding the form when an input changes: `ngOnChanges` creating a new group each time a parent passes a new `user`. Update the existing form instead, with `form.reset(user)` or `patchValue`, so state such as `touched` and focus survives.

Prefer a *computed* or *effect* only for deriving things **from** the form. The form object itself should have a stable identity for the lifetime of the component.

A third variation hides in templates: calling a method that returns a new array or object on every pass, such as `[options]="buildOptions()"`. It is the same root cause: identity changes on each change detection, so Angular sees "new" input every time. Compute once into a field or a `computed()` signal and bind that.

The reliable test is identity: store the object the first time you see it and compare it on a later change detection pass. If the reference differs, something is rebuilding it. Anywhere a stable reference is not guaranteed, this bug is waiting.

## Watch out

- Writing the form as a getter or method.
- Combining `ngModel` with `formControlName` on one element.
- Replacing the whole form when new data arrives, instead of patching it.

## Remember

- Create the form once: a field or the constructor.
- One style per input: reactive or template-driven, never both.
- Update an existing form with `reset(value)` or `patchValue`.

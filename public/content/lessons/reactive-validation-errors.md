---
slug: reactive-validation-errors
title: "Showing errors and submitting"
topic: forms
kind: technique
summary: "Display the right message at the right time, and make Submit reveal every problem at once."
tags: [forms, validation, errors, markallastouched]
related: [control-state, form-builder, template-validation, reactive-form-model]
---
> **In one line:** Show a message only when a control is invalid and touched, and call `markAllAsTouched()` on submit so an untouched form still explains itself.

## The idea

Error messages follow two rules. They appear **after** the user has interacted, and they say **which** rule failed, not just "invalid". `hasError('key')` answers the second question.

The first rule has a trap. If messages are gated on `touched`, a user who clicks Submit without visiting any field sees nothing, even though the form is invalid. The submit handler therefore has to mark everything as touched itself.

```flow
submit: Submit clicked | `ngSubmit` fires @primary
check: `form.invalid`? | validity is checked again @amber
reveal: `markAllAsTouched()` | every message appears @red
send: Send the data | `getRawValue()` @green
submit -> check: handler
check -> reveal: invalid
check -> send: valid
```

## See it

```html
<form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <input id="email" type="email" formControlName="email" />
  @if (loginForm.controls.email.invalid && loginForm.controls.email.touched) {
    <p class="error">
      @if (loginForm.controls.email.hasError('required')) {
        Email is required.
      } @else if (loginForm.controls.email.hasError('email')) {
        Please enter a valid email address.
      }
    </p>
  }

  <button type="submit">Log in</button>
</form>
```

```typescript
onSubmit(): void {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched(); // reveal every message, even untouched fields
    return;
  }
  this.auth.login(this.loginForm.getRawValue());
}
```

`loginForm.controls.email` is typed, so a typo in the control name fails at compile time instead of rendering nothing.

## Go deeper

Leave the submit button *enabled* when you can. A disabled button gives no explanation, while a click that reveals the problems does. If you do disable it, keep the `invalid` check in the handler anyway: it is a hint, not a guarantee, and other code can call the handler.

When many fields share the same messages, extract a small component that takes a control and renders its errors. The `errors` object carries details (such as `{ minlength: { requiredLength: 8, actualLength: 3 } }`), so one component can produce precise text for every field.

Include `pending` in the condition when the form has async validators, and disable submission while `form.pending` is true.

## Watch out

- Gating messages on `touched` but never calling `markAllAsTouched()`, so Submit looks dead.
- Showing a generic "invalid" instead of the failing rule.
- Disabling the button with no hint of what is wrong.

## Remember

- Show messages when `invalid && touched`, by rule with `hasError`.
- Call `markAllAsTouched()` before returning early from submit.
- Always re-check validity in the handler.

---
slug: update-on
title: "updateOn: when validators run"
topic: forms
kind: api
summary: "Run validation on change, on blur or on submit, to cut noise and expensive checks."
tags: [forms, updateon, validation, performance]
related: [async-validator, template-validation, control-state, reactive-validation-errors]
---
> **In one line:** By default a control updates and validates on every keystroke. `updateOn: 'blur'` or `'submit'` moves that to a calmer moment.

## The idea

Validating on every keystroke is responsive, but it has costs. An email field reports "invalid" after the first character. An async check fires a request for every letter. A form with heavy rules recalculates constantly.

`updateOn` chooses *when* the control's value is committed and its validators run:

| Value | Updates and validates | Good for |
|---|---|---|
| `'change'` (default) | on every input event | quick local checks, live previews |
| `'blur'` | when the field loses focus | email, username, anything with a server check |
| `'submit'` | when the form is submitted | short forms where errors should wait for the end |

Because the *value* itself is held back, not only the messages, `form.value` stays at its old content until the chosen event. That is intended, but it surprises people who read the value mid-typing.

## See it

```typescript
// Reactive: per control, or for a whole group
readonly email = new FormControl('', {
  nonNullable: true,
  validators: [Validators.required, Validators.email],
  updateOn: 'blur',
});

readonly signup = this.fb.group(
  { email: [''], password: [''] },
  { updateOn: 'submit' },
);
```

```html
<!-- Template-driven -->
<input name="postalCode" [(ngModel)]="postalCode"
       pattern="[0-9]{5}" [ngModelOptions]="{ updateOn: 'blur' }" />
```

## Go deeper

`updateOn` pairs naturally with async validators: with `'blur'` the server is asked once, when the user has finished, so you often do not need the `timer` debounce at all.

It is *not* the same as gating messages on `touched`. `touched` only hides the text; the validators still ran on every keystroke. `updateOn: 'blur'` actually delays the validation.

A group's `updateOn` is inherited by its children unless a child sets its own, so one setting on the root can cover the whole form, and a single field can still opt out.

When a control uses `'submit'`, the new value reaches the model only on submit, so a live preview bound to it will not update while the user types. Pick it deliberately.

## Watch out

- Reading `control.value` mid-typing with `'blur'` and getting the old text.
- Assuming `touched` and `updateOn: 'blur'` do the same thing.
- Using `'submit'` on a field that drives a live preview.

## Remember

- `change` is the default; `blur` and `submit` delay both value and validation.
- Great with expensive or async checks.
- Set it on a control, a group or via `ngModelOptions`.

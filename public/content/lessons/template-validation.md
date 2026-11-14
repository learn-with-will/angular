---
slug: template-validation
title: "Validation in templates"
topic: forms
kind: technique
summary: "Built-in validator attributes, template-reference errors and when to show a message."
tags: [forms, validation, errors, ux]
related: [template-driven-form, control-state, validator-directive, reactive-validation-errors]
---
> **In one line:** Add `required`, `email`, `minlength` or `pattern` to an `ngModel` input and Angular applies the matching validator. Show the message only after the user has touched the field.

## The idea

In a template-driven form, validators are *attributes*. Angular reads them and attaches the built-in validators automatically, with no extra code. Most look like HTML5 attributes, though `email` exists only in Angular.

To display a message you need the control itself. Export it with `#emailCtrl="ngModel"`, then read `invalid`, `touched` and `errors`:

| Attribute | Error key in `errors` |
|---|---|
| `required` | `required` |
| `email` | `email` |
| `minlength="8"` | `minlength` |
| `pattern="[0-9]{5}"` | `pattern` |

The detail that separates a friendly form from a hostile one is **when** you show the message. A field that is invalid on page load would shout at the user before they typed a character, so gate messages behind `touched` (or `dirty`).

## See it

```typescript
@Component({
  selector: 'app-register',
  imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <input name="email" type="email" [(ngModel)]="email" required email #emailCtrl="ngModel" />
      @if (emailCtrl.invalid && emailCtrl.touched) {
        <p class="error">
          @if (emailCtrl.errors?.['required']) { Email is required. }
          @if (emailCtrl.errors?.['email']) { Please enter a valid email. }
        </p>
      }

      <button type="submit" [disabled]="f.invalid">Create account</button>
    </form>
  `,
})
export class Register {
  email = '';
  submit(f: NgForm): void { if (f.valid) console.log(f.value); }
}
```

## Go deeper

`errors?.['required']` uses optional chaining and bracket notation. Under TypeScript strict mode, `errors.required` does not compile, because `errors` can be `null` and its keys are dynamic.

Showing errors when the field is `dirty` **or** `touched` catches both cases: the user edited and then cleared it, or tabbed past without typing.

Validation runs on every keystroke by default. For noisy or expensive checks, `[ngModelOptions]="{ updateOn: 'blur' }"` runs them when the user leaves the field instead.

Group-level validity is what the Submit button needs. `f.invalid` on the `NgForm` is true when any control inside it is invalid, so one check covers the whole form. Individual messages only need the individual control.

For a message that lists several problems, read the whole `errors` object rather than testing keys one by one. It also carries details, such as `{ minlength: { requiredLength: 8, actualLength: 3 } }`, which let you write "8 characters needed, you have 3". Keep the wording in one place, a small component that takes a control and renders its errors, and every field in the app gets consistent messages.

## Watch out

- Showing errors immediately, before the user has interacted.
- Writing `control.errors.required` in strict mode. Use `errors?.['required']`.
- Relying on the disabled button as the only validation.

## Remember

- Validators are attributes; export the control with `#x="ngModel"` to read its state.
- Gate messages behind `touched` or `dirty`.
- `updateOn: 'blur'` quiets expensive checks.

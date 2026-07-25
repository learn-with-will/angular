---
id: lesson-18
slug: reactive-forms-and-validation
title: "Reactive Forms & Validation"
level: intermediate
order: 16
duration: 50
tags:
  - reactive-forms
  - forms
  - validation
  - formbuilder
  - typed-forms
---

> **Note on syntax:** Since Angular v19, components are standalone by default — you no longer need to write `standalone: true` in the `@Component` decorator. All examples below use this modern syntax. If you're on Angular 14–18, just add `standalone: true` to each `@Component`.

## Learning Objectives

By the end of this lesson, you will be able to:

- Build forms programmatically using `FormControl`, `FormGroup`, and `FormArray`
- Use `FormBuilder` to construct forms with less boilerplate
- Apply built-in validators and write your own synchronous and asynchronous custom validators
- Implement cross-field validation (e.g., "confirm password" checks)
- Use **typed reactive forms** for compile-time safety
- Display validation errors correctly and manage dynamic, list-based form controls

## Why This Concept Exists

Angular gives you two ways to build forms: **template-driven forms** (using `ngModel` in the HTML) and **reactive forms** (using a form model defined in TypeScript). Both are valid, but they solve different problems.

Template-driven forms are convenient for very simple forms, but as a form grows — more fields, more interdependent rules, dynamic fields, unit tests — the "form is the source of truth" model of template-driven forms starts to fight you. Validation logic ends up scattered across the template, and it's hard to test something that only exists as directives in HTML.

**Reactive forms solve this by making the form model an explicit, immutable object in your component class**, built out of `FormControl`, `FormGroup`, and `FormArray` instances. This gives you:

- **A single source of truth** you can inspect, unit test, and manipulate without touching the DOM.
- **Synchronous access** to the current value and validation state at any time.
- **Composable validation**, including validators that depend on multiple fields at once.
- **Predictability** — every change produces a new, well-defined state, which plays nicely with RxJS observables (`valueChanges`, `statusChanges`).

This is why reactive forms are the recommended approach for anything beyond a trivial contact form: registration flows, checkout forms, dynamic surveys, admin panels — anywhere correctness and testability matter.

## Concept Explanation

A reactive form is a tree of **control objects**, all of which extend `AbstractControl`:

- **`FormControl`** — tracks the value and validation status of a single input (a text field, a checkbox, a select).
- **`FormGroup`** — a named collection of controls (and/or nested groups), used to group fields that belong together, like a whole form or an "address" sub-section.
- **`FormArray`** — an *unnamed*, ordered list of controls, used when you don't know how many controls you'll need ahead of time (e.g., a list of phone numbers a user can add or remove).

You build this tree in your component class, then bind it to the template using directives from `ReactiveFormsModule`: `[formGroup]`, `formControlName`, `formGroupName`, and `formArrayName`. Angular keeps the template and the model in sync — but unlike template-driven forms, **the model is the source of truth**, not the DOM.

Every control carries state you can read at any time:

| State | Meaning |
|---|---|
| `value` | The control's current value |
| `valid` / `invalid` | Whether the control passes all its validators |
| `pristine` / `dirty` | Whether the user has changed the value yet |
| `touched` / `untouched` | Whether the user has focused and then blurred the control |
| `pending` | An async validator is still running |
| `errors` | A `ValidationErrors` object (or `null` if valid) |

Validation in reactive forms is just **functions**. A validator is a function that takes a control and returns either `null` (valid) or an object describing what's wrong. Angular ships common ones (`Validators.required`, `Validators.email`, etc.), and you can write your own that follow the exact same shape — which is what makes custom and cross-field validation so approachable once you understand the pattern.

## Key Terminology

- **`FormControl`** — the atomic building block; wraps a single value plus its validity state.
- **`FormGroup`** — combines multiple named controls into one object; the group is valid only if every child control is valid.
- **`FormArray`** — like a `FormGroup`, but controls are indexed by position instead of by name; ideal for dynamic, repeatable fields.
- **`FormBuilder`** — an injectable service (`inject(FormBuilder)`) that provides shorthand methods (`fb.group()`, `fb.array()`, `fb.control()`) so you don't have to call `new FormControl(...)` repeatedly.
- **`Validators`** — a class of static, built-in synchronous validator functions (`required`, `minLength`, `maxLength`, `pattern`, `email`, etc.).
- **`ValidatorFn`** — the type of a synchronous custom validator: `(control: AbstractControl) => ValidationErrors | null`.
- **`AsyncValidatorFn`** — the type of an asynchronous custom validator: `(control: AbstractControl) => Observable<ValidationErrors | null> | Promise<ValidationErrors | null>`. Used for things that need a server round trip, like checking if a username is taken.
- **`ValidationErrors`** — a plain object of error keys, e.g. `{ required: true }` or `{ minlength: { requiredLength: 8, actualLength: 3 } }`.
- **`AbstractControl`** — the base class shared by `FormControl`, `FormGroup`, and `FormArray`; validators are written against this type so they can, in principle, be reused across all three.
- **Typed reactive forms** — since Angular 14, `FormControl`, `FormGroup`, and `FormArray` are generic and strictly typed by default, so `form.value.email` is a compile error if `email` doesn't exist on the form model.

## Syntax Overview

**1. Enable reactive forms** by importing `ReactiveFormsModule` into your standalone component's `imports` array:

```typescript
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-example',
  imports: [ReactiveFormsModule],
  templateUrl: './example.component.html',
})
export class ExampleComponent {}
```

**2. Build the form model**, either manually or with `FormBuilder`:

```typescript
import { inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

export class ExampleComponent {
  private fb = inject(FormBuilder);

  // fb.nonNullable.group ensures controls never become `null`,
  // even after form.reset() — recommended for typed forms.
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
}
```

**3. Bind the model to the template:**

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input formControlName="email" type="email" />
  <input formControlName="password" type="password" />
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

- `[formGroup]="form"` connects the whole `<form>` to the top-level `FormGroup`.
- `formControlName="email"` connects an individual input to the control of the same name inside that group.
- Nested groups use `formGroupName="address"`; dynamic lists use `formArrayName="phones"`.

## Real World Analogy

Think of a `FormGroup` as a **job application folder**, and each `FormControl` as one *document* inside it (ID proof, resume, reference letter). Each document has its own checklist (is it signed? is it legible? — that's your validators). The folder as a whole is only "complete" (`valid`) when every document inside passes its own checklist. If the application has a whole *section* — say, "Previous Employment" — that section is itself a smaller folder (a nested `FormGroup`) inside the main one. And if the applicant can list an unknown number of references, that's a `FormArray`: an expandable stack of reference-letter documents, where you don't know in advance how many there will be.

## Examples

### Example 1 — Basic: A Login Form

This example builds the smallest useful reactive form: two fields, built-in validators, and error messages shown only after the user interacts with the field.

```typescript
// login.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);

  // fb.nonNullable.group() types every control as non-nullable,
  // so `loginForm.value.email` is typed as `string`, not `string | null`.
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Force validation messages to appear even if the user
      // never focused a field before clicking Submit.
      this.loginForm.markAllAsTouched();
      return;
    }

    // loginForm.getRawValue() is fully typed: { email: string; password: string }
    console.log('Logging in with', this.loginForm.getRawValue());
  }
}
```

```html
<!-- login.component.html -->
<form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <label for="email">Email</label>
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

  <label for="password">Password</label>
  <input id="password" type="password" formControlName="password" />
  @if (loginForm.controls.password.invalid && loginForm.controls.password.touched) {
    <p class="error">Password must be at least 6 characters.</p>
  }

  <button type="submit">Log In</button>
</form>
```

**What's happening:** `Validators.required` and `Validators.email` are combined in an array — a control is valid only if *all* its validators pass. Errors are only shown when the control is both `invalid` and `touched`, so the user isn't bombarded with red text before they've typed anything. The `@if`/`@else if` blocks use Angular's modern control-flow syntax.

### Example 2 — Real World: Registration Form with Cross-Field Validation

Real forms often need to validate one field *against* another — the classic case being "confirm password." That kind of check can't live on a single `FormControl`; it has to be attached to the `FormGroup` that contains both fields.

```typescript
// registration.component.ts
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

// A cross-field validator: attached to the FormGroup, not a single control.
// It reads two sibling controls and compares them.
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './registration.component.html',
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);

  registrationForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    // A nested FormGroup groups related fields together.
    address: this.fb.nonNullable.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    }),
    passwordGroup: this.fb.nonNullable.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }, // group-level validator
    ),
  });

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }
    console.log(this.registrationForm.getRawValue());
  }
}
```

```html
<!-- registration.component.html -->
<form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
  <input formControlName="fullName" placeholder="Full name" />

  <!-- formGroupName binds to a nested FormGroup -->
  <fieldset formGroupName="address">
    <legend>Address</legend>
    <input formControlName="street" placeholder="Street" />
    <input formControlName="city" placeholder="City" />
    <input formControlName="postalCode" placeholder="Postal code" />
  </fieldset>

  <fieldset formGroupName="passwordGroup">
    <legend>Password</legend>
    <input type="password" formControlName="password" placeholder="Password" />
    <input type="password" formControlName="confirmPassword" placeholder="Confirm password" />

    @if (registrationForm.controls.passwordGroup.hasError('passwordMismatch') &&
         registrationForm.controls.passwordGroup.controls.confirmPassword.touched) {
      <p class="error">Passwords do not match.</p>
    }
  </fieldset>

  <button type="submit">Register</button>
</form>
```

**What's happening:** `passwordsMatchValidator` has the exact same shape as a built-in validator — it takes a control (here, the group) and returns `ValidationErrors | null`. It's passed via the second argument of `fb.group()` as `{ validators: passwordsMatchValidator }`, so it runs whenever *either* password field changes. Nesting `address` and `passwordGroup` as sub-groups keeps the template organized and mirrors the logical sections of the form.

### Example 3 — Best Practice: Typed Form with `FormArray` and an Async Validator

This example puts several best practices together: **strictly typed controls**, a **dynamic `FormArray`** for a repeatable field, an **async validator** for a server-side check, and **`takeUntilDestroyed`** to safely subscribe to `valueChanges` without a memory leak.

```typescript
// profile-editor.component.ts
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, delay, map, switchMap } from 'rxjs/operators';

// Simulates a backend call to check if a username is already taken.
// updateOn: 'blur' (used below) means this only runs when the field loses focus.
function usernameTakenValidator(takenUsernames: string[]): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return of(control.value).pipe(
      delay(400), // simulated network latency
      map((username: string) =>
        takenUsernames.includes(username.toLowerCase()) ? { usernameTaken: true } : null,
      ),
    );
  };
}

@Component({
  selector: 'app-profile-editor',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-editor.component.html',
})
export class ProfileEditorComponent {
  private fb = inject(FormBuilder);
  private takenUsernames = ['admin', 'root', 'angular'];

  profileForm = this.fb.nonNullable.group({
    username: this.fb.nonNullable.control(
      '',
      {
        validators: [Validators.required, Validators.minLength(3)],
        asyncValidators: [usernameTakenValidator(this.takenUsernames)],
        updateOn: 'blur', // avoid firing the async validator on every keystroke
      },
    ),
    // FormArray of FormControl<string> — a dynamic list of skills.
    skills: this.fb.nonNullable.array<string>([], Validators.minLength(1)),
  });

  get skills() {
    return this.profileForm.controls.skills;
  }

  constructor() {
    // React to value changes without manually unsubscribing —
    // takeUntilDestroyed cleans up automatically when the component is destroyed.
    this.profileForm.controls.username.valueChanges
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe((value) => console.log('Username typed so far:', value));
  }

  addSkill(skillName: string): void {
    if (!skillName.trim()) return;
    this.skills.push(this.fb.nonNullable.control(skillName, Validators.required));
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    console.log(this.profileForm.getRawValue());
  }
}
```

```html
<!-- profile-editor.component.html -->
<form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
  <label for="username">Username</label>
  <input id="username" formControlName="username" />

  @if (profileForm.controls.username.pending) {
    <p>Checking availability…</p>
  } @else if (profileForm.controls.username.hasError('usernameTaken')) {
    <p class="error">That username is already taken.</p>
  }

  <!-- formArrayName binds to the dynamic list -->
  <div formArrayName="skills">
    <h3>Skills</h3>
    @for (skill of skills.controls; track $index) {
      <div>
        <input [formControlName]="$index" />
        <button type="button" (click)="removeSkill($index)">Remove</button>
      </div>
    }
  </div>

  <button type="submit" [disabled]="profileForm.invalid || profileForm.pending">
    Save Profile
  </button>
</form>
```

**What's happening:**

- `fb.nonNullable.control(...)` with an options object lets us pass `validators`, `asyncValidators`, and `updateOn` together. `updateOn: 'blur'` means the async check (and its "pending" state) only kicks in once the user leaves the field — this avoids firing a network request on every keystroke.
- The async validator returns an `Observable<ValidationErrors | null>`, exactly like a sync validator but wrapped in an observable. While it's running, `control.pending` is `true`, which we use to show a "Checking availability…" message.
- `skills` is a `FormArray<FormControl<string>>` — fully typed, so `skill.value` is known to be a `string`, not `any`.
- `takeUntilDestroyed()` (from `@angular/core/rxjs-interop`) automatically completes the subscription when the component is destroyed, so you don't need a manual `ngOnDestroy` / `Subject` teardown.

## Common Mistakes

1. **Forgetting to import `ReactiveFormsModule`.** Without it, directives like `formControlName` and `[formGroup]` won't be recognized, and Angular will throw a template error. Add it to the standalone component's `imports` array.
2. **Mixing `ngModel` with reactive forms.** Using `[(ngModel)]` inside a `[formGroup]` template triggers a runtime error — pick one form strategy per form and stick to it.
3. **Showing every error immediately.** Checking only `control.invalid` (without also checking `control.touched` or `control.dirty`) shows red error text before the user has even typed anything, which feels broken. Gate error messages on `touched` (or `dirty`).
4. **Reading `form.value` when some controls are disabled.** `form.value` silently omits disabled controls. If you need *all* values regardless of disabled state, use `form.getRawValue()` instead.
5. **Not calling `markAllAsTouched()` on submit.** If a user clicks "Submit" without touching any field, your `touched`-gated error messages won't appear even though the form is invalid. Call `form.markAllAsTouched()` in your submit handler before returning early.
6. **Subscribing to `valueChanges` or `statusChanges` without cleanup.** These are long-lived observables tied to the control, not the component. Use `takeUntilDestroyed()` (or the `async` pipe where applicable) to avoid leaking subscriptions.
7. **Writing a validator that runs on every keystroke when it shouldn't.** Expensive checks (especially async ones hitting a server) should use `updateOn: 'blur'` or `updateOn: 'submit'`, plus `debounceTime` if you do listen to `valueChanges` directly.
8. **Recreating the form model on every render.** Build the `FormGroup` once (as a class field or in the constructor), not inside a method that runs on every change detection cycle — that would reset the user's input.

## Best Practices

- **Prefer `FormBuilder` (and `fb.nonNullable`) over manually `new`-ing controls** — it's shorter and, with `nonNullable`, keeps your types clean (no unwanted `null` in the value type after `reset()`).
- **Use typed reactive forms.** Let TypeScript infer control types from `fb.group({...})`, or declare an explicit interface for complex forms. This catches typos like `form.value.emial` at compile time.
- **Inject dependencies with `inject()`** inside standalone components rather than constructor parameter injection — it's more flexible or you can still use constructor injection; both are valid, but `inject()` is the modern idiom for services like `FormBuilder`.
- **Group related fields into nested `FormGroup`s** that mirror your UI sections (e.g., `address`, `billingInfo`) — it keeps both the model and the template organized.
- **Put cross-field logic on the group, not a field.** A validator that needs two sibling values belongs on the `FormGroup` that contains both, not bolted onto one of the individual controls.
- **Debounce or defer expensive validators.** Use `updateOn: 'blur'`/`'submit'` for async validators, and `debounceTime` on any `valueChanges` subscription that triggers real work.
- **Disable the submit button using `form.invalid`, but also handle blocked submits.** Some users submit via Enter key even when a button is disabled, so still guard your `onSubmit()` method with an `if (form.invalid) { form.markAllAsTouched(); return; }` check.
- **Use `getRawValue()` when you need the value of disabled controls too**; use `value` when you intentionally want disabled fields excluded (e.g., a read-only field mirrored elsewhere).
- **Reset forms deliberately.** After a successful submission, call `form.reset()` (or `form.reset(initialValue)`) to return the form to a clean, pristine state rather than leaving stale "touched"/"dirty" flags around.

## Summary

- Reactive forms model the form as an explicit object tree (`FormGroup` / `FormControl` / `FormArray`) in the component class, making the model the single source of truth.
- Use `ReactiveFormsModule` in your standalone component's `imports`, and bind the model to the template with `[formGroup]`, `formControlName`, `formGroupName`, and `formArrayName`.
- `FormBuilder` (especially `fb.nonNullable`) reduces boilerplate and keeps typed forms clean.
- Validators are plain functions: `(control) => ValidationErrors | null` for sync, and the same shape wrapped in an `Observable`/`Promise` for async.
- Cross-field validation (like "confirm password") is attached to the `FormGroup` that contains the related controls, not to a single control.
- Typed reactive forms (Angular 14+) give you compile-time safety on `form.value`, `form.controls`, and related APIs.
- Gate error messages on `touched`/`dirty` so users aren't shown errors before they've interacted with a field, and call `markAllAsTouched()` on a blocked submit.
- `FormArray` handles dynamic, repeatable fields where the number of controls isn't known ahead of time.
- Always clean up `valueChanges`/`statusChanges` subscriptions, ideally with `takeUntilDestroyed()`.

## Flash Cards

**Q: What's the core difference between reactive forms and template-driven forms?**
A: In reactive forms, the form model (a tree of `FormControl`/`FormGroup`/`FormArray`) is defined explicitly in the component class and is the source of truth. In template-driven forms, the model is implicit and derived from `ngModel` directives in the template.

**Q: What does a synchronous custom validator function need to return?**
A: Either `null` if the control is valid, or a `ValidationErrors` object (e.g., `{ someErrorKey: true }`) describing what failed.

**Q: Where should you attach a validator that compares two sibling fields, like password and confirm-password?**
A: On the `FormGroup` that contains both fields, not on either individual `FormControl`.

**Q: What's the difference between `form.value` and `form.getRawValue()`?**
A: `form.value` excludes disabled controls; `form.getRawValue()` includes the values of every control, disabled or not.

**Q: Why use `fb.nonNullable.group(...)` instead of a plain `fb.group(...)`?**
A: It types each control's value as non-nullable, so calling `form.reset()` returns controls to their initial value instead of `null`, keeping the form's TypeScript types accurate and avoiding `| null` checks throughout your code.

## Exercises

**Easy:** Build a standalone `ContactFormComponent` with a reactive form containing `name` (required) and `email` (required + valid email format). Disable the submit button while the form is invalid, and show an error message under each field once it has been touched and is invalid.

**Medium:** Extend the contact form to include a nested `FormGroup` called `preferences` with two fields: `contactMethod` (a `select` with options `"email"` and `"phone"`) and `phoneNumber`. Write a group-level custom validator that makes `phoneNumber` required *only* when `contactMethod` is `"phone"` (and has no effect otherwise).

**Challenging:** Build a `SurveyComponent` with a `FormArray` named `questions`, where each item is a `FormGroup` containing `questionText` (required) and `answer` (required, minLength 3). Add buttons to dynamically add and remove questions (minimum of 1, maximum of 5 — enforce this with a group/array-level validator that invalidates the array if it has 0 or more than 5 controls). Add an async validator on `questionText` that rejects duplicate question text already present elsewhere in the array (simulate this by comparing against sibling `FormArray` values rather than a real backend call).

## Further Reading

- [Reactive forms — Angular documentation](https://angular.dev/guide/forms/reactive-forms)
- [Validating form input — Angular documentation](https://angular.dev/guide/forms/form-validation)
- [Strictly typed reactive forms — Angular documentation](https://angular.dev/guide/forms/typed-forms)
- [Angular forms overview — Angular documentation](https://angular.dev/guide/forms)
- [RxJS interop: `takeUntilDestroyed` — Angular documentation](https://angular.dev/ecosystem/rxjs-interop)
- [`Validators` API reference — Angular documentation](https://angular.dev/api/forms/Validators)

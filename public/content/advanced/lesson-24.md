---
id: lesson-24
slug: custom-and-async-validators
title: "Custom & Asynchronous Validators"
level: advanced
order: 27
duration: 55
tags:
  - reactive-forms
  - forms
  - validators
  - async-validators
  - rxjs
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Write reusable **custom synchronous validators** using the `ValidatorFn` API, including parameterized validator factories.
- Build **asynchronous validators** (`AsyncValidatorFn`) that check a value against a server, using RxJS to avoid race conditions and excessive requests.
- Attach single and multiple sync/async validators to `FormControl`, `FormGroup`, and `FormArray`, including rules that compare several values.
- Package a validator as a directive so template-driven forms (`ngModel`) can use it.
- Correctly read and display a control's `PENDING`, `VALID`, and `INVALID` states while async validation is running.
- Apply Angular best practices (debouncing, cancellation, error handling, testability) when combining custom and async validation in real forms.

## Why This Concept Exists

Angular ships with built-in validators like `Validators.required`, `Validators.email`, `Validators.minLength`, and `Validators.pattern`. These cover the most common rules, but real applications almost always need **business-specific rules** that Angular cannot anticipate:

- "Password must contain a number and an uppercase letter."
- "The 'confirm password' field must match the 'password' field."
- "This username must not already exist in the database."
- "This coupon code must be verified against a remote service before checkout."

The first two rules only need data that already exists in the form — they can be checked **instantly**, in memory. The last two need information that lives **outside the browser**, on a server, which means the check takes time and cannot block the UI thread waiting for a response.

Angular solves this with two matching abstractions:

- **Custom validators** — plain functions that plug into the same validation pipeline as the built-in ones, so you can express *any* synchronous rule.
- **Asynchronous validators** — functions that return an `Observable` or `Promise`, so Angular can wait for a result without freezing the form, while exposing a `PENDING` status so the UI can show "checking…" feedback.

This design keeps validation logic **decoupled from components** (so it's reusable and unit-testable), **composable** (many small validators combine into one form), and **framework-integrated** (the same `errors`, `valid`, `pending`, and `statusChanges` APIs work for every kind of validator).

## Concept Explanation

### Synchronous custom validators

A synchronous validator is just a function matching the `ValidatorFn` signature:

```ts
type ValidatorFn = (control: AbstractControl) => ValidationErrors | null;
```

It receives the control being validated and must return either:

- `null` — the value is valid.
- A `ValidationErrors` object (a plain `{ [key: string]: any }` map) — the value is invalid, and the object describes *why*.

Angular calls this function every time the control's value changes (or on blur/submit, depending on `updateOn`) and merges its result into `control.errors`.

Most real validators are **factories**: functions that *return* a `ValidatorFn`, so you can configure them with parameters (a minimum length, a regular expression, a forbidden word list, etc.) instead of hardcoding a single rule.

### Asynchronous validators

An asynchronous validator matches the `AsyncValidatorFn` signature:

```ts
interface AsyncValidatorFn {
  (control: AbstractControl):
    Promise<ValidationErrors | null> | Observable<ValidationErrors | null>;
}
```

Instead of returning the result directly, it returns something that **eventually emits** the result. While Angular waits for that emission, the control's `status` becomes `'PENDING'`. It is neither valid nor invalid — the form is telling you "I don't know yet."

Key rules that make async validators behave correctly:

1. **The Observable must complete** (or the Promise must resolve). If it never completes, the control is stuck in `PENDING` forever, and the form can never become valid.
2. **Async validators only run after sync validators pass.** If a required field is empty, Angular won't waste a network call checking whether the empty string is "available."
3. **Async validators run again whenever the value changes**, so uncontrolled validators can fire one HTTP request per keystroke — this is why debouncing and cancellation matter (see the Real-World Example).

### Where you attach them

Both kinds of validators can be attached to a `FormControl`, `FormGroup`, or `FormArray` — because all three extend `AbstractControl`. This is what makes **cross-field validation** possible: a validator on a `FormGroup` can read multiple sibling controls (e.g., comparing `password` and `confirmPassword`), something a single `FormControl` cannot do on its own.

## Key Terminology

| Term | Meaning |
|---|---|
| `ValidatorFn` | A function `(control) => ValidationErrors \| null` used for synchronous validation. |
| `AsyncValidatorFn` | A function `(control) => Observable<ValidationErrors \| null> \| Promise<ValidationErrors \| null>` used for validation that requires I/O. |
| `ValidationErrors` | A key-value object describing failed rules, e.g. `{ required: true }` or `{ minlength: { requiredLength: 8, actualLength: 3 } }`. |
| **Validator factory** | A function that returns a `ValidatorFn`/`AsyncValidatorFn`, allowing the rule to be parameterized and reused. |
| **Cross-field validator** | A validator attached to a `FormGroup`/`FormArray` that compares values across multiple sibling controls. |
| `PENDING` | A control `status` value meaning an async validator is still running; the control is temporarily neither valid nor invalid. |
| `updateOn` | A control option (`'change' \| 'blur' \| 'submit'`) controlling when validators re-run — critical for tuning how often expensive async validators fire. |
| `Validators.compose` / `Validators.composeAsync` | Static helpers on Angular's `Validators` class that merge an array of validators into a single one. |

## Syntax Overview

```ts
import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';

// 1. A plain synchronous validator (not parameterized)
export const noSpacesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  return /\s/.test(control.value ?? '') ? { noSpaces: true } : null;
};

// 2. A synchronous validator FACTORY (parameterized, reusable)
export function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return value != null && value < minAge
      ? { minAge: { required: minAge, actual: value } }
      : null;
  };
}

// 3. An asynchronous validator factory
export function isUsernameTakenValidator(service: UsernameService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return of(null);
    return service.checkAvailability(control.value).pipe(
      map(available => (available ? null : { usernameTaken: true }))
    );
  };
}

// 4. Attaching validators to a control
const username = new FormControl('', {
  validators: [Validators.required, noSpacesValidator],
  asyncValidators: [isUsernameTakenValidator(usernameService)],
});
```

Notice the difference between passing `noSpacesValidator` (no parentheses — it *is* the function) and calling `minAgeValidator(18)` (parentheses — it *returns* the function). Forgetting to call a factory is one of the most common mistakes, covered below.

## Real World Analogy

Think of form validation as a **security checkpoint**:

- **Synchronous validators** are like a guard checking your ID against a printed list of rules right there at the door — "Is the photo present? Is the name filled in?" It takes a fraction of a second and never leaves the guard's desk.
- **Asynchronous validators** are like the guard calling **head office** to confirm your badge is still active. The guard can't finish checking you in until head office replies — so a "please wait" light turns on (that's your `PENDING` status). If the guard called head office on every tiny movement you make while waiting in line, the phone lines would jam — so a good guard waits until you've *stopped moving* for a moment before dialing (that's the `timer`), and hangs up on the previous call the instant you move again (that's Angular cancelling the previous validation).

## Examples

### 1. Basic Example — A Standalone Synchronous Validator Factory

This example validates that a field does not contain only whitespace, using a parameterized validator factory attached to a single `FormControl`.

```ts
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

/**
 * Custom validator factory: rejects values that are empty after trimming
 * (e.g. "   "), while still allowing Validators.required to handle a
 * completely empty string separately.
 */
function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    const isOnlyWhitespace = value.length > 0 && value.trim().length === 0;
    return isOnlyWhitespace ? { whitespace: true } : null;
  };
}

@Component({
  selector: 'app-username-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <label for="username">Username</label>
      <input id="username" formControlName="username" />

      @if (form.controls.username.touched && form.controls.username.invalid) {
        <p class="error">
          @if (form.controls.username.hasError('required')) {
            Username is required.
          }
          @if (form.controls.username.hasError('whitespace')) {
            Username cannot be blank spaces only.
          }
        </p>
      }
    </form>
  `,
})
export class UsernameFormComponent {
  form = new FormGroup({
    username: new FormControl('', [Validators.required, noWhitespaceValidator()]),
  });
}
```

**Explanation:**
- `noWhitespaceValidator()` is a **factory** — even though it takes no parameters here, writing it this way keeps it consistent with parameterized validators and makes it trivial to add configuration later.
- The validator returns `null` for empty strings, deliberately leaving that case to `Validators.required` — each validator should check exactly one concern.
- The template uses Angular's built-in `@if` control-flow syntax (no `*ngIf` or extra imports needed) and reads specific error keys with `hasError()`.

### 2. Real-World Example — Asynchronous Username Availability Check

This is the classic case for async validators: confirming a username is free by calling a backend endpoint, **without** firing a request on every keystroke and **without** leaving stale requests to resolve out of order.

```ts
import { Component, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsernameService {
  private http = inject(HttpClient);

  checkAvailability(username: string): Observable<boolean> {
    return this.http
      .get<{ available: boolean }>(`/api/usernames/${username}/available`)
      .pipe(map(response => response.available));
  }
}

/**
 * Async validator factory. Waits for a pause in typing before calling the
 * server, and treats network failures as "cannot confirm right now" instead
 * of blocking the form.
 */
function uniqueUsernameValidator(usernameService: UsernameService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null); // let Validators.required handle empty values
    }

    // Wait 400 ms before calling the server. If the value changes before then,
    // Angular unsubscribes from this observable and calls the validator again,
    // so the timer (and any request it started) is cancelled automatically.
    return timer(400).pipe(
      switchMap(() => usernameService.checkAvailability(control.value)),
      map(isAvailable => (isAvailable ? null : { usernameTaken: true })),
      catchError(() => of(null)) // a failed check should not block the user
    );
  };
}

@Component({
  selector: 'app-signup-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <label for="username">Username</label>
      <input id="username" formControlName="username" />

      @if (form.controls.username.pending) {
        <span class="hint">Checking availability…</span>
      }
      @if (!form.controls.username.pending && form.controls.username.hasError('usernameTaken')) {
        <p class="error">This username is already taken.</p>
      }
    </form>
  `,
})
export class SignupFormComponent {
  private usernameService = inject(UsernameService);

  form = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      asyncValidators: [uniqueUsernameValidator(this.usernameService)],
    }),
  });
}
```

**Explanation:**
- The async validator is a **factory that accepts a service**, so the HTTP dependency is injected once at the component level (via `inject()`) rather than the validator reaching into Angular's injector itself.
- **Each validation is a new, short-lived observable.** Angular calls the validator again on every value change and unsubscribes from the previous result first. That built-in cancellation is what discards stale requests.
- `timer(400)` turns that cancellation into a debounce: while the user keeps typing, the timer never fires, so no request is sent. `switchMap` then starts the request once the timer emits.
- Operators such as `distinctUntilChanged()` don't help *inside* a validator, because each call creates a stream with a single value.
- `HttpClient` completes after one response, so the control always leaves `PENDING`. Add `take(1)` only for sources that don't complete on their own.
- `catchError` prevents a network failure from permanently trapping the control in an invalid state — it degrades gracefully instead of blocking the user.
- The template checks `pending` before displaying the error, avoiding a flash of a stale error message while a new check is in flight.

### 3. Best-Practice Example — Composable, Testable Validators for a Dynamic List

The *Reactive Forms & Validation* lesson showed a cross-field validator on a `FormGroup` (password and confirm password). The same idea works on a `FormArray`, where a validator can look at *all* items at once. This example shows the recommended structure for larger forms: validators exported as **pure, standalone functions** (easy to unit test in isolation), list-level rules on the `FormArray`, and a component that only wires them together.

```ts
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

// --- Pure, dependency-free validators. Exported so they can be
// --- unit tested without instantiating any component. ---

/** Requires the list to hold between `min` and `max` items. */
export function arrayLengthValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const length = (control as FormArray).length;
    return length < min || length > max ? { arrayLength: { min, max, actual: length } } : null;
  };
}

/** Rejects duplicate values (compared case-insensitively, ignoring blanks). */
export function uniqueValuesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const values: string[] = (control.value ?? [])
      .map((value: string) => value.trim().toLowerCase())
      .filter(Boolean);
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
    return duplicates.length ? { duplicates: { values: [...new Set(duplicates)] } } : null;
  };
}

@Component({
  selector: 'app-invite-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <div formArrayName="emails">
        @for (email of emails.controls; track $index) {
          <input type="email" [formControlName]="$index" placeholder="teammate@example.com" />
          @if (email.touched && email.hasError('email')) {
            <p class="error">That doesn't look like an email address.</p>
          }
        }
      </div>
      <button type="button" (click)="addEmail()">Add another</button>

      @if (emails.hasError('duplicates')) {
        <p class="error">Each teammate can only be invited once.</p>
      }
      @if (emails.hasError('arrayLength')) {
        <p class="error">Invite between 1 and 5 teammates.</p>
      }

      <button type="submit" [disabled]="form.invalid || form.pending">Send invites</button>
    </form>
  `,
})
export class InviteFormComponent {
  private fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    emails: this.fb.array([this.fb.control('', Validators.email)], {
      validators: [arrayLengthValidator(1, 5), uniqueValuesValidator()],
    }),
  });

  get emails() {
    return this.form.controls.emails;
  }

  addEmail(): void {
    this.emails.push(this.fb.control('', Validators.email));
  }
}
```

**Explanation:**
- `arrayLengthValidator` and `uniqueValuesValidator` are **exported top-level functions**, not private component methods. This is the recommended pattern because it lets you write focused unit tests (e.g. `expect(uniqueValuesValidator()(new FormArray([new FormControl('a'), new FormControl('A')]))).toEqual({ duplicates: { values: ['a'] } })`) without rendering a component.
- The list-level validators are passed in the **options of `fb.array()`**, which places them on the `FormArray` itself. That's required because they need every item at once. Per-item rules (`Validators.email`) stay on each `FormControl`.
- The error objects carry details (`{ min, max, actual }`, the duplicate values), so the template or a shared error component can build a precise message.
- The submit button is disabled on `form.invalid || form.pending`, which also blocks submission while any async validator elsewhere in the form is still resolving (Example 2's pattern).
- Each validator checks exactly one rule — small, composable functions are easier to reuse, test, and reason about than one large validator.

### Using a custom validator with template-driven forms

Template-driven forms (`ngModel`) find validators through the `NG_VALIDATORS` token, so to use a custom rule there you wrap it in a directive:

```ts
import { Directive, forwardRef, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appForbiddenWord]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => ForbiddenWordDirective), multi: true },
  ],
})
export class ForbiddenWordDirective implements Validator {
  readonly appForbiddenWord = input.required<string>();

  validate(control: AbstractControl): ValidationErrors | null {
    const word = this.appForbiddenWord().toLowerCase();
    const value = String(control.value ?? '').toLowerCase();
    return word && value.includes(word) ? { forbiddenWord: { word } } : null;
  }
}
```

```html
<input name="bio" ngModel appForbiddenWord="spam" #bio="ngModel" />
@if (bio.hasError('forbiddenWord')) {
  <p class="error">Please don't use "spam".</p>
}
```

Add the directive to the component's `imports`. The same directive also works on reactive-form inputs that use `formControlName`.

## Common Mistakes

- **Forgetting to call a validator factory.** Writing `[myValidator]` instead of `[myValidator()]` passes the factory function itself as the validator, which has the wrong signature and will silently fail or throw at runtime.
- **Returning a value instead of an Observable/Promise from an async validator.** `AsyncValidatorFn` must always return `Observable<ValidationErrors | null>` or `Promise<ValidationErrors | null>` — never a raw `ValidationErrors | null`.
- **Subscribing inside the validator instead of returning the observable.** If you call `.subscribe(...)` inside the validator and return nothing, Angular never receives a result and the control stays `PENDING` forever.
- **An async validator observable that never completes.** Long-lived streams (e.g., a live WebSocket or Firestore listener) will leave the control permanently `PENDING` unless you apply `first()` or `take(1)`.
- **No debouncing on async validators tied to `updateOn: 'change'`** (the default). Without a short `timer` before the request (or `updateOn: 'blur'`), every keystroke triggers a network request.
- **Ignoring errors from the async source.** If the HTTP call fails and you don't `catchError`, the observable errors out, and the control can end up stuck rather than showing a clear, recoverable message.
- **Mixing up the third argument.** The `FormControl` constructor signature is `(value, validators?, asyncValidators?)` — putting an async validator in the sync validators array (or vice versa) means it will never run correctly.
- **Placing a cross-field validator on a `FormControl`.** A single control has no way to read its siblings; cross-field checks belong on the parent `FormGroup`/`FormArray`.
- **Not guarding against `null`/`undefined` values.** Calling string methods like `.trim()` or `.test()` directly on `control.value` throws when the value is `null`, which is a valid initial state for many controls.

## Best Practices

- Keep validators **pure functions** with no side effects, so they're trivial to unit test in isolation from any component or template.
- Prefer **validator factories** even for validators that currently need no parameters — it keeps a consistent, easily extendable API across your codebase.
- For async validators that call a service, use a **factory that accepts the dependency as a parameter** (as in Example 2/3) rather than reaching into Angular's injector from inside the validator, which keeps the function easy to test with a mock.
- Start server checks from `timer(ms)` + `switchMap` when they're tied to live user typing (Angular cancels the previous validation on each change), and add `catchError` so network failures degrade gracefully instead of trapping the form.
- Consider `updateOn: 'blur'` or `updateOn: 'submit'` on controls with expensive async validators, so the check runs once the user is done typing rather than on every change.
- Ensure every async validator's observable **completes** (via `first()`/`take(1)`, or because the source, like `HttpClient`, already completes by design).
- Disable submit controls (or otherwise block submission) while `form.pending` is `true`, in addition to checking `form.invalid`.
- Attach cross-field validators to the smallest `FormGroup` that contains all the fields they need — not to the root form, unless the root is genuinely the right scope.
- Give each `ValidationErrors` key a clear, unique name (`usernameTaken`, `fieldsMismatch`) so templates and error-message components can target specific failures precisely.

## Summary

- Angular's built-in validators cover common cases; **custom validators** let you express any business rule as a plain function.
- A synchronous validator matches `ValidatorFn`: `(control) => ValidationErrors | null`.
- An asynchronous validator matches `AsyncValidatorFn`: it returns an `Observable`/`Promise` and must eventually **complete**.
- **Validator factories** (functions that return a validator) let you parameterize and reuse validation logic.
- While an async validator is resolving, the control's status is `'PENDING'` — neither valid nor invalid.
- Use `timer` + `switchMap` and `catchError` to keep async validators efficient and resilient; Angular itself cancels the previous validation whenever the value changes.
- **Cross-field validators** belong on the `FormGroup`/`FormArray`, since they need access to sibling controls.
- Export validators as standalone functions to keep them reusable and easily unit-testable.
- Always guard submission against both `form.invalid` and `form.pending`.

## Flash Cards

**Q: What is the key structural difference between `ValidatorFn` and `AsyncValidatorFn`?**
A: `ValidatorFn` returns `ValidationErrors | null` synchronously. `AsyncValidatorFn` returns an `Observable<ValidationErrors | null>` or `Promise<ValidationErrors | null>` that must eventually complete/resolve.

**Q: Why must an async validator's Observable complete?**
A: Angular waits for completion to move the control out of the `PENDING` status. An observable that never completes leaves the control (and often the whole form) permanently pending.

**Q: What is a validator factory, and why use one?**
A: A function that returns a `ValidatorFn`/`AsyncValidatorFn`. It lets you parameterize a rule (e.g. a minimum length or an injected service) and reuse the same validator with different configuration across your app.

**Q: How do you prevent an async validator from firing an HTTP request on every keystroke?**
A: Start the check from `timer(ms)` inside the validator (Angular cancels the previous validation when the value changes), and/or set the control's `updateOn` to `'blur'` or `'submit'`.

**Q: Where should you attach a validator that needs to compare two sibling fields, like password and confirm-password?**
A: On the parent `FormGroup` (or `FormArray`), not on an individual `FormControl` — only the group can access its child controls via `group.get(...)`.

## Exercises

**Easy — Forbidden Word Validator**
Write a synchronous validator factory `forbiddenWordValidator(word: string)` that returns `{ forbiddenWord: true }` if a text `FormControl`'s value contains the given word (case-insensitive), and `null` otherwise. Attach it to a standalone component's `bio` field alongside `Validators.required`, and display an error message when it fails.

**Medium — Async Coupon Code Validator**
Build an async validator factory `validCouponValidator(couponService)` for a checkout form's `couponCode` field. Simulate the service with an RxJS `of(...).pipe(delay(800))` returning `true` for a small set of hardcoded valid codes and `false` otherwise. The validator should debounce input, avoid checking empty values, and correctly report `{ invalidCoupon: true }` on failure. Show a "Checking coupon…" message while `pending` is `true`.

**Challenging — Full Registration Form**
Build a registration form combining everything from this lesson:
- A `password` field using a strength validator (uppercase, digit, 8+ characters).
- A `confirmPassword` field validated against `password` with a cross-field `FormGroup` validator.
- An `email` field with an async uniqueness check against a mocked service, using `timer`, `switchMap`, and `catchError`.
- A submit button disabled while `form.invalid` or `form.pending` is `true`.
Structure your validators as exported, independently testable functions rather than component methods.

## Further Reading

- [Angular — Reactive forms guide](https://angular.dev/guide/forms/reactive-forms)
- [Angular — Validating form input guide](https://angular.dev/guide/forms/form-validation)
- [Angular API — `ValidatorFn`](https://angular.dev/api/forms/ValidatorFn)
- [Angular API — `AsyncValidatorFn`](https://angular.dev/api/forms/AsyncValidatorFn)
- [Angular API — `AbstractControl`](https://angular.dev/api/forms/AbstractControl)
- [Angular API — `Validators`](https://angular.dev/api/forms/Validators)
- [RxJS — `timer`, `switchMap`, `catchError` operators](https://rxjs.dev/guide/operators)
- Looking ahead: Angular's newer **Signal Forms** API (experimental in Angular 21, stable since Angular 22) takes a different, signals-based approach to validation, including async validation, alongside the Reactive Forms API described here: [angular.dev/guide/forms/signals/validation](https://angular.dev/guide/forms/signals/validation).

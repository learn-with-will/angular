---
slug: async-validator
title: "Async validators"
topic: forms
kind: technique
summary: "Check a value against the server without freezing the form, and without a request per keystroke."
tags: [forms, validation, async, rxjs]
related: [custom-validator, control-state, update-on, pitfall-async-validator-pending]
---
> **In one line:** An async validator returns an Observable or Promise. While it runs the control is `PENDING`, and starting a request from `timer()` plus `switchMap` gives you a debounce for free.

## The idea

"Is this username taken?" cannot be answered in the browser. The check takes time, so the validator returns something that *eventually* emits the result, and Angular waits without blocking the UI.

While it waits, the control's status is `PENDING`: neither valid nor invalid, just "I do not know yet". Three rules make async validators behave:

| Rule | Why it matters |
|---|---|
| Async validators run only after sync validators pass | an empty required field never triggers a request |
| The Observable must **complete** | otherwise the control stays `PENDING` forever |
| They re-run on every value change | uncontrolled, that is one request per keystroke |

The third rule has a built-in remedy. Angular calls the validator again on each change and **unsubscribes from the previous result first**, so a pending request is cancelled automatically.

## See it

```typescript
export function uniqueUsername(users: UserService): AsyncValidatorFn {
  return (control) => {
    if (!control.value) return of(null);          // let `required` handle empties

    return timer(400).pipe(                       // wait for a pause in typing
      switchMap(() => users.isAvailable(control.value)),
      map((available) => (available ? null : { usernameTaken: true })),
      catchError(() => of(null)),                 // a failed check must not block the user
    );
  };
}

readonly username = new FormControl('', {
  nonNullable: true,
  validators: [Validators.required, Validators.minLength(3)],
  asyncValidators: [uniqueUsername(inject(UserService))],
});
```

```html
@if (username.pending) {
  <span>Checking availability…</span>
} @else if (username.hasError('usernameTaken')) {
  <p class="error">This username is already taken.</p>
}
```

## Go deeper

`timer(400)` is the debounce. While the user keeps typing, Angular unsubscribes before the timer fires, so no request is sent. Operators such as `distinctUntilChanged()` do not help *inside* the validator, because each call creates a stream of exactly one value.

Take the service as a parameter, as above, instead of reaching for the injector inside the validator. The function stays easy to test with a stub.

`HttpClient` completes after one response, so the control always leaves `PENDING`. Streams that never complete, such as a socket or Firestore listener, need `first()` or `take(1)`.

Disable submission while `form.pending` is true, in addition to checking `form.invalid`.

## Watch out

- Showing the error without checking `pending`, so a stale message flashes during a new check.
- Letting a network failure error the stream, which can leave the control stuck.
- Putting the async validator in the sync array. The third constructor slot is for async ones.

## Remember

- Return an Observable or Promise; the control is `PENDING` meanwhile.
- `timer` + `switchMap` debounces and cancels.
- Always `catchError`, and always complete.

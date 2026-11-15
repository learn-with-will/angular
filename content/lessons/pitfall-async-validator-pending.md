---
slug: pitfall-async-validator-pending
title: "Pitfall: stuck in PENDING"
topic: forms
kind: pitfall
summary: "An async validator that subscribes itself, never completes or returns a plain value leaves the form unsubmittable."
tags: [forms, async, pending, rxjs]
related: [async-validator, custom-validator, control-state, form-value-changes]
---
> **In one line:** A control is `PENDING` until the validator's Observable emits and completes. Break that contract and the form never becomes valid again.

## The idea

When Angular runs an async validator it waits for the returned stream. If that stream never gives a result, the control waits forever, `form.valid` stays false, and the Submit button stays disabled with no error on screen.

Each mistake below produces the same symptom, so it helps to know the whole list:

| Mistake | Why the control sticks |
|---|---|
| Calling `.subscribe()` inside the validator and returning nothing | Angular never receives a stream to wait on |
| Returning a plain value instead of an Observable or Promise | the async contract is broken |
| Returning an Observable that never completes (socket, listener) | `PENDING` only ends on completion |
| Not catching an HTTP error | the stream errors and the control stays unresolved |
| Putting the function in the sync validators array | it runs with the wrong signature |

## See it

```typescript
// Before: subscribes and returns nothing useful; the control is stuck
export function broken(users: UserService): AsyncValidatorFn {
  return (control) => {
    users.isAvailable(control.value).subscribe();   // result is thrown away
    return of(null) as any;
  };
}

// After: return the stream, shape it, handle failure
export function working(users: UserService): AsyncValidatorFn {
  return (control) =>
    users.isAvailable(control.value).pipe(
      map((available) => (available ? null : { usernameTaken: true })),
      first(),                           // make sure it completes
      catchError(() => of(null)),        // degrade gracefully on failure
    );
}
```

## Go deeper

A quick check: log `form.status` and `control.status` when Submit seems dead. If one says `PENDING` long after the response arrived, you are in this family.

Also remember that a *failed check should not block the user*. Returning `of(null)` on error means "I could not confirm, so I will not complain". The server must still enforce uniqueness when the form is finally submitted, because a client check is advisory.

The `FormControl` constructor order is `(value, validators, asyncValidators)`. Passing an async validator second quietly runs it as a sync one, which is an easy mistake to read past.

For long-lived sources, `first()` or `take(1)` guarantees completion. `HttpClient` already completes by design, so there it is optional.

## Watch out

- Subscribing inside the validator instead of returning the stream.
- Using a source that never completes without `take(1)`.
- Forgetting `catchError`, so a network blip leaves the form stuck.

## Remember

- Return the Observable; do not subscribe in the validator.
- It must emit and complete.
- Handle errors, and let the server make the final decision.

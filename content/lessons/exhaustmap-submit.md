---
slug: exhaustmap-submit
title: "Safe submit with exhaustMap and retry"
topic: rxjs
kind: pattern
summary: "Ignore extra clicks while a save is running, retry transient failures, and clean up with the component."
tags: [rxjs, exhaustmap, retry, submit]
related: [flattening-operators, unsubscribe-cleanup, retry-interceptor, catch-error-placement]
---
> **In one line:** `exhaustMap` makes the stream itself refuse new triggers while a request is in flight, so a double-click can never send two saves.

## The idea

A Save button can be clicked twice, by a nervous user or a double-tap. The usual fix is a boolean guard in the click handler. A stream expresses the same rule directly: put the request in `exhaustMap`, and clicks that arrive while it is running are simply dropped.

Compare the choices for the same button:

| Operator | A second click during a save |
|---|---|
| `switchMap` | cancels the first save and starts another: data may be lost |
| `mergeMap` | sends a second request in parallel: duplicate records |
| `concatMap` | queues it: a second save happens after the first |
| `exhaustMap` | ignored, which is what a submit button wants |

Combine it with `retry` for transient failures, and with `takeUntilDestroyed()` so the stream ends with the component.

## See it

```typescript
export class SaveButton {
  private readonly http = inject(HttpClient);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly save$ = new Subject<void>();

  constructor() {
    this.save$
      .pipe(
        tap(() => { this.isSaving.set(true); this.errorMessage.set(null); }),
        exhaustMap(() =>
          this.http.post<SaveResult>('/api/save', {}).pipe(
            retry({ count: 2, delay: 1000 }),       // transient failures, 1s apart
            catchError(() => {
              this.errorMessage.set('Save failed. Please try again.');
              return of({ success: false });
            }),
            tap(() => this.isSaving.set(false)),
          ),
        ),
        takeUntilDestroyed(),                         // constructor: injection context
      )
      .subscribe();
  }
}
```

## Go deeper

Signals hold `isSaving` and `errorMessage` because they change inside an HTTP callback. In a zoneless app, assigning a plain field there would not refresh the view, whereas writing a signal does.

`retry` re-subscribes to the failed inner request up to twice, waiting a second between attempts, and only then lets the error reach `catchError`. Retrying a `POST` is safe here only if the server treats repeated saves as idempotent. Otherwise, remove the `retry` and let the user decide.

`catchError` sits inside `exhaustMap`, so a failure ends only that inner request. The outer click stream stays alive and the next click works. Place it outside and the button would be dead after the first error.

Still keep `[disabled]="isSaving()"` on the button. The stream makes duplicates impossible, and the disabled state tells the user why nothing happens.

## Watch out

- Using `switchMap` for saves, which cancels the earlier one.
- Putting `catchError` outside `exhaustMap`, which ends click handling after one failure.
- Retrying non-idempotent writes.

## Remember

- `exhaustMap` ignores triggers while busy.
- Inner `catchError`, so the click stream survives.
- `takeUntilDestroyed()` in the constructor ends it with the component.

---
slug: loading-error-interceptors
title: "Loading and error interceptors"
topic: http
kind: pattern
summary: "A counter-based loading indicator and central error reporting, with the error re-thrown for callers."
tags: [http, interceptors, loading, errors]
related: [http-context, interceptor-order, http-error-response, interceptor-pipeline]
---
> **In one line:** Count pending requests rather than flipping a boolean, stop in `finalize`, and re-throw errors after reporting them.

## The idea

Two interceptors cover most apps. The **loading** interceptor shows a global overlay while anything is in flight. The **error** interceptor reports failures centrally, so no screen has to.

Both have a classic mistake:

| Mistake | What goes wrong |
|---|---|
| a boolean `isLoading` | with two parallel requests, the first to finish hides the loader while the second is still running |
| `catchError` that returns `of(null)` | the caller sees success and never knows the request failed |
| stopping the loader in `next` only | errors and cancellations leave the loader on forever |

The fixes: a **counter** that goes up on start and down on stop, `finalize` to stop it (it runs on success, error *and* cancellation), and `throwError` to hand the error back.

## See it

```typescript
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);
  readonly isLoading = computed(() => this.pending() > 0);

  start(): void { this.pending.update((n) => n + 1); }
  stop(): void { this.pending.update((n) => Math.max(0, n - 1)); }
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADER)) return next(req);

  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
```

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !req.context.get(SILENT_ERRORS)) {
        notifications.error(messageFor(error));
      }
      return throwError(() => error); // callers can still react
    }),
  );
};
```

## Go deeper

`finalize` covers a case that is easy to miss: `switchMap` unsubscribing from a request. The request is cancelled, `next` never fires, and an interceptor that stops the loader in `next` would leave the counter stuck above zero.

A `401` is a good candidate for central handling. Inside the same `catchError`, call `auth.logout()` and navigate to login with a `returnUrl`, then still re-throw, so a component waiting on the request does not hang.

The loader is read by the root component: `@if (loading.isLoading()) { <app-loading-overlay /> }`. Because it is a signal, the overlay appears and disappears without any subscription.

## Watch out

- A boolean loading flag with parallel requests.
- Swallowing errors with `of(null)` or `EMPTY`.
- Stopping the loader anywhere except `finalize`.

## Remember

- Count pending requests; stop in `finalize`.
- Report centrally, then re-throw.
- Use context tokens so special requests can opt out.

---
slug: retry-interceptor
title: "A safe retry interceptor"
topic: http
kind: technique
summary: "Retry only idempotent requests, only for transient failures, with a growing delay."
tags: [http, interceptors, retry, idempotent]
related: [interceptor-order, http-error-response, loading-error-interceptors, interceptor-pipeline]
---
> **In one line:** Retry `GET` requests on transient failures only, with backoff. Retrying a `POST` can create the same record twice.

## The idea

Networks fail briefly: a dropped connection, a restarting server. A short retry hides most of those from the user. Done carelessly, retrying causes bugs, so three rules matter:

| Rule | Why |
|---|---|
| retry only safe, idempotent methods | resending a `POST` may create a duplicate order |
| retry only transient errors (status `0`, `5xx`) | a `404` or `400` will fail the same way every time |
| wait a little longer each time | hammering a struggling server makes it worse |

The tool is RxJS `retry` with a `delay` function. It receives the error and the attempt number, and returns an Observable: a `timer` to wait and try again, or `throwError` to give up immediately.

## See it

```typescript
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrying a POST could create the same entry twice
  if (req.method !== 'GET') return next(req);

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error: unknown, attempt) => {
        const transient =
          error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
        // Back off a little more each time; stop immediately on 4xx
        return transient ? timer(attempt * 300) : throwError(() => error);
      },
    }),
  );
};
```

## Go deeper

Immutability is what makes this safe. `retry` re-subscribes to `next(req)`, which sends the **same** immutable request again, so there is nothing to reset.

Position matters. Placed *inside* the error and loading interceptors, as in the order lesson, the user sees one loader and at most one error after all attempts. Placed outside them, every failed attempt would toast an error.

For writes that must be retried, make them idempotent on the server instead: send an **idempotency key** header that the server uses to ignore duplicates, then it is safe to resend. Without that guarantee, leave writes alone.

Add jitter to the delay, such as `attempt * 300 + Math.random() * 100`, when many clients might fail together. Otherwise they all retry at the same instant and cause the next spike.

## Watch out

- Retrying `POST`, `PUT` or `DELETE` with no idempotency guarantee.
- Retrying `4xx` responses that cannot succeed.
- Placing the error toast outside the retry, so it fires per attempt.

## Remember

- Retry only idempotent requests and transient failures.
- Back off with `timer`, and give up on `4xx`.
- Put it inside loading and error handling.

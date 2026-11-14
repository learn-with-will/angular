---
slug: http-error-response
title: "HttpErrorResponse and status 0"
topic: http
kind: api
summary: "A failed request arrives as an HttpErrorResponse. Status 0 means there was no response at all."
tags: [http, errors, httperrorresponse, status]
related: [http-cold-requests, cors-dev-proxy, data-service, loading-error-interceptors]
---
> **In one line:** Failures arrive in the Observable's error channel as an `HttpErrorResponse`. A status of `0` means the request never got a response, so it is not a server error.

## The idea

`HttpClient` treats any non-2xx status as an error. Your `error` callback or `catchError` receives an `HttpErrorResponse` with three useful fields:

| Field | Holds |
|---|---|
| `status` | the HTTP status: `404`, `500`, ... or `0` |
| `error` | the response body the server sent, often a JSON error object |
| `message` | a readable summary |

The surprise is **status `0`**. The server never answered: the user is offline, the server is down, DNS failed, or the browser blocked the response for CORS reasons. Showing "server error" for that case misleads people, because the right message is about the connection.

| Status | A good user-facing message |
|---|---|
| `0` | "Cannot reach the server. Check your connection." |
| `401` | send them to login |
| `403` | "You don't have permission to do that." |
| `404` | "That item no longer exists." |
| `5xx` | "The server had a problem. Try again shortly." |

## See it

```typescript
function messageFor(error: HttpErrorResponse): string {
  if (error.status === 0) return 'Cannot reach the server. Check your connection.';
  if (error.status === 404) return 'That item no longer exists.';
  if (error.status >= 500) return 'The server had a problem. Please try again.';
  return 'Something went wrong with that request.';
}

this.api.create(title).subscribe({
  next: (created) => this.todos.update((list) => [...list, created]),
  error: (err: HttpErrorResponse) => this.error.set(messageFor(err)),
});
```

State lives in signals, so the message appears in the view even in a zoneless app.

## Go deeper

Handle errors **where you can do something useful**: show a message in the component that triggered the request, fall back to cached data, or offer a retry button. Cross-cutting cases such as a `401` on any request belong in an interceptor, so no individual screen has to remember them.

If you catch an error and want callers to still see it, re-throw with `throwError(() => error)`. Returning `of(null)` or `EMPTY` from `catchError` hides the failure, and the caller will treat it as success.

The `error` field is whatever the server sent, so its shape is only as reliable as the backend. Read it defensively, with optional chaining, and keep a generic fallback message.

## Watch out

- Treating status `0` as a server error. Check connectivity and the console for CORS messages.
- Swallowing the error in `catchError` with `of(null)`.
- Showing raw `error.message` text to end users.

## Remember

- Errors arrive as `HttpErrorResponse` with `status`, `error` and `message`.
- Status `0` means no response, such as offline, down or CORS.
- Handle locally when you can act; use interceptors for cross-cutting cases.

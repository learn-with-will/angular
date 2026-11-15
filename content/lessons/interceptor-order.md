---
slug: interceptor-order
title: "Interceptor order is design"
topic: http
kind: concept
summary: "Where an interceptor sits in the array decides what it sees: the whole round trip, retries, or only final errors."
tags: [http, interceptors, order, retry]
related: [interceptor-pipeline, retry-interceptor, loading-error-interceptors, functional-interceptor]
---
> **In one line:** Requests flow forwards and responses flow backwards, so an interceptor's position in the array changes what it observes.

## The idea

With `withInterceptors([a, b, c])`, a request goes `a → b → c → server`, and the response goes `server → c → b → a`. An interceptor near the **start** wraps everything after it, including retries. One near the **end** sees the final request just before it is sent.

| Position | Sees | Good for |
|---|---|---|
| early (outer) | the whole round trip, retries included | timing, loading indicators |
| middle | what survived the outer layers | error reporting |
| late (inner) | the final request, rebuilt on each attempt | adding the auth token to the final URL |

```tree
telemetry | outermost: times the whole call @primary
  loading | one start and stop per call @blue
    error | sees only errors that survived retries @amber
      retry | re-runs everything below it @amber
        base URL | builds the final URL @green
          auth | innermost: reads the current token each attempt @green
```

## See it

```typescript
provideHttpClient(
  withFetch(),
  withInterceptors([
    telemetryInterceptor, // times the whole round trip, retries included
    loadingInterceptor,   // one start/stop per call, even if retried
    errorInterceptor,     // only sees errors that survived the retries
    retryInterceptor,     // re-runs everything below it on each attempt
    baseUrlInterceptor,   // builds the final URL
    authInterceptor,      // innermost: reads the current token for every attempt
  ]),
);
```

## Go deeper

Test the claims in the table by asking "what happens on a failing GET that is retried twice?". With the order above, telemetry records **one** duration, the loader starts and stops **once**, the error handler runs **once**, and auth reads the token on **each** of the three attempts, so a token refreshed between attempts is picked up.

Swap `errorInterceptor` below `retryInterceptor` and the error toast fires on every failed attempt, not just the last. Swap `baseUrlInterceptor` after `authInterceptor` and the auth interceptor sees `api/diary` instead of the absolute URL, so a host check on the URL silently never matches.

Write the order in `app.config.ts` with a short comment on each line, as above. Order bugs are invisible in the interceptors themselves, so the comment is the only place the intent is documented.

You can check an order without running the app. A short spec registers the interceptors with stubs that push their name into an array on the way in and the way out, then asserts the sequence. It documents the intended order in executable form, so a reordered array fails a test rather than a customer.

When two interceptors seem to fight, draw the round trip as above and walk a single failing request through it. The bug is almost always visible as "this one sees the request before that one has changed it".

## Watch out

- Placing the error handler outside retries, so it reports every attempt.
- Putting the auth check before the base-URL rewrite.
- Leaving the order undocumented, so the next person reorders it.

## Remember

- Outer interceptors see the whole round trip; inner ones see the final request.
- Put timing and loading outside retry, auth inside.
- Document the order next to the array.

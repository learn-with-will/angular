---
id: lesson-34
slug: interceptor-pattern-http-interceptors
title: "The Interceptor Pattern: HTTP Interceptors"
level: advanced
order: 34
duration: 55
tags:
  - http
  - design-patterns
  - interceptors
  - rxjs
  - httpclient
---

## Learning Objectives

By the end of this lesson you will be able to:

- Explain the **interceptor pattern** and where interceptors sit between `HttpClient` and the server.
- Write functional interceptors (`HttpInterceptorFn`) that use `inject()`, and register them with `provideHttpClient(withInterceptors([...]))`.
- Predict the order interceptors run in, for both requests and responses, and choose a deliberate order.
- Modify requests safely with `req.clone()`, because requests are immutable.
- Build the classic interceptors: base URL, auth token, loading indicator, error handling, telemetry, and retry.
- Let individual requests opt in or out with `HttpContextToken` instead of fake headers.
- Unit-test interceptors with `provideHttpClientTesting()` and `HttpTestingController`.

## Why This Concept Exists

Almost every HTTP request in an app needs the same extra work:

- attach the user's token,
- point at the right server for this environment,
- show a loading indicator,
- report failures to the user,
- measure how long it took.

You *could* do all of that inside every service method. In practice, someone forgets the token on a new endpoint, the loading spinner is wired up on half the screens, and changing the API host means editing twenty files.

These are **cross-cutting concerns**: they cut across every feature but belong to none. The **interceptor pattern** handles them in one place by putting small, composable steps in the middle of every request. Services stay focused on "what to fetch", and interceptors handle "how every request behaves".

## Concept Explanation

### A pipeline around every request

When a service calls `http.get()`, the request doesn't go straight to the network. It passes through each interceptor in turn, then the backend sends it. The response (or error) travels back through the same interceptors in **reverse** order.

```text
Service ─► interceptor A ─► interceptor B ─► interceptor C ─► server
Service ◄─ interceptor A ◄─ interceptor B ◄─ interceptor C ◄─ server
```

Each interceptor can:

- **change the request** before passing it on (add a header, rewrite the URL),
- **watch or change the response** on the way back (show a toast, record timing, retry),
- **short-circuit** by returning a response without calling `next()` at all (for example, from a cache).

This is a form of the *chain of responsibility* pattern: every link does one job and hands off to the next.

### Functional interceptors

A modern interceptor is just a function:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const exampleInterceptor: HttpInterceptorFn = (req, next) => {
  // Before: inspect or replace the request
  return next(req); // pass it on and return the response stream
};
```

- `req` is an `HttpRequest`.
- `next(req)` forwards the request and returns an `Observable` of `HttpEvent`s.
- You can call `inject()` at the top of the function, because Angular runs interceptors in an injection context.

Register them once, in order:

```typescript
provideHttpClient(withInterceptors([interceptorA, interceptorB, interceptorC]));
```

Older apps use classes that implement `HttpInterceptor`, registered with the `HTTP_INTERCEPTORS` token. They still work through `withInterceptorsFromDi()`, but functional interceptors are simpler, tree-shakable, and their order is explicit in one array.

### Requests are immutable

You can't set `req.url = ...` or add to `req.headers` in place. Create a modified copy:

```typescript
next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
next(req.clone({ url: `https://api.example.com/${req.url}` }));
```

Immutability is what makes retries safe: the original request is unchanged, so it can be sent again.

### Responses are a stream of events

`next(req)` can emit several events for one request, such as `Sent`, upload progress, and finally the `Response`. When you only care about the final response, check `event.type === HttpEventType.Response` (or `event instanceof HttpResponse`).

Errors arrive as an `HttpErrorResponse` in the error channel. Handle them with `catchError`. If callers should still see the error, re-throw it with `throwError(() => error)`.

### Per-request options with `HttpContext`

Sometimes one request must behave differently: a typeahead search shouldn't flash a full-screen loader, and a background poll shouldn't show error toasts. Define an `HttpContextToken` with a default value:

```typescript
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);
```

The caller sets it: `http.get(url, { context: new HttpContext().set(SKIP_LOADER, true) })`. The interceptor reads it: `req.context.get(SKIP_LOADER)`.

This is better than inventing headers like `X-LOADING: false`. Context values never leave the browser, while custom headers are sent to the server and can trigger extra CORS preflight requests.

### Order is a design decision

Because requests flow forwards and responses flow backwards, where you put each interceptor changes what it sees:

- An interceptor **early** in the list sees the *whole* round trip, including anything later interceptors do, such as retries. Good for timing and loading indicators.
- An interceptor **late** in the list sees the *final* request just before it's sent. Good for adding the auth token to the final URL.
- An error handler placed **before** a retry interceptor only sees errors that survived every retry.

## Key Terminology

- **Interceptor**: a function that sits between `HttpClient` and the backend and can inspect or transform every request and response.
- **Cross-cutting concern**: behavior needed across many features, like authentication or logging, that doesn't belong to any one of them.
- **`HttpInterceptorFn`**: the type of a functional interceptor, `(req, next) => Observable<HttpEvent<unknown>>`.
- **`next`**: the function that forwards a request to the rest of the chain and returns the response stream.
- **`req.clone()`**: creates a modified copy of an immutable `HttpRequest`.
- **`HttpEvent`**: one event in a request's lifecycle, such as `Sent`, progress, or `Response`.
- **`HttpErrorResponse`**: the error object for failed requests, including network errors (status `0`).
- **`HttpContextToken`**: a typed key for passing per-request options to interceptors without sending anything to the server.
- **Short-circuit**: returning a response from an interceptor without calling `next()`.

## Syntax Overview

```typescript
import {
  HttpContext,
  HttpContextToken,
  HttpEventType,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { tap } from 'rxjs';

export const VERBOSE = new HttpContextToken<boolean>(() => false);

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(VERBOSE)) return next(req);

  console.log('→', req.method, req.urlWithParams);
  return next(req).pipe(
    tap((event) => {
      if (event.type === HttpEventType.Response) console.log('←', event.status, req.url);
    }),
  );
};

// app.config.ts
provideHttpClient(withInterceptors([loggingInterceptor]));

// A caller opting in
http.get('api/diary', { context: new HttpContext().set(VERBOSE, true) });
```

## Real World Analogy

Think of the post room in a large office.

- Every outgoing letter passes along the same counter. One clerk adds the company's return address (**base URL**). The next one stamps it with the official seal (**auth token**). Another logs the time it left (**telemetry**).
- Replies come back along the same counter **in reverse**. The clerk who logged the time now writes down how long the reply took.
- If a reply says "address unknown", one clerk tries sending it again (**retry**), and only if that fails does another clerk phone the person who wrote it (**error notification**).
- A sticky note on a letter saying "urgent, don't log this" is read by the clerks but never mailed (**`HttpContext`**). Writing it on the envelope instead (a custom header) would mean the recipient sees it too.
- Nobody writing a letter has to remember any of this. They just drop it in the tray.

## Examples

### 1. Basic Example: Base URL and auth token

Services use short paths like `api/diary`. One interceptor turns them into full URLs, and another attaches the token, but only to calls going to our API.

```typescript
// api-base-url.ts
import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
```

```typescript
// base-url.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from './api-base-url';

const API_PREFIX = 'api/';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only rewrite our own API calls. Other relative URLs (assets, lesson files)
  // and absolute URLs (third-party APIs) pass through untouched.
  if (!req.url.startsWith(API_PREFIX)) return next(req);

  const baseUrl = inject(API_BASE_URL);
  return next(req.clone({ url: `${baseUrl}/${req.url.slice(API_PREFIX.length)}` }));
};
```

```typescript
// auth.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from './api-base-url';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token(); // a signal holding the token or null
  const isOurApi = req.url.startsWith(inject(API_BASE_URL));

  // Never send the token to third-party hosts.
  if (!token || !isOurApi) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { API_BASE_URL } from './core/http/api-base-url';
import { baseUrlInterceptor } from './core/http/base-url.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_BASE_URL, useValue: 'https://api.gymdiary.example' },
    // baseUrl runs first, so authInterceptor sees the final, absolute URL.
    provideHttpClient(withFetch(), withInterceptors([baseUrlInterceptor, authInterceptor])),
  ],
};
```

> **About `withFetch()`:** it switches `HttpClient` to the browser's Fetch API. On Angular 20 and 21 you add it yourself. Since Angular 22, Fetch is the default backend and `withFetch()` is deprecated, so you can leave it out (use `withXhr()` if you need upload progress events).

```typescript
// diary.api.ts: no host, no headers, no auth code
list(): Observable<ExerciseSet[]> {
  return this.http.get<{ items: ExerciseSet[] }>('api/diary').pipe(map((res) => res.items));
}
```

**Why this works:** the services only describe *what* they need. Moving to a new host is a one-line change to `API_BASE_URL`, and a new endpoint gets the token automatically. Because `authInterceptor` checks the host, the token never leaks to a third-party API.

### 2. Real-World Example: A loading indicator and central error handling

The loader uses a **counter**, not a boolean. With a boolean, the first of two parallel requests to finish would hide the loader while the second is still running.

```typescript
// http-context.ts
import { HttpContextToken } from '@angular/common/http';

/** Don't show the global loading overlay for this request (typeahead, polling). */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);
/** Don't show an error toast; the caller handles errors itself. */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);
```

```typescript
// loading.service.ts
import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);
  readonly isLoading = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update((count) => count + 1);
  }

  stop(): void {
    this.pending.update((count) => Math.max(0, count - 1));
  }
}
```

```typescript
// loading.interceptor.ts
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';
import { SKIP_LOADER } from './http-context';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADER)) return next(req);

  const loading = inject(LoadingService);
  loading.start();
  // finalize runs on success, error, AND cancellation (e.g. switchMap unsubscribing).
  return next(req).pipe(finalize(() => loading.stop()));
};
```

```typescript
// error.interceptor.ts
import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SILENT_ERRORS } from './http-context';

function messageFor(error: HttpErrorResponse): string {
  if (error.status === 0) return "You seem to be offline. Check your connection and try again.";
  if (error.status >= 500) return 'The server had a problem. Please try again in a moment.';
  if (error.status === 403) return "You don't have permission to do that.";
  return 'Something went wrong with that request.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          auth.logout();
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        } else if (!req.context.get(SILENT_ERRORS)) {
          notifications.error(messageFor(error));
        }
      }
      // Re-throw so the calling service or component can still react.
      return throwError(() => error);
    }),
  );
};
```

```typescript
// app.ts: show the overlay from the root component
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingOverlay],
  template: `
    @if (loading.isLoading()) {
      <app-loading-overlay />
    }
    <router-outlet />
  `,
})
export class App {
  protected readonly loading = inject(LoadingService);
}
```

```typescript
// exercises.api.ts: the typeahead opts out of the overlay and the toasts
search(term: string): Observable<Exercise[]> {
  return this.http.get<Exercise[]>('api/exercises', {
    params: { filter: term },
    context: new HttpContext().set(SKIP_LOADER, true).set(SILENT_ERRORS, true),
  });
}
```

**Why this works:** every request shows the loader and reports failures without a single line in the services. The counter handles parallel requests correctly, and `finalize` also covers requests cancelled by `switchMap`. The typeahead uses `HttpContext` to opt out, which keeps the decision next to the call that needs it and sends nothing extra to the server.

### 3. Best-Practice Example: Telemetry, retries, a deliberate order, and tests

```typescript
// telemetry.interceptor.ts: opt-in timing for selected requests
import { inject } from '@angular/core';
import { HttpContextToken, HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { TelemetryService } from './telemetry.service';

export const TRACK_TIMING = new HttpContextToken<boolean>(() => false);

export const telemetryInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(TRACK_TIMING)) return next(req);

  const telemetry = inject(TelemetryService);
  const started = performance.now();
  let status = 0;

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) status = event.status;
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) status = error.status;
      },
    }),
    finalize(() =>
      telemetry.record({
        method: req.method,
        url: req.urlWithParams,
        status,
        durationMs: Math.round(performance.now() - started),
      }),
    ),
  );
};
```

```typescript
// retry.interceptor.ts: retry only safe requests and only transient failures
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrying a POST could create the same entry twice.
  if (req.method !== 'GET') return next(req);

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error: unknown, attempt) => {
        const transient =
          error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
        // Back off a little more each time; give up immediately on 4xx errors.
        return transient ? timer(attempt * 300) : throwError(() => error);
      },
    }),
  );
};
```

```typescript
// app.config.ts: the order is the design
provideHttpClient(
  withFetch(),
  withInterceptors([
    telemetryInterceptor, // outermost: times the whole round trip, retries included
    loadingInterceptor,   // one start/stop per call, even if it's retried
    errorInterceptor,     // only sees errors that survived the retries
    retryInterceptor,     // re-runs everything below it on each attempt
    baseUrlInterceptor,   // builds the final URL
    authInterceptor,      // innermost: reads the current token for every attempt
  ]),
);
```

```typescript
// auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from './api-base-url';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';
import { baseUrlInterceptor } from './base-url.interceptor';

describe('baseUrlInterceptor + authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://api.test' },
        { provide: AuthService, useValue: { token: signal('abc123') } },
        provideHttpClient(withInterceptors([baseUrlInterceptor, authInterceptor])),
        provideHttpClientTesting(), // must come after provideHttpClient
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify()); // fails if any request was left unanswered

  it('rewrites api/ URLs and attaches the token', () => {
    http.get('api/diary').subscribe();

    const request = controller.expectOne('https://api.test/diary');
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc123');
    request.flush({ items: [] });
  });

  it('leaves other URLs alone and never sends them the token', () => {
    http.get('content/course-manifest.json').subscribe();

    const request = controller.expectOne('content/course-manifest.json');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });
});
```

**Why this is best practice:** each interceptor does exactly one job, and the array documents how they combine. Telemetry and loading wrap retries, so a call that needed two attempts is timed once and shows the loader once. The error handler only reports real failures. Auth sits innermost, so every retry reads the current token. The tests exercise the real interceptors through a real `HttpClient`, with `HttpTestingController` standing in for the network.

## Common Mistakes

- **Mutating the request.** `HttpRequest` is immutable. Always pass `req.clone({...})` to `next()`.
- **Forgetting to return `next(req)`.** An interceptor that returns nothing, or a new `Observable` that never calls `next`, silently blocks every request.
- **A boolean loading flag.** Parallel requests turn it off too early. Count pending requests instead.
- **Swallowing errors.** Returning `EMPTY` or `of(null)` from `catchError` hides failures from the caller. Re-throw unless the interceptor fully handles the situation.
- **Retrying non-idempotent requests.** Retrying a `POST` can create duplicates. Retry `GET` (and other safe methods) on transient errors only.
- **Sending the token everywhere.** Attaching `Authorization` to every URL leaks it to third-party APIs and CDNs. Check the host first.
- **Rewriting every relative URL.** A base-URL interceptor that touches all relative paths will also redirect asset and content requests. This portal loads its lessons with relative URLs like `content/course-manifest.json`, which must not go to an API server.
- **Using custom headers as switches.** Headers like `X-LOADING` are sent to the server and can trigger CORS preflights. Use `HttpContextToken`.
- **Not thinking about order.** An error toast placed after a retry interceptor fires on every failed attempt, not just the final one.
- **Calling `inject()` inside an RxJS callback.** Call `inject()` at the top of the interceptor function, where the injection context exists, and use the result inside operators.

## Best Practices

- Use functional interceptors with `withInterceptors([...])`, and keep the array in `app.config.ts` with a comment explaining the order.
- Give each interceptor one responsibility and a name that says what it does.
- Clone requests with `setHeaders`, `url`, or `params`, never mutate them.
- Use `HttpContextToken` for per-request options, with safe defaults.
- Track loading with a counter and stop it in `finalize`, so cancellations are counted too.
- Re-throw errors after handling cross-cutting concerns like logout or toasts, so callers can still react.
- Retry only idempotent requests and only transient failures, with a small backoff.
- Test interceptors through `HttpClient` with `provideHttpClient(withInterceptors([...]))`, `provideHttpClientTesting()`, and `HttpTestingController.verify()`.

## Summary

- Interceptors put cross-cutting HTTP behavior (auth, base URL, loading, errors, telemetry, retries) in one place instead of every service.
- A functional interceptor is `(req, next) => next(req)`. It can change the request, watch the response stream, or short-circuit.
- Requests run through interceptors in array order, and responses come back in reverse, so order is a design decision.
- Requests are immutable: use `req.clone()`.
- `HttpContextToken` lets individual calls opt in or out without sending anything to the server.
- Count pending requests for loaders, re-throw errors after handling them, and retry only safe, transient failures.
- Test interceptors with a real `HttpClient` and `HttpTestingController`.

## Flash Cards

**Q: In `withInterceptors([a, b, c])`, in what order do the interceptors see the response?**
A: In reverse: `c`, then `b`, then `a`. Requests go forwards through the array, responses come back backwards.

**Q: Why must you use `req.clone()` instead of changing the request directly?**
A: `HttpRequest` is immutable. Cloning creates a modified copy and keeps the original intact, which is also what makes retries safe.

**Q: Why use a counter instead of a boolean for a global loading indicator?**
A: With parallel requests, the first one to finish would set the boolean to `false` while others are still running. A counter only reaches zero when every request is done.

**Q: What's the advantage of `HttpContextToken` over a custom header like `X-SKIP-LOADER`?**
A: Context values stay in the browser and are only read by interceptors. Custom headers are sent to the server, can leak implementation details, and can trigger CORS preflight requests.

**Q: Why shouldn't a retry interceptor retry `POST` requests by default?**
A: `POST` usually isn't idempotent. If the first attempt reached the server but the response was lost, retrying could create a duplicate record.

## Exercises

**Easy**
Write a `timezoneInterceptor` that adds an `X-Timezone` header with `Intl.DateTimeFormat().resolvedOptions().timeZone` to every request going to your API (and no others). Register it and check the header in the browser's Network tab.

**Medium**
Build the `loadingInterceptor` and `LoadingService` from Example 2, plus a `SKIP_LOADER` context token. Write a test that fires two requests, flushes one, and asserts `isLoading()` is still `true` until the second is flushed. Then add a typeahead search that opts out of the loader.

**Challenging**
Write a `cacheInterceptor` that short-circuits repeated `GET` requests marked with a `CACHE_FOR_MS` context token, returning a cached `HttpResponse` (with `of(response.clone())`) while it's fresh. Make sure it never caches errors or non-`GET` requests, decide where it belongs in the interceptor order (before or after telemetry and loading?), and justify the choice in a comment. Cover the cache hit, cache expiry, and error cases with `HttpTestingController` tests.

## Further Reading

- [Angular: Interceptors](https://angular.dev/guide/http/interceptors)
- [Angular: Making HTTP requests (HttpContext)](https://angular.dev/guide/http/making-requests)
- [Angular: Testing requests](https://angular.dev/guide/http/testing)
- [`HttpInterceptorFn` API reference](https://angular.dev/api/common/http/HttpInterceptorFn)
- [`withInterceptors` API reference](https://angular.dev/api/common/http/withInterceptors)
- [RxJS `retry` operator](https://rxjs.dev/api/index/function/retry)
- [Refactoring Guru: Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility)

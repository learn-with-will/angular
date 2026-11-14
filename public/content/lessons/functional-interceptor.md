---
slug: functional-interceptor
title: "Writing a functional interceptor"
topic: http
kind: api
summary: "An interceptor is a function, requests are immutable, and every change is a clone."
tags: [http, interceptors, clone, immutability]
related: [interceptor-pipeline, interceptor-order, pitfall-token-leak, inject-function]
---
> **In one line:** An `HttpInterceptorFn` takes the request and `next`. Because requests are immutable, you change one by passing `req.clone({...})` to `next`.

## The idea

A modern interceptor is a plain function. It receives an `HttpRequest` and a `next` handler, and returns the Observable of events. Angular runs it in an **injection context**, so `inject()` works at the top of the function.

Requests are **immutable**: `req.url = '...'` and `req.headers.append(...)` do not work. You create a modified copy instead, and the original stays untouched. That immutability is what makes retries safe, because the first request can be sent again unchanged.

| You want to | Clone with |
|---|---|
| add an auth header | `req.clone({ setHeaders: { Authorization: ... } })` |
| rewrite the URL | `req.clone({ url: newUrl })` |
| add a query parameter | `req.clone({ setParams: { v: '2' } })` |

## See it

```typescript
const API_PREFIX = 'api/';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only rewrite our own API calls; assets and absolute URLs pass through
  if (!req.url.startsWith(API_PREFIX)) return next(req);

  const baseUrl = inject(API_BASE_URL);
  return next(req.clone({ url: `${baseUrl}/${req.url.slice(API_PREFIX.length)}` }));
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();   // a signal; null when signed out
  return token
    ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
    : next(req);
};
```

Services now call `this.http.get('api/diary')`, with no host and no headers.

## Go deeper

`next(req)` can emit several events for one request: `Sent`, upload progress and finally the `Response`. When you only care about the result, check `event.type === HttpEventType.Response`, or `event instanceof HttpResponse`.

Call `inject()` at the **top** of the interceptor function, not inside an RxJS callback. The injection context exists only during the synchronous part, so a later `inject()` throws. Read the service first, then use it inside operators.

Class-based interceptors implementing `HttpInterceptor` still work through `withInterceptorsFromDi()`, but functions are shorter, tree-shakable and make order explicit in one array.

Moving to a new API host is now a one-line change to the `API_BASE_URL` token, and a new endpoint is authorised automatically.

A tiny interceptor can also fix up *responses*. Because `next(req)` returns an Observable, `map` can reshape the data before any service sees it, for example unwrapping an envelope that every endpoint returns:

```typescript
export const unwrapInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map((event) => (event instanceof HttpResponse && event.body?.data ? event.clone({ body: event.body.data }) : event)),
  );
```

Responses are immutable too, so you clone them with a new body. Use this sparingly: hiding a transformation in an interceptor can surprise people reading a service, so reserve it for conventions that truly apply to every endpoint.

## Watch out

- Mutating the request instead of cloning it.
- Rewriting every relative URL. Lesson files and assets use relative paths that must not go to the API.
- Calling `inject()` inside an operator callback.

## Remember

- An interceptor is `(req, next) => next(req)`, run in an injection context.
- Requests are immutable; change them with `clone`.
- Inject at the top, and filter to your own URLs.

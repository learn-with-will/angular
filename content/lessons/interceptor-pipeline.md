---
slug: interceptor-pipeline
title: "The interceptor pipeline"
topic: http
kind: pattern
summary: "Handle cross-cutting request concerns once, in a chain that every request and response passes through."
tags: [http, interceptors, pipeline, cross-cutting]
related: [functional-interceptor, interceptor-order, http-context, http-client-setup]
---
> **In one line:** Interceptors sit between your services and the network. Requests flow through them in order, and responses return through the same chain in reverse.

## The idea

Nearly every request needs the same extras: attach the token, point at the right host, show a loader, report failures, measure time. Doing that inside each service method means somebody forgets the token on a new endpoint, the spinner works on half the screens, and changing the host edits twenty files.

These are **cross-cutting concerns**: they cut across every feature and belong to none. An interceptor handles one of them in one place. Services stay focused on *what* to fetch.

```sequence
actor svc: Service
actor a: Interceptor A
actor b: Interceptor B
actor net: Server
svc -> a: request
a -> b: request
b -> net: request
net --> b: response
b --> a: response
a --> svc: response
```

Each interceptor can do one of three things:

| It can | Example |
|---|---|
| change the request before passing it on | add a header, rewrite the URL |
| watch or change the response on the way back | show a toast, record timing, retry |
| short-circuit by not calling `next()` | answer from a cache |

This is the *chain of responsibility* pattern: every link does one job and hands off to the next.

## See it

```typescript
export const timingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();
  return next(req).pipe(
    finalize(() => console.log(req.method, req.url, Math.round(performance.now() - started), 'ms')),
  );
};

// app.config.ts
provideHttpClient(withInterceptors([timingInterceptor]));
```

`next(req)` forwards the request and returns the Observable of events, which you can pipe like any other stream.

## Go deeper

Because the response travels back through the same chain, an interceptor placed *early* sees the whole round trip, and one placed *late* sees the final request just before it is sent. That position is a design decision, explored in the order lesson.

An interceptor that never calls `next()` and never returns a response blocks every request quietly. If something returns an Observable that never emits, requests hang with no error.

Interceptors apply to every `HttpClient` call, including those made by libraries that use the same client. Keep them selective: check the URL or an `HttpContext` flag before acting, so you do not touch requests that are not yours.

Interceptors are also the natural home for **caching** by short-circuit. A GET interceptor can return `of(new HttpResponse({ status: 200, body: cached }))` for a recent identical request and never call `next()`, so the request does not reach the network:

```typescript
const cache = new Map<string, HttpResponse<unknown>>();

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const hit = req.method === 'GET' ? cache.get(req.urlWithParams) : undefined;
  return hit
    ? of(hit.clone())
    : next(req).pipe(tap((e) => e instanceof HttpResponse && req.method === 'GET' && cache.set(req.urlWithParams, e)));
};
```

A real cache needs expiry and invalidation on writes, but the shape shows how an interceptor can answer without a network call.

## Watch out

- Putting auth, host or loader logic in each service method.
- Forgetting to return `next(req)`, which stalls every request.
- Acting on all URLs when you meant only your own API.

## Remember

- Interceptors form a chain; responses return in reverse.
- Each does one cross-cutting job, with `next(req)` to continue.
- They can modify, observe or short-circuit.

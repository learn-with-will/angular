---
slug: http-context
title: "HttpContext: per-request options"
topic: http
kind: api
summary: "Tell interceptors how to treat one request, without inventing headers that leak to the server."
tags: [http, interceptors, httpcontext, options]
related: [interceptor-pipeline, loading-error-interceptors, http-params-headers, injection-token]
---
> **In one line:** An `HttpContextToken` carries a per-request option that interceptors can read. It never leaves the browser, unlike a custom header.

## The idea

Interceptors apply to everything, but some requests are exceptions. A typeahead search should not flash a full-screen loader, and a background poll should not pop an error toast. The caller knows; the interceptor does not.

The tempting fix is a custom header such as `X-SKIP-LOADER: true`. It works, and it causes two problems: the header is **sent to the server**, and a non-standard header can trigger an extra CORS preflight request.

`HttpContext` solves both. It is metadata attached to the request object that interceptors can read and the network never sees.

| Approach | Reaches the server? | Extra CORS preflight? |
|---|---|---|
| custom header | yes | possibly |
| `HttpContext` token | no | no |

## See it

```typescript
// Declare a token with a safe default
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);
```

```typescript
// The caller opts out, right where the decision belongs
search(term: string): Observable<Exercise[]> {
  return this.http.get<Exercise[]>('api/exercises', {
    params: { filter: term },
    context: new HttpContext().set(SKIP_LOADER, true).set(SILENT_ERRORS, true),
  });
}
```

```typescript
// The interceptor reads it
export const loadingInterceptor: HttpInterceptorFn = (req, next) =>
  req.context.get(SKIP_LOADER) ? next(req) : trackLoading(next(req));
```

## Go deeper

The token's *default* matters. `new HttpContextToken(() => false)` means every request that does not mention the token gets `false`, so existing calls behave as before and only the ones that opt in change.

Context survives `req.clone(...)`, so interceptors later in the chain still see the values an earlier one read.

Tokens are keys, like injection tokens: define them in a small shared file, export them, and import the same instance on both sides. Two separate `new HttpContextToken` objects are different keys, even with the same name.

Keep the set of tokens small. If a request needs five flags, that is a sign the behaviour should be a different service method.

Interceptors can also *write* to the context to talk to each other. An early interceptor might generate a correlation id and store it with `req.context.set(REQUEST_ID, crypto.randomUUID())`; a later logging interceptor reads the same value. Because the context object travels with the request through every `clone`, the value is shared without touching any header.

Prefer tokens over magic strings for the same reason you prefer injection tokens over string keys: the compiler checks them, the default is declared once, and a rename updates every usage.

## Watch out

- Using headers such as `X-LOADING` as switches.
- Creating the token twice, so caller and interceptor disagree.
- Defaulting to `true`, which changes every existing call.

## Remember

- `HttpContext` is per-request metadata that stays in the browser.
- Declare tokens with safe defaults; set them with `.set(token, value)`.
- Interceptors read with `req.context.get(token)`.

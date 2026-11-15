---
slug: http-client-setup
title: "Setting up HttpClient"
topic: http
kind: api
summary: "Register HttpClient once with provideHttpClient, and inject it into a service."
tags: [http, httpclient, provider, setup]
related: [http-verbs, data-service, http-cold-requests, inject-function]
---
> **In one line:** `HttpClient` is not available until you call `provideHttpClient()` once in the app config. After that, any service can `inject(HttpClient)`.

## The idea

Almost every app reads and writes data on a server. The browser's raw `fetch()` works, but each component would then repeat the same chores: building URLs, parsing JSON, adding headers, handling errors and cancelling requests nobody needs any more.

`HttpClient` wraps those chores in a small typed API that returns **Observables**. That means requests plug straight into RxJS operators, the `async` pipe, `toSignal()`, interceptors and Angular's testing tools.

Registration happens at the application level, with *features* that switch behaviours on:

| Feature | What it adds |
|---|---|
| `withFetch()` | use the browser's Fetch API under the hood (good for SSR) |
| `withInterceptors([...])` | functional interceptors, in order |
| `withInterceptorsFromDi()` | legacy class-based interceptors |
| `withXsrfConfiguration()` | customise XSRF cookie and header names |

On Angular 20 and 21 you add `withFetch()` yourself. From Angular 22 Fetch is the default and `withFetch()` is deprecated; use `withXhr()` if you need upload progress events.

## See it

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
};
```

```typescript
@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

## Go deeper

If you forget the provider, injecting `HttpClient` fails with *No provider for HttpClient*. The fix is always the same line in `app.config.ts`, not a module import.

Provide it **once**, at the root. Providing it again lower in the tree creates a separate `HttpClient` with its own interceptor chain, which is a common reason an interceptor seems to be ignored on one screen. The same rule appeared with services: a second provider means a second instance.

In tests use `provideHttpClient()` followed by `provideHttpClientTesting()`, in that order, so requests are captured instead of sent.

Server-side rendering adds one more reason to keep the provider list explicit. With SSR the same app config runs on the server, where there is no XHR, so the Fetch-based backend is the one that works in both places. A feature such as `withFetch()` in a shared config is how a single code path serves browser and server.

If a service needs a client that bypasses the interceptors, for instance to call a token endpoint without recursion, inject `HttpBackend` and build a client with `new HttpClient(backend)`. That is an escape hatch to use rarely and document well, since it skips every cross-cutting rule you set up.

## Watch out

- Forgetting `provideHttpClient()` and getting *No provider for HttpClient*.
- Providing it a second time deeper in the tree, which silently drops root interceptors there.
- Passing both `withInterceptors` and `withInterceptorsFromDi` without meaning to mix styles.

## Remember

- Register `provideHttpClient(...)` once in `app.config.ts`.
- Features such as `withInterceptors` are arguments to it.
- Inject `HttpClient` in a service, not in a component.

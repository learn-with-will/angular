---
slug: http-transfer-cache
title: "The HTTP transfer cache"
topic: performance
kind: concept
summary: "Data fetched during SSR is embedded in the HTML, so the browser does not request it a second time."
tags: [performance, ssr, http, cache]
related: [hydration, ssr-render-modes, http-cold-requests, http-client-setup]
---
> **In one line:** `provideClientHydration()` includes a transfer cache. GET and HEAD responses fetched on the server travel inside the HTML, and `HttpClient` in the browser reuses them.

## The idea

Without help, a server-rendered page fetches its data on the server, and then the browser fetches the *same* data again during hydration. That doubles the load on your API and delays the moment the page is fully ready.

The transfer cache removes the duplicate. During SSR, responses to `GET` and `HEAD` requests are serialised into the page. When the browser-side `HttpClient` makes the same request, it finds the cached response and answers from it, with no network call.

```sequence
actor srv: Server render
actor api: API
actor html: HTML payload
actor br: Browser
srv -> api: GET `/api/products`
api --> srv: products
srv -> html: embed the response
html -> br: HTML plus cached data
note br: `HttpClient` finds it, no second request @green
```

## See it

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideClientHydration(
      withHttpTransferCacheOptions({
        includePostRequests: false,            // default: only GET and HEAD
        filter: (req) => !req.url.includes('/api/private'),
      }),
    ),
  ],
};
```

Nothing changes in services or components. They call `this.http.get(...)` as usual, and the cache is transparent.

## Go deeper

Not everything is cached. Requests that carry an `Authorization` header are excluded by default, because the response may be private to one user and must not be embedded in HTML that could be cached by a CDN. Use `withHttpTransferCacheOptions` to widen or narrow the rule, and be deliberate about anything user-specific.

The cache is for the **first load only**. After hydration completes, requests go to the network normally, so later navigation and refreshes get fresh data. It also depends on the browser asking for exactly the same request: the same URL, params and headers. A cache key mismatch, for example from a timestamp query parameter, means a second request is made.

Use `provideHttpClient(withFetch())` so the same HTTP backend runs on the server and in the browser. The data embedded in the page is visible in the HTML source, so treat it as public, and never include secrets in responses that are cached this way.

## Watch out

- Embedding user-specific data in HTML a CDN might cache.
- Query parameters that differ between server and browser, defeating the cache.
- Assuming the cache lasts after hydration.

## Remember

- SSR responses to GET and HEAD are embedded and reused by the browser.
- Authorised requests are excluded by default.
- It only covers the first load, and the HTML source shows the data.

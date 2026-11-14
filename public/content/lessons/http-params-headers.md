---
slug: http-params-headers
title: "Query parameters and headers"
topic: http
kind: api
summary: "Pass params and headers as options so Angular encodes values, instead of building strings by hand."
tags: [http, params, headers, observe]
related: [http-verbs, http-error-response, query-params, interceptor-pipeline]
---
> **In one line:** Put query parameters and headers in the options object. Angular encodes the values; string concatenation does not.

## The idea

A search request needs `?q=rope&page=2`. Building that with `'/api/products?q=' + term` works until someone searches for `rope & chain` or a term with a space, an accent or a `#`. The URL then breaks or, worse, means something else.

The options object handles it correctly:

| Option | Does | Example |
|---|---|---|
| `params` | appends encoded query parameters | `{ q: 'rope', page: 2 }` |
| `headers` | adds request headers | `{ 'X-Request-Source': 'catalog' }` |
| `observe: 'response'` | returns the whole response, not just the body | status, headers and body |
| `responseType` | how to parse the body | `'json'` (default), `'text'`, `'blob'` |
| `context` | per-request data for interceptors | see the HttpContext lesson |

Values may be strings, numbers or booleans, and arrays produce repeated keys, so `{ tag: ['a', 'b'] }` becomes `?tag=a&tag=b`.

## See it

```typescript
// Before: breaks on spaces, ampersands and unicode
this.http.get<Product[]>('/api/products?q=' + term + '&page=' + page);

// After: encoded for you
this.http.get<Product[]>('/api/products', {
  params: { q: term, page },
  headers: { 'X-Request-Source': 'catalog' },
});
```

```typescript
// Need the status code or a header too? Observe the whole response.
this.http
  .get<Product[]>('/api/products', { observe: 'response' })
  .subscribe((res) => {
    console.log(res.status, res.headers.get('X-Total-Count'));
    console.log(res.body); // Product[] | null
  });
```

## Go deeper

`params` also accepts an `HttpParams` instance, which is **immutable**: `params.set('q', 'x')` returns a *new* object, so ignoring the return value does nothing. The plain object form avoids this trap, so prefer it.

Skip `undefined` values rather than sending the string `"undefined"`. Build the object conditionally, or filter the entries first, before passing it.

Pagination metadata such as the total count often arrives in a header, such as `X-Total-Count`. That is the main reason to use `observe: 'response'`.

Headers that the browser treats as non-simple, such as a custom `X-...` header, can trigger a CORS preflight request, so do not add them casually.

Responses have a typed counterpart. `responseType: 'blob'` is how you download a file, and `'text'` suits plain-text endpoints. The default `'json'` parses for you, so a body that is not valid JSON, such as an HTML error page from a proxy, produces a parse error instead of a status error, which is a confusing failure worth recognising.

Pagination often needs both ideas together: send `page` and `size` as params, and read the total from a header on the full response. Keep that logic inside the data service so components receive a tidy `{ items, total }` value.

## Watch out

- Concatenating user input into the URL.
- Calling `HttpParams.set()` and discarding the result.
- Sending `undefined` values as the literal text `"undefined"`.

## Remember

- Use `params` and `headers` options, not string building.
- `observe: 'response'` gives status and headers as well as the body.
- `HttpParams` is immutable; prefer a plain object.

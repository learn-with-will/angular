---
slug: http-verbs
title: "One method per HTTP verb"
topic: http
kind: api
summary: "get, post, put, patch and delete: what each does and what the type parameter really promises."
tags: [http, httpclient, rest, types]
related: [http-client-setup, http-params-headers, data-service, http-cold-requests]
---
> **In one line:** `HttpClient` has one method per verb. The generic you write, such as `get<Product[]>`, is a promise to the compiler, not a runtime check.

## The idea

REST APIs map actions onto HTTP verbs. `HttpClient` mirrors that one to one, so the code reads like the API documentation:

| Method | Typical use | Example |
|---|---|---|
| `get<T>(url, options?)` | read data | `http.get<Product[]>('/api/products')` |
| `post<T>(url, body, options?)` | create something | `http.post<Product>('/api/products', draft)` |
| `put<T>(url, body, options?)` | replace something | `http.put<Product>('/api/products/7', product)` |
| `patch<T>(url, body, options?)` | change some fields | `http.patch<Product>('/api/products/7', { price: 25 })` |
| `delete<T>(url, options?)` | remove something | `http.delete<void>('/api/products/7')` |

Choose `put` when you send the *whole* record and `patch` when you send only what changed. Choosing correctly keeps requests small and avoids overwriting fields another user edited.

## See it

```typescript
@Injectable({ providedIn: 'root' })
export class TodosApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/todos';

  search(term: string, page = 1): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.url, { params: { q: term, page } });
  }

  create(title: string): Observable<Todo> {
    return this.http.post<Todo>(this.url, { title, done: false });
  }

  toggle(todo: Todo): Observable<Todo> {
    return this.http.patch<Todo>(`${this.url}/${todo.id}`, { done: !todo.done });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

Each method returns the Observable and lets the caller decide when it runs.

## Go deeper

The type parameter changes nothing at runtime. `get<Product[]>()` does not check that the server really sent products, so if the backend returns something else, your code will fail later with a confusing error far from the cause. At trust boundaries, validate: a small type guard, or a schema library, before you use the data.

Keep the URL in one place. A private `url` field means a renamed endpoint is a single-line change, and callers never build paths themselves.

Two details separate a tidy API from a surprising one. First, create calls usually return the *saved* record, including the server-assigned `id` and timestamps, so use the returned value to update the UI instead of the draft you sent. Second, `delete` and many updates can return `204 No Content`, so type them `Observable<void>` and do not read a body.

Idempotency is the quiet design rule behind the verbs. `get`, `put` and `delete` can be repeated safely; `post` generally cannot. That distinction decides what you may retry automatically, which a later lesson relies on.

## Watch out

- Treating `get<Product[]>()` as proof the data has that shape.
- Using `put` with a partial body, which can wipe fields on the server.
- Building the URL in components. Keep it inside the service.

## Remember

- One method per verb: `get`, `post`, `put`, `patch`, `delete`.
- `put` replaces, `patch` changes some fields.
- The generic is a compile-time promise, so validate untrusted data.

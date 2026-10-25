---
title: "HttpClient Fundamentals: Talking to a REST API"
level: "intermediate"
estimatedTime: 45
tags:
  - http
  - httpclient
  - rest
  - httpresource
  - signals
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Register `HttpClient` with `provideHttpClient()` and inject it into a data service.
- Send typed `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests, with query parameters and headers.
- Handle failed requests with `HttpErrorResponse`, including network and CORS failures.
- Explain why HTTP observables are *cold* and what that means for duplicate requests.
- Avoid CORS problems during development with the Angular dev-server proxy.
- Load data as signals with `httpResource()`.

## Why This Concept Exists

Almost every Angular app reads and writes data on a server: products, orders, user profiles. The browser's raw `fetch()` works, but every component would then repeat the same chores: building URLs and query strings, parsing JSON, adding headers, handling errors, and cancelling requests that are no longer needed.

Angular's **`HttpClient`** wraps all of that in a small, typed API that returns **Observables**, so requests plug straight into RxJS operators (`switchMap`, `retry`, `catchError`), the `async` pipe, `toSignal()`, interceptors, and Angular's testing tools. Putting those calls in a **data service** keeps components focused on displaying data, and gives you one place to change when an endpoint changes.

## Concept Explanation

### Registering and injecting `HttpClient`

`HttpClient` is not available until you provide it once for the whole app:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withFetch())],
};
```

`withFetch()` makes `HttpClient` use the browser's Fetch API under the hood, which also works well with server-side rendering. On Angular 20 and 21 you add it yourself; since Angular 22, Fetch is the default and `withFetch()` is deprecated. After that, any service can `inject(HttpClient)`.

### One method per HTTP verb

| Method | Typical use | Example |
|---|---|---|
| `get<T>(url, options?)` | Read data | `http.get<Product[]>('/api/products')` |
| `post<T>(url, body, options?)` | Create something | `http.post<Product>('/api/products', newProduct)` |
| `put<T>(url, body, options?)` | Replace something | `http.put<Product>('/api/products/7', product)` |
| `patch<T>(url, body, options?)` | Change some fields | `http.patch<Product>('/api/products/7', { price: 25 })` |
| `delete<T>(url, options?)` | Remove something | `http.delete<void>('/api/products/7')` |

The type parameter (`<Product[]>`) tells TypeScript what you *expect* the server to send. It's a promise to the compiler, not a runtime check (see *TypeScript Patterns for Angular*).

### Query parameters and headers

Pass `params` and `headers` in the options object instead of building strings by hand. Angular encodes the values for you:

```typescript
http.get<Product[]>('/api/products', {
  params: { q: 'rope', page: 2 },           // → /api/products?q=rope&page=2
  headers: { 'X-Request-Source': 'catalog' },
});
```

For the full response (status code, headers) instead of just the body, add `observe: 'response'`.

### HTTP observables are cold

Nothing is sent when you call `http.get(...)`. The request starts when something **subscribes**: `.subscribe()`, the `async` pipe, or `toSignal()`. Every new subscription sends a **new request**, and unsubscribing before the response arrives cancels it. That's why `switchMap` can cancel stale searches, and why using the same observable twice in a template can send two requests.

### When things go wrong: `HttpErrorResponse`

A failed request arrives in the observable's error channel as an `HttpErrorResponse`:

- `status` is the HTTP status (`404`, `500`, …). A status of **`0`** means the request never got a response: the user is offline, the server is down, or the browser blocked it for CORS reasons.
- `error` holds the response body the server sent (often a JSON error object).
- `message` is a readable summary.

Handle errors where you can do something useful: show a message in the component, fall back to cached data, or let an interceptor deal with cross-cutting cases such as `401` (see *The Interceptor Pattern*).

### CORS and the dev-server proxy

Browsers block a page on `http://localhost:4200` from reading responses from another origin, such as `http://localhost:3000`, unless that server explicitly allows it with CORS headers. During development, the simplest fix is to let the Angular dev server forward API calls for you:

```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

Run `ng serve --proxy-config proxy.conf.json` (or add `"proxyConfig": "proxy.conf.json"` to the `serve` options in `angular.json`). The app calls `/api/products` on its own origin, and the dev server passes the request to port 3000. In production, configure the real server (or a reverse proxy) instead.

### Loading data as signals: `httpResource()`

For **reading** data, Angular also offers `httpResource()`. You give it a function that returns a URL (or a request object). It makes the request, exposes the result as signals, and **re-fetches automatically** when signals used in that function change:

```typescript
readonly productId = input.required<string>();
readonly product = httpResource<Product>(() => `/api/products/${this.productId()}`);
// product.value(), product.isLoading(), product.error(), product.reload()
```

If the function returns `undefined`, no request is sent, which is handy while a required value isn't available yet. `httpResource()` was experimental in Angular 19 and 20 and is stable since Angular 22. Use it for reads; keep writes (`post`, `put`, `delete`) as `HttpClient` calls in your service.

## Key Terminology

| Term | Meaning |
|---|---|
| **`HttpClient`** | Angular's service for making HTTP requests; every method returns an Observable. |
| **`provideHttpClient()`** | The app-level provider that makes `HttpClient` injectable; features like `withFetch()` and `withInterceptors()` are passed to it. |
| **Data service** | An injectable class that wraps the HTTP calls for one resource, so components never build URLs themselves. |
| **Cold observable** | An observable that starts its work only when subscribed; each subscription sends its own request. |
| **`HttpErrorResponse`** | The error object for failed requests; `status` is `0` when no response was received. |
| **CORS** | The browser rule that blocks reading cross-origin responses unless the server allows it. |
| **Dev-server proxy** | `ng serve` forwarding of API paths to another server, avoiding CORS during development. |
| **`httpResource()`** | A signal-based way to load data over HTTP that re-fetches when its signals change. |

## Syntax Overview

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  list(search = '') {
    return this.http.get<Product[]>('/api/products', { params: { q: search } });
  }

  create(product: NewProduct) {
    return this.http.post<Product>('/api/products', product);
  }

  remove(id: number) {
    return this.http.delete<void>(`/api/products/${id}`);
  }
}

// Reading the full response instead of just the body
http.get<Product[]>('/api/products', { observe: 'response' }); // Observable<HttpResponse<Product[]>>

// Signal-based read inside a component or service
const products = httpResource<Product[]>(() => '/api/products');
```

## Real World Analogy

Think of `HttpClient` as a restaurant's **order slip system**.

- A data service is the **waiter**. Customers (components) say what they want; the waiter knows how to write the slip for the kitchen (the URL, parameters, and headers).
- Writing a slip doesn't cook anything. The kitchen starts only when the slip is handed in (**subscribe**), and handing in two identical slips gets you two meals (**cold observables**). Tearing up a slip before the food is ready cancels it (**unsubscribe**).
- When the kitchen is out of an ingredient, the waiter comes back with a note explaining what went wrong (**`HttpErrorResponse`**); if the kitchen is unreachable, there's no note at all (status `0`).
- `httpResource()` is a **standing order**: "keep my table supplied with today's special". Whenever the special changes, a fresh plate arrives without anyone writing a new slip.

## Examples

### 1. Basic Example — A typed GET in a data service

```typescript
// product.model.ts
export interface Product {
  id: number;
  name: string;
  price: number;
}
```

```typescript
// products-api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

```typescript
// product-list.ts
import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductsApi } from './products-api';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe],
  template: `
    <ul>
      @for (product of products(); track product.id) {
        <li>{{ product.name }} — {{ product.price | currency }}</li>
      } @empty {
        <li>No products yet.</li>
      }
    </ul>
  `,
})
export class ProductList {
  private readonly api = inject(ProductsApi);

  // toSignal() subscribes (which sends the request) and unsubscribes when the component is destroyed.
  protected readonly products = toSignal(this.api.list(), { initialValue: [] });
}
```

**What's happening:** the service owns the URL and the response type, and the component only asks for "the products". `toSignal()` subscribes once, so exactly one request is sent, and the template reads a signal. Remember to register `provideHttpClient()` in `app.config.ts`, or injecting `HttpClient` fails with *No provider for HttpClient*.

### 2. Real-World Example — Searching, creating, and deleting with error handling

```typescript
// todos-api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

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

```typescript
// todo-page.ts
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Todo, TodosApi } from './todos-api';

function messageFor(error: HttpErrorResponse): string {
  if (error.status === 0) return 'Cannot reach the server. Check your connection.';
  if (error.status === 404) return 'That item no longer exists.';
  return `The server said: ${error.message}`;
}

@Component({
  selector: 'app-todo-page',
  template: `
    <form (submit)="add(title.value); title.value = ''; $event.preventDefault()">
      <input #title placeholder="New todo" />
      <button type="submit">Add</button>
    </form>

    @if (error(); as message) {
      <p role="alert">{{ message }}</p>
    }

    <ul>
      @for (todo of todos(); track todo.id) {
        <li>
          <label>
            <input type="checkbox" [checked]="todo.done" (change)="toggle(todo)" />
            {{ todo.title }}
          </label>
          <button type="button" (click)="remove(todo.id)">Delete</button>
        </li>
      }
    </ul>
  `,
})
export class TodoPage {
  private readonly api = inject(TodosApi);

  protected readonly todos = signal<Todo[]>([]);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.api.search('').subscribe({
      next: (todos) => this.todos.set(todos),
      error: (err: HttpErrorResponse) => this.error.set(messageFor(err)),
    });
  }

  add(title: string): void {
    if (!title.trim()) return;
    this.api.create(title.trim()).subscribe({
      next: (created) => this.todos.update((list) => [...list, created]),
      error: (err: HttpErrorResponse) => this.error.set(messageFor(err)),
    });
  }

  toggle(todo: Todo): void {
    this.api.toggle(todo).subscribe({
      next: (saved) => this.todos.update((list) => list.map((t) => (t.id === saved.id ? saved : t))),
      error: (err: HttpErrorResponse) => this.error.set(messageFor(err)),
    });
  }

  remove(id: number): void {
    this.api.remove(id).subscribe({
      next: () => this.todos.update((list) => list.filter((t) => t.id !== id)),
      error: (err: HttpErrorResponse) => this.error.set(messageFor(err)),
    });
  }
}
```

**What's happening:**
- `params: { q: term, page }` builds the query string, encoding values safely.
- Each method returns the observable and lets the caller subscribe, so the caller decides when the request runs. HTTP observables complete after one response, so these subscriptions don't need manual cleanup.
- State lives in signals, so the view updates when responses arrive, including in zoneless apps.
- `messageFor()` turns `HttpErrorResponse` into a message users can act on, with a separate case for status `0`.
- In a larger app you'd move this state into a facade service (see *Singleton Services & the Facade Pattern*) and handle `401` responses in an interceptor.

### 3. Best-Practice Example — A product page with `httpResource()`

The detail page loads the product whose id is in the URL (via component input binding), shows loading and error states, and offers a retry button. There is no `subscribe()` at all.

```typescript
// product-page.ts
import { Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Product } from './product.model';

@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe],
  template: `
    @if (product.isLoading()) {
      <p>Loading…</p>
    } @else if (product.error()) {
      <p role="alert">We couldn't load this product.</p>
      <button type="button" (click)="product.reload()">Try again</button>
    } @else if (product.value(); as p) {
      <h1>{{ p.name }}</h1>
      <p>{{ p.price | currency }}</p>
    }
  `,
})
export class ProductPage {
  // Bound from the route ':id' with withComponentInputBinding().
  readonly id = input.required<string>();

  // Re-fetches automatically whenever id() changes, e.g. navigating from /products/1 to /products/2.
  protected readonly product = httpResource<Product>(() => `/api/products/${this.id()}`);
}
```

**Why this is best practice:**
- The request is *derived* from a signal, so navigating between products re-fetches without `ActivatedRoute`, `switchMap`, or manual cleanup. A newer request replaces an older one that is still in flight.
- `isLoading()`, `error()`, and `value()` are signals the template can read directly, which keeps the component tiny and works with `OnPush` and zoneless change detection.
- `reload()` retries the same request on demand.
- Writes still go through `HttpClient` methods in a service; `httpResource()` is for reading.

## Common Mistakes

1. **Forgetting `provideHttpClient()`.** Injecting `HttpClient` then fails with *No provider for HttpClient*. Register it once in `app.config.ts`.
2. **Calling `http.get()` and never subscribing.** Nothing happens: HTTP observables are cold. Subscribe, use the `async` pipe, `toSignal()`, or `httpResource()`.
3. **Subscribing twice by accident.** Two `| async` pipes on the same observable, or a `subscribe()` in a component plus another in the service, send two requests. Subscribe once and share the result (a signal, or `shareReplay` as shown in *Advanced RxJS Operators*).
4. **Building query strings by hand.** `'/api/products?q=' + term` breaks on spaces and special characters. Use the `params` option.
5. **Trusting the generic type.** `get<Product[]>()` doesn't validate the response. If the backend can send something else, check it at the boundary.
6. **Treating status `0` like a server error.** It means no response arrived (offline, server down, or blocked by CORS). Show a connection message, and check the browser console for CORS errors.
7. **Fixing CORS in Angular.** CORS is enforced by the browser and allowed by the server. Use the dev-server proxy locally and configure the server in production; there is no Angular setting that bypasses it.

## Best Practices

- Keep HTTP calls in a data service per resource; components shouldn't know URLs.
- Return observables from services and let the caller subscribe (or convert them with `toSignal()`/`httpResource()`).
- Type every request (`get<Product[]>`), and treat the type as a contract with the backend that may still need checking.
- Use `params` and `headers` options instead of string concatenation.
- Store results in signals so views update in zoneless apps and under `OnPush`.
- Handle errors where you can act on them, and put cross-cutting handling (auth, logging, retries) in interceptors.
- Prefer `httpResource()` for data that depends on signals (route inputs, filters); use `HttpClient` methods for writes.
- Use the dev-server proxy (`proxy.conf.json`) instead of CORS workarounds during development.

## Summary

- Register `HttpClient` once with `provideHttpClient()` (plus `withFetch()` on Angular 20–21), then `inject(HttpClient)` in services.
- `get`, `post`, `put`, `patch`, and `delete` return typed observables; pass `params` and `headers` in the options object.
- HTTP observables are cold: each subscription sends a request, and unsubscribing cancels it.
- Failed requests produce an `HttpErrorResponse`; status `0` means no response (offline, server down, or CORS).
- The dev-server proxy avoids CORS problems during development.
- `httpResource()` loads data as signals and re-fetches when its signal dependencies change; it is stable since Angular 22.

## Flash Cards

**Q: What must you add before any component or service can inject `HttpClient`?**
A: `provideHttpClient()` in the application's providers (usually in `app.config.ts`).

**Q: When does `http.get('/api/products')` actually send the request?**
A: When something subscribes to the returned observable (a `subscribe()` call, the `async` pipe, or `toSignal()`). Each subscription sends a new request.

**Q: What does an `HttpErrorResponse` with `status === 0` usually mean?**
A: No response was received: the user is offline, the server is unreachable, or the browser blocked the response because of CORS.

**Q: How do you send `?q=rope&page=2` without building the string yourself?**
A: Pass `{ params: { q: 'rope', page: 2 } }` as the request options; Angular encodes and appends them.

**Q: An `httpResource()` builds its URL from `id()`. What happens when `id()` changes?**
A: It sends a new request for the new URL and updates its `value()`, `isLoading()`, and `error()` signals.

## Exercises

**Easy:** Create a `UsersApi` service with a typed `list()` method for `GET /api/users`, and show the users in a component using `toSignal()` with an empty-array initial value. Add `provideHttpClient(withFetch())` to the app config.

**Medium:** Add `search(term: string, page: number)` to `UsersApi` using the `params` option. Build a search box that calls it as the user types (use `toObservable()`, `debounceTime()`, and `switchMap()`), and show "Cannot reach the server" when the error status is `0`.

**Challenging:** Set up a `proxy.conf.json` that forwards `/api` to a local JSON server on port 3000. Build a user detail page that reads the `:id` route parameter as an input and loads the user with `httpResource()`. Show loading, error (with a retry button calling `reload()`), and loaded states. Then add an "Edit name" form that saves with `http.patch()` and calls `reload()` after a successful save.

## Further Reading

- [Angular — HTTP client overview](https://angular.dev/guide/http)
- [Angular — Setting up `HttpClient`](https://angular.dev/guide/http/setup)
- [Angular — Making requests](https://angular.dev/guide/http/making-requests)
- [Angular — Reactive data fetching with `httpResource`](https://angular.dev/guide/http/http-resource)
- [Angular — Proxying to a backend server](https://angular.dev/tools/cli/serve#proxying-to-a-backend-server)
- [MDN — Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)

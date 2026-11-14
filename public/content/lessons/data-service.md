---
slug: data-service
title: "A data service per resource"
topic: http
kind: pattern
summary: "Keep URLs, types and request details in a service so components only ask for data."
tags: [http, services, architecture, separation]
related: [http-verbs, http-cold-requests, http-resource, injectable-service]
---
> **In one line:** One service per resource owns the URLs and response types. Components ask for "the products" and never know an endpoint exists.

## The idea

When components call `HttpClient` directly, URLs spread across the app, response types are redeclared, and changing an endpoint means a search-and-replace. A **data service** gathers all of that behind a small, meaningful API.

| Concern | Lives in |
|---|---|
| URLs, params, headers, response types | the data service |
| Showing data, handling clicks | the component |
| Auth, logging, retries, base URL | interceptors |
| Shared state across screens | a facade (see the facade pattern) |

The service returns Observables and lets the caller decide when and how to subscribe. That keeps the service free of UI concerns, and keeps it easy to test with a stub.

## See it

```typescript
export interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  list(search = ''): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products', { params: { q: search } });
  }

  create(draft: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>('/api/products', draft);
  }
}
```

```typescript
export class ProductList {
  private readonly api = inject(ProductsApi);
  protected readonly products = toSignal(this.api.list(), { initialValue: [] });
}
```

## Go deeper

Name methods after intent, not HTTP: `list`, `create`, `remove`, `markAsDone`. If the backend later moves from PATCH to a dedicated endpoint, only the service changes.

Types are a contract with a backend that can still surprise you. When the data crosses a trust boundary, map it into your own model in the service, for example `map((dto) => toProduct(dto))`. Components then depend on *your* shape, not the server's, and a renamed field is fixed in one place.

Do not store state in the data service. A service that both fetches and caches grows into a store; split it, with the data service staying a thin gateway and a facade owning state.

Use a `readonly url` field, or an `API_BASE_URL` injection token plus a base-URL interceptor, so environments differ in configuration rather than code.

## Watch out

- Calling `HttpClient` from components.
- Returning `any`, or leaking raw DTOs into every component.
- Mixing fetching and long-lived state in the same class.

## Remember

- One service per resource, intent-named methods, typed results.
- Return Observables; let the caller subscribe or use `toSignal`.
- Map DTOs at the boundary, and keep state elsewhere.

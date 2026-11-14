---
slug: http-cold-requests
title: "Requests are cold"
topic: http
kind: concept
summary: "Nothing is sent until something subscribes, and every subscription sends another request."
tags: [http, observables, subscribe, cold]
related: [http-verbs, data-service, http-resource, http-error-response]
---
> **In one line:** Calling `http.get(...)` only *describes* a request. It is sent when something subscribes, and each subscription sends its own.

## The idea

An `HttpClient` call returns a **cold** Observable. Think of it as a recipe, not a meal. Calling the method writes the recipe; subscribing cooks it. This explains three behaviours at once:

```sequence
actor view: Template
actor obs: `http.get()` Observable
actor net: Server
view -> obs: `subscribe` (1st)
obs -> net: GET `/api/products`
view -> obs: `subscribe` (2nd)
obs -> net: GET `/api/products` | a second request
view -> obs: `unsubscribe` early
note obs: Request cancelled @amber
```

| You do | Result |
|---|---|
| call `http.get()` and ignore it | nothing is sent |
| subscribe twice (two `\| async` pipes, say) | two requests |
| unsubscribe before the response | the request is cancelled |

That last row is why `switchMap` can cancel stale searches: replacing the inner Observable unsubscribes from the old one, and the browser aborts the old request.

## See it

```typescript
@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe],
  template: `
    @for (p of products(); track p.id) {
      <li>{{ p.name }}: {{ p.price | currency }}</li>
    } @empty {
      <li>No products yet.</li>
    }
  `,
})
export class ProductList {
  private readonly api = inject(ProductsApi);

  // toSignal subscribes once (sending exactly one request) and
  // unsubscribes when the component is destroyed
  protected readonly products = toSignal(this.api.list(), { initialValue: [] });
}
```

## Go deeper

The `async` pipe and `toSignal()` both subscribe for you, which is why they are the preferred ways to consume a request: there is no `subscribe()` to forget and no cleanup to write. HTTP Observables also complete after one response, so even a manual `subscribe()` does not leak.

To share one request between several consumers, convert it once, to a signal, and let every reader use the signal. Alternatively `shareReplay({ bufferSize: 1, refCount: true })` makes several subscribers share a single request.

For reads that depend on signals, such as a route id or a filter, `httpResource()` does the subscribing, cancelling and re-fetching itself, which the next lessons cover.

## Watch out

- Calling `http.get()` without subscribing and wondering why nothing happens in the network tab.
- Using two `| async` pipes on the same request and sending it twice.
- Subscribing in both a service and a component.

## Remember

- Cold means lazy: no subscriber, no request.
- Each subscription is a new request; unsubscribing cancels.
- Prefer `toSignal()` or the `async` pipe, and share results through a signal.

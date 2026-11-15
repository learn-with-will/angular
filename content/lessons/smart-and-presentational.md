---
slug: smart-and-presentational
title: "Smart and presentational components"
topic: components
kind: pattern
summary: "Split components into a few that own state and many that only display and report."
tags: [components, architecture, data-flow, testing]
related: [pitfall-mutating-inputs, pitfall-prop-drilling, input, output]
---
> **In one line:** Let a few **smart** components own state and side effects, and let many **presentational** ones just display what they are given and report what the user did.

## The idea

The first version of most screens is one big component: it fetches data, stores it, formats it, renders a list, handles every button and navigates. That works until you need the same list elsewhere, until a bug changes data "from somewhere", or until testing how a card *looks* requires mocking HTTP, the router and three services.

The pattern separates the jobs, and the difference is easy to see side by side:

| | Smart (container) | Presentational |
|---|---|---|
| Knows about | services, the router, the store | only its own inputs |
| Owns state | yes, it is the source of truth | no, apart from visual state like open or closed |
| Gets data from | services | `input()` |
| Reports actions by | calling services, navigating | emitting `output()` events |
| Typical examples | routed pages, feature shells | cards, lists, badges, form sections |
| Easy to test | needs mocked services | set inputs, check outputs |

Routed pages are usually smart. Most of what is inside them should be presentational. The flow is one-way: the smart component passes data **down** through inputs, children emit events **up**, the smart component updates its state, and the new state flows back down.

## See it

```typescript
// Presentational: inputs in, outputs out
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3>{{ product().name }}</h3>
    <button type="button" (click)="addToCart.emit(product())">Add to cart</button>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
}
```

```typescript
// Smart: injects services, owns the state
@Component({
  selector: 'app-products-page',
  imports: [ProductCard],
  template: `
    @for (p of products(); track p.id) {
      <app-product-card [product]="p" (addToCart)="cart.add($event)" />
    }
  `,
})
export class ProductsPage {
  protected readonly cart = inject(CartService);
  protected readonly products = toSignal(inject(ProductsService).list(), { initialValue: [] });
}
```

`ProductCard` has no idea where products come from or what "add to cart" does, so it can be reused on a search page or a wishlist unchanged.

## Go deeper

The payoff shows in tests. A presentational component needs no `HttpClient`, router or service mocks: set its inputs with `fixture.componentRef.setInput()`, subscribe to its outputs, and assert.

It is a guideline, not a law. Presentational components may keep **visual** state such as whether a dropdown is open; they just should not own business data. A tiny one-off widget can be both. The goal is a small number of components that know about the outside world, and a large number that do not.

Pair presentational components with `OnPush`: with signal inputs and immutable data it is both safe and fast.

## Watch out

- Injecting a service into a presentational component "just this once". As soon as a card injects `HttpClient` or the router, it stops being reusable and easy to test.
- Making every component smart. Several siblings that each fetch their own copy of the same data drift out of sync.
- Putting business rules in a presentational component. Formatting for display is fine; "a locked entry cannot be deleted" belongs in the smart component or a service.

## Remember

- Smart components own state and side effects; presentational ones take inputs and emit outputs.
- Data flows down, events flow up, and only one component writes the state.
- Keep most components presentational so they stay reusable and trivial to test.

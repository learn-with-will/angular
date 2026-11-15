---
slug: pitfall-stale-param-snapshot
title: "Pitfall: a stale route snapshot"
topic: routing
kind: pitfall
summary: "Angular reuses the component when only the parameter changes, so a one-time read goes stale."
tags: [routing, snapshot, component-reuse, bugs]
related: [activated-route, component-input-binding, ng-on-init, route-params]
---
> **In one line:** Going from `/products/1` to `/products/2` does not recreate the component. The same instance is reused, `ngOnInit` does not run again, and a snapshot read there shows the old product.

## The idea

It is the single most common bug with dynamic routes. Both URLs match the same route definition, so Angular sees no reason to destroy `ProductDetail` and build a new one. It keeps the instance and only changes the parameter underneath it.

If you read the id once in `ngOnInit()` using `route.snapshot`, that code ran for product 1 and never runs again. The screen keeps showing product 1 while the URL says 2.

```sequence
actor user: User
actor router: Router
actor page: `ProductDetail` | one instance @blue
user -> router: Goes to `/products/1`
router -> page: Creates it | `ngOnInit` reads id 1
user -> router: Goes to `/products/2`
router --> page: Reuses the same instance | only the param changed
note page: `ngOnInit` does not run again | still shows product 1 @red
```

The fix is to read the parameter in a way that reacts: an input from `withComponentInputBinding()`, the `paramMap` observable, or `toSignal`.

## See it

```typescript
// Before: read once, goes stale when the component is reused
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
  }
}

// After: an input that updates whenever the parameter does
export class ProductDetail {
  readonly id = input.required<string>();
  protected readonly title = computed(() => `Product #${this.id()}`);
}
```

With the input, `title` is recalculated when the route changes, with no hook and no stale value.

## Go deeper

The snapshot is not wrong in itself. It is correct when the component is destroyed and recreated for every navigation, for example when each URL has a different route definition. The trap is that a *dynamic* route looks like that case but is not.

You can confirm the diagnosis by logging in `ngOnInit`: click between two products and watch the log fire only once. That tells you the instance is being reused.

A last resort is a custom route reuse strategy that forces recreation, but it throws away a useful optimization. Reactive reading is almost always the better fix.

## Watch out

- Reading `snapshot` in `ngOnInit` for a route with parameters that can change while the component stays.
- Keeping the parameter in a plain field copied once. Derive from the signal input or the observable instead.
- Assuming "navigation means a new component". Same route, new parameter, same instance.

## Remember

- Same route with a new parameter reuses the component, and `ngOnInit` runs once.
- Read parameters reactively: signal input, `paramMap` or `toSignal`.
- A snapshot is fine only when the component is recreated each time.

---
slug: ng-on-init
title: "ngOnInit"
topic: components
kind: api
summary: "Run setup code once, after Angular has set the component's inputs."
tags: [components, lifecycle, initialization]
related: [lifecycle-overview, ng-on-changes, ng-on-destroy, input]
---
> **In one line:** `ngOnInit()` runs once, after the first `ngOnChanges`, when the inputs are set. It is the standard place for initialization that depends on them.

## The idea

A component's constructor runs when the class is created, which is before Angular has set any inputs. That makes it the right place to receive dependencies and set simple fields, and the wrong place for logic that needs input values.

`ngOnInit` fills that gap. Angular calls it exactly once, after the first round of input binding, so everything the parent passed in is available. Typical jobs are loading initial data, starting ongoing work such as a timer, and setting up local state that depends on an input.

| | `constructor` | `ngOnInit` |
|---|---|---|
| Runs | when the class is created | once, after inputs are set |
| Inputs available | no | yes |
| Good for | injecting services, simple field defaults | loading data, starting timers, input-dependent setup |

## See it

```typescript
@Component({
  selector: 'app-order-list',
  template: `
    @for (order of orders(); track order.id) {
      <p>{{ order.title }}</p>
    } @empty {
      <p>No orders yet.</p>
    }
  `,
})
export class OrderList implements OnInit {
  private readonly service = inject(OrderService);
  protected readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.service.list().subscribe(list => this.orders.set(list));
  }
}
```

The constructor stays empty because `inject()` already handled the dependency. The hook does the work that needs the component to be alive.

## Go deeper

Setup that starts something ongoing needs a matching teardown. If `ngOnInit` starts a timer or opens a long-lived subscription, `ngOnDestroy` (or `DestroyRef`) must stop it.

With signals you need `ngOnInit` less often. A value derived from an input is a `computed()`, and data from an Observable can become a signal with `toSignal()`, both declared as fields with no hook at all. `ngOnInit` is still the clear, conventional home for imperative setup, and it reads well to anyone who has seen Angular before.

## Watch out

- Putting data loading in the constructor. Inputs are not set yet, and a constructor with side effects is hard to test.
- Starting work in `ngOnInit` and never stopping it. Pair it with cleanup.
- Writing `ngOnInt` or another typo. Implement `OnInit` so the compiler catches it.

## Remember

- `ngOnInit` runs once, after the inputs are set.
- Use the constructor for injection, `ngOnInit` for input-dependent setup.
- Anything started in it needs a matching cleanup.

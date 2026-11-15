---
slug: ng-on-changes
title: "ngOnChanges"
topic: components
kind: api
summary: "React when a bound input receives a new value, and why a computed signal often replaces it."
tags: [components, lifecycle, inputs, signals]
related: [lifecycle-overview, ng-on-init, input, linked-signal]
---
> **In one line:** `ngOnChanges(changes)` runs before `ngOnInit` and again whenever a bound `@Input()` receives a new **reference**. With signal inputs you usually do not need it.

## The idea

`ngOnInit` runs once, so it cannot notice when a parent later binds a different value to the same component instance. That happens constantly in lists, master-detail screens and routes that reuse a component. `ngOnChanges` is the hook that fires each time.

It receives a `SimpleChanges` object, a dictionary keyed by input name. Each entry has `previousValue`, `currentValue` and `firstChange`, so you can see what changed and whether it is the very first binding.

There is one important limit. It fires only when the bound **reference** changes: a new string, a new object. Mutating a property of the object in place does not trigger it, because the reference stayed the same.

Modern components often avoid the hook altogether, because a derived value is what you wanted in the first place:

## See it

```typescript
// Before: recompute in ngOnChanges
export class UserProfile implements OnChanges {
  @Input({ required: true }) userId!: string;
  protected label = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      this.label = `User #${this.userId}`;
    }
  }
}

// After: a signal input and a computed
export class UserProfile {
  readonly userId = input.required<string>();
  protected readonly label = computed(() => `User #${this.userId()}`);
}
```

The second version has no hook, no `SimpleChanges` and no way to forget a case: `label` is simply always correct.

## Go deeper

Signal inputs, declared with `input()`, do **not** trigger `ngOnChanges`. When you need to *do* something on a change rather than derive a value, use `effect()`, and when you need state that resets with an input, use `linkedSignal()`.

`ngOnChanges` is still the right tool for components that use the `@Input()` decorator, which is plenty of existing code. In that code, always check `changes['name']` rather than assuming which input changed, so adding another input later does not break the logic.

## Watch out

- Expecting it to fire when you mutate an object passed in. Only a new reference triggers it, so replace objects instead of editing them.
- Expecting it to fire for a signal `input()`. It will not; use `computed()` or `effect()`.
- Doing heavy work in the hook. It can run many times, so keep it light and delegate to a service.

## Remember

- `ngOnChanges` runs before `ngOnInit` and whenever a decorator `@Input()` gets a new reference.
- It does not run for signal inputs, nor for in-place mutation.
- A `computed()` over a signal input is usually clearer than the hook.

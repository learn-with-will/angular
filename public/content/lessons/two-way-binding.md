---
slug: two-way-binding
title: "Two-way binding: [(…)]"
topic: templates
kind: concept
summary: "Keep a value in sync in both directions: [(ngModel)] for inputs, model() for your own components."
tags: [templates, binding, forms, model]
related: [property-binding, event-binding, signal]
---
> **In one line:** `[(target)]="value"` is a property binding going in plus an event binding coming out, so the view and the component always agree.

## The idea

The "banana in a box" `[( )]` is literally the `[ ]` of property binding wrapped around the `( )` of event binding. The element shows the current value (in) and reports changes (out). Picture a smart thermostat dial: it always displays the current setting, and turning it sends the new setting back.

Which one you use depends on the target:

| Target | Syntax | You also need |
|---|---|---|
| `<input>`, `<select>`, `<textarea>` | `[(ngModel)]="term"` | import `FormsModule` |
| Your own component | `[(value)]="quantity"` | a `model()` input in the child |

`model()` declares an input that the child can read *and* write. Angular creates the matching `valueChange` output for you, so writes travel back up to the parent. An `input()` is read-only inside the child; a `model()` is the same idea plus permission for the child to write back. The naming is the contract: an input called `value` pairs with an output called `valueChange`, and the banana syntax relies on exactly that pair. The round trip looks like this:

```sequence
actor user: User
actor child: `<app-stepper>` | has `model()` @blue
actor parent: Parent | has a `quantity` signal @primary
user -> child: Clicks "+"
note child: The model changes | `value` is updated
child -> parent: `valueChange` | emits the new value
note parent: `quantity` is updated @green
parent --> child: `[value]` | passes the value back in
```

## See it

```typescript
// Child: exposes a two-way bindable `value`
@Component({
  selector: 'app-stepper',
  template: `
    <button (click)="value.update(v => v - 1)" [disabled]="value() <= 0">-</button>
    <span>{{ value() }}</span>
    <button (click)="value.update(v => v + 1)">+</button>
  `,
})
export class Stepper {
  readonly value = model(0);
}
```

```typescript
// Parent: binds its own signal with [(value)]
@Component({
  selector: 'app-cart',
  imports: [Stepper],
  template: `<app-stepper [(value)]="quantity" /> Subtotal: {{ quantity() * 12 }}`,
})
export class Cart {
  protected readonly quantity = signal(1);
}
```

## Go deeper

For native form fields it works the same way with `ngModel`:

```typescript
@Component({
  selector: 'app-search',
  imports: [FormsModule],
  template: `<input [(ngModel)]="term" /> Searching for: {{ term }}`,
})
export class Search {
  term = '';
}
```

Two-way binding is a convenience, not a requirement. Writing `[value]="quantity()" (valueChange)="quantity.set($event)"` does exactly the same thing, which is useful when you want to transform the value on the way back, for example to clamp a number or trim a string before storing it.

A reasonable rule of thumb: use two-way binding for controls whose whole purpose is to edit a value (inputs, steppers, sliders, toggles). For everything else, one-way data down and events up keeps it easy to see where a change came from.

## Watch out

- Forgetting `FormsModule` makes `[(ngModel)]` fail with a "can't bind to 'ngModel'" error.
- With `model()` you bind the signal itself, `[(value)]="quantity"`, not `quantity()`.
- Do not overuse it. Most data should flow one way; keep two-way binding for inputs and sliders.

## Remember

- `[(x)]` combines `[x]` going in with `(xChange)` coming out.
- Native fields use `[(ngModel)]`; your components use `model()`.
- Bind a signal instance to a `model()`, never its called value.

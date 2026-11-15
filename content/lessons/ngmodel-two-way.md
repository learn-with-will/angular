---
slug: ngmodel-two-way
title: "ngModel and two-way binding"
topic: forms
kind: api
summary: "Keep an input and a component property in sync with [(ngModel)], and see what the banana-in-a-box really is."
tags: [forms, ngmodel, two-way-binding, template-driven]
related: [forms-two-approaches, template-driven-form, template-validation]
---
> **In one line:** `[(ngModel)]="username"` links an input and a property both ways: typing updates the property, and changing the property updates the input.

## The idea

Two-way binding is a shorthand for a pair of one-way bindings. The "banana in a box" `[( )]` combines a **property binding** (model to view) with an **event binding** (view to model).

```sequence
actor model: Property `username`
actor view: Input element
model -> view: `[ngModel]` | property to input
view -> model: `(ngModelChange)` | input to property
```

So these two lines are exactly the same:

| Shorthand | Expanded |
|---|---|
| `[(ngModel)]="username"` | `[ngModel]="username" (ngModelChange)="username = $event"` |

Knowing the expansion matters, because it is what lets you do something *extra* on each change, such as normalising the value before storing it.

`ngModel` comes from `FormsModule`, so the component must list it in `imports`.

## See it

```typescript
@Component({
  selector: 'app-greeting',
  imports: [FormsModule],
  template: `
    <label for="name">Your name</label>
    <input id="name" name="name" [(ngModel)]="username" />
    <p>Hello, {{ username || 'stranger' }}!</p>
  `,
})
export class Greeting {
  username = '';
}
```

The interpolation re-renders on every keystroke, which shows the binding is live. A single input outside a `<form>` does not strictly need `name`, but it is good HTML practice.

## Go deeper

Use the expanded form when the incoming value needs work:

```html
<input
  name="code"
  [ngModel]="code"
  (ngModelChange)="code = $event.toUpperCase()"
/>
```

Here the property always holds an upper-case value, which the shorthand cannot express.

`ngModel` can also bind to a **signal**. Because `[(ngModel)]` accepts a writable signal, `[(ngModel)]="username"` works when `username = signal('')`, and the signal is updated as the user types. That fits naturally with `computed()` values derived from the field.

By default the value updates on every keystroke. Add `[ngModelOptions]="{ updateOn: 'blur' }"` to update when the field loses focus instead.

Two-way binding is not special syntax for `ngModel` alone. Any component can offer it with a `model()` signal: `value = model('')` lets a parent write `[(value)]="name"`. `ngModel` is the form-system version, which additionally participates in validation and state, so use it for form fields and `model()` for ordinary reusable widgets.

## Watch out

- Forgetting to import `FormsModule`. Angular reports *Can't bind to 'ngModel'*.
- Mixing `[(ngModel)]` with a `formControl` on the same element.
- Using `ngModel` inside a `<form>` without a `name`; see the pitfall lesson.

## Remember

- `[(ngModel)]` equals `[ngModel]` plus `(ngModelChange)`.
- Split it when you need to transform the value.
- `ngModel` needs `FormsModule` in `imports`.

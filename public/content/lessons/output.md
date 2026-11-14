---
slug: output
title: "output()"
topic: components
kind: api
summary: "Let a child tell its parent that something happened, with a typed event."
tags: [components, outputs, events, data-flow]
related: [input, component-communication, event-binding, event-object]
since: "19"
---
> **In one line:** `output<T>()` declares an event a component can emit. The child calls `.emit(value)`, and the parent listens with `(name)="handler($event)"`.

## The idea

A child has no business reaching into its parent to change things. Instead it announces what happened, "this card was selected" or "the dialog was closed", and the parent decides what to do. That keeps the child reusable: it does not need to know who is listening or what happens next.

Inputs and outputs are the two halves of a component's public API, and the direction is the way to remember them:

| | Direction | Declared with | Bound in the parent with |
|---|---|---|---|
| Input | data down | `input()` | `[name]="value"` |
| Output | events up | `output()` | `(name)="handler($event)"` |

The generic type is the payload. `output<void>()` is a pure notification, and `output<User>()` carries a `User`. The same parentheses syntax you use for a native `click` listens to it.

## See it

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <h2>{{ user().name }}</h2>
    <button type="button" (click)="selected.emit(user())">Select</button>
  `,
})
export class UserCard {
  readonly user = input.required<User>();
  readonly selected = output<User>();        // the child announces; the parent decides
}
```

```html
<app-user-card [user]="u" (selected)="onSelect($event)" />
```

Inside `onSelect`, `$event` is the `User` the child emitted, already typed. The parent handler updates its own state, usually a signal, and the view follows.

## Go deeper

`output()` replaces the older `@Output()` decorator paired with `EventEmitter`. The decorator form still works in existing code, but `output()` gives better type inference and no boilerplate, so use it in new components.

Name outputs after what the user *did*, such as `selected`, `closed` or `removed`, not after how the parent should react. An `on` prefix like `onSelected` reads as a handler rather than an event, and it blurs which side owns the logic.

Listeners are cleaned up when the component is destroyed, so there is no subscription to manage for a template binding.

## Watch out

- Calling `selected(user)` instead of `selected.emit(user)`. An output is not a function you call; it has an `emit` method.
- Emitting a mutable object and then changing it. Emit a copy, or emit what changed, so the parent works with a stable value.
- Choosing a name that clashes with a native DOM event, such as `click`, which makes the binding ambiguous.

## Remember

- `output<T>()` sends events up; the child calls `.emit(value)`.
- Bind it in the parent with `(name)="handler($event)"`, where `$event` is the emitted value.
- Name outputs after what happened, not after what the parent should do.

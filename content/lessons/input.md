---
slug: input
title: "input()"
topic: components
kind: api
summary: "Declare data a parent passes down into a component, as a read-only signal."
tags: [components, inputs, signals, data-flow]
related: [output, component-communication, pitfall-mutating-inputs, signal]
since: "19"
---
> **In one line:** `input<T>()` declares a value the parent passes into your component. It is a read-only signal, so you read it by calling it: `user()`.

## The idea

Components rarely work alone. The standard pattern is that **data flows down** from a parent into a child through inputs, and **events flow up** through outputs. A child never reaches up and changes its parent; it only uses what it was given.

An `input()` is a signal, so it works naturally with `computed()` and `effect()`, and the template updates when the parent passes a new value. The form you choose says how much the parent must do:

| Declaration | Meaning |
|---|---|
| `input<string>()` | optional; `undefined` if the parent passes nothing |
| `input('Untitled')` | optional, with a default value |
| `input.required<User>()` | the parent must pass it, or the build fails |
| `input(false, { transform: booleanAttribute })` | a bare attribute such as `<app-x disabled />` means `true` |

Prefer `input.required` for data a component cannot work without. It fails at compile time instead of rendering a blank `undefined`.

## See it

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <article>
      <h2>{{ user().name }}</h2>
      <p>{{ user().email }}</p>
    </article>
  `,
})
export class UserCard {
  readonly user = input.required<User>();   // read it with user()
}
```

The parent supplies it with a property binding, and it can be an object, a number, anything:

```html
@for (u of users(); track u.id) {
  <app-user-card [user]="u" />
}
```

## Go deeper

Because an input is a signal, a derived value is a `computed()`, which replaces most of what `ngOnChanges` used to do:

```typescript
readonly initials = computed(() =>
  this.user().name.split(' ').map(part => part[0]).join(''),
);
```

The older `@Input()` decorator still works and fills many existing codebases, but `input()` has better type inference, needs no `ngOnChanges` for derived values, and fits the signal model. Prefer it in new components.

## Watch out

- Treating the input as writable. `user.set(...)` does not exist, and mutating the object the input holds changes the parent's data behind its back.
- Forgetting the call. `user.name` is wrong; `user().name` is right, in templates and in code.
- Reading a required input too early. It has no value yet in the constructor; read it in a template, a `computed()` or after initialization.

## Remember

- `input()` declares data flowing down from the parent, as a read-only signal.
- Use `input.required<T>()` when the component cannot work without the value.
- Never mutate an input; derive with `computed()` or ask the parent through an output.

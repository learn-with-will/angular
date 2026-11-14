---
slug: component-communication
title: "How components talk"
topic: components
kind: concept
summary: "Pick between input, output, model, a shared service or a query by how two components relate."
tags: [components, communication, data-flow, services]
related: [input, output, two-way-binding, signal-state-service]
---
> **In one line:** How two components should communicate depends on how they are related in the template, and Angular has one tool for each relationship.

## The idea

Angular apps are trees of self-contained components. That isolation is what makes them reusable, but real screens still need coordination: a form tells its parent it was submitted, a header shows how many items are in a cart that lives somewhere else.

Without a structure, developers reach for globals or poke at the DOM, and the app becomes fragile. Angular's answer keeps **data flowing down and events flowing up** by default, and offers other tools for the cases where that is not enough. The right one depends on the relationship:

```tree
How are the two components related?
  Parent gives data to child
    [input] Input | `input()` @blue
  Child reports to parent
    [output] Output | `output()` @green
  Both edit one value
    [model] Model | `model()` @primary
  No parent-child link
    [service] Shared service | a signal in a service @amber
  Parent must call a method
    [query] Query | `viewChild()` @red
```

The first three work only between components that are directly parent and child in the template. For unrelated components, such as a product list and a cart badge in the header, the recommended tool is an injectable service that both inject and read through signals.

## See it

All four template-level tools in one class:

```typescript
@Component({ /* ... */ })
export class Example {
  title = input.required<string>();        // parent -> child
  saved = output<string>();                // child -> parent
  quantity = model(1);                     // both directions
  form = viewChild<ElementRef>('form');    // this component reads its own view
}
```

```html
<app-example [title]="pageTitle" (saved)="onSaved($event)" [(quantity)]="cartQuantity" />
```

## Go deeper

The tools are ordered by how much coupling they create. `input()` and `output()` create the least: the child knows only its own API. `model()` shares ownership of one value. A query (`viewChild()`) lets a parent call into a specific child, which ties the two together, so keep it for imperative needs such as `focus()` or `reset()`.

A shared service is the right answer for siblings, but not the first answer for a plain parent and child. If two components are directly related, inputs and outputs are simpler and easier to trace than a service in the middle.

## Watch out

- Reaching for a service too early. For parent and child, a service adds indirection that an input and an output would avoid.
- Passing a value through many layers that do not use it. That is prop drilling, and a service is the cure once it spreads.
- Using `viewChild()` for something an output could say. It couples the parent to the child's internals.

## Remember

- Down with `input()`, up with `output()`, both ways with `model()`.
- Unrelated components share state through a service with signals.
- Use `viewChild()` only when the parent genuinely has to call the child.

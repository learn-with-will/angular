---
slug: view-child
title: "viewChild()"
topic: components
kind: api
summary: "Get a reference to an element or child component in your own template, as a signal."
tags: [components, queries, signals, dom]
related: [component-communication, ng-after-view-init, after-next-render, content-child]
since: "19"
---
> **In one line:** `viewChild()` returns a signal holding an element or component from this component's own template, or `undefined` until that part of the view exists.

## The idea

Inputs and outputs cover almost every conversation between components. Occasionally a component needs to reach into its **own template** and do something imperative: put focus in an input, read a size, start a widget, or tell a child to reset itself. `viewChild()` is the tool for that.

You point it at a template reference variable (`#box`) or a component class, and it gives you a signal. Because the view is built after the class, the signal is `undefined` at first and fills in once the element has rendered. That is also why it re-evaluates when an element appears or disappears, for example inside an `@if`.

| Form | Result |
|---|---|
| `viewChild('box')` | `Signal<ElementRef \| undefined>` for an element |
| `viewChild(Counter)` | `Signal<Counter \| undefined>` for a child component |
| `viewChild.required('box')` | never `undefined`; reading it before it exists throws |
| `viewChildren(Counter)` | `Signal` of every matching child |

## See it

```typescript
@Component({
  selector: 'app-search-field',
  template: `<input #box placeholder="Search" />`,
})
export class SearchField {
  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  focus(): void {
    this.box().nativeElement.focus();      // call it like any signal
  }
}
```

A child component works the same way, and gives you its public methods:

```typescript
private readonly counter = viewChild(Counter);

resetCounter(): void {
  this.counter()?.reset();                 // optional: it may not be rendered
}
```

## Go deeper

The result is a normal signal, so you can read it inside a `computed()` or an `effect()` and react when the element appears. That removes the old need to read queries inside lifecycle hooks, because a signal query is simply `undefined` until the element exists.

Use `viewChild.required` when the element is always present in the template, which saves the `?.` checks. Use the optional form when it sits inside an `@if` or `@for`.

Queries are an escape hatch. They tie a component to the internals of its own template, or worse, a child's methods. Reach for an `input()` or an `output()` first, and keep `viewChild()` for jobs only imperative code can do.

## Watch out

- Reading the signal in the constructor. The view does not exist yet, so an optional query is `undefined` and a required one throws.
- Querying something that lives inside `@if`. It is `undefined` while the condition is false, so guard for that.
- Expecting `viewChild()` to find projected content. That belongs to `contentChild()`, covered in its own lesson.

## Remember

- `viewChild()` gives a signal for something in your own template, `undefined` until it renders.
- `viewChild.required` is for elements that are always there; the optional form is for conditional ones.
- Prefer inputs and outputs, and use queries only for imperative actions like `focus()`.

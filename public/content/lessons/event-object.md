---
slug: event-object
title: "The $event object"
topic: templates
kind: technique
summary: "Read the event payload in a handler, and type it so TypeScript can help."
tags: [templates, events, typescript]
related: [event-binding, key-event-modifiers, template-reference-variables, signal]
---
> **In one line:** In an event binding, `$event` is the payload: the native DOM `Event` for built-in events, or the emitted value for a custom output.

## The idea

When an event fires, you often need to know *what happened*: the text typed into an input, which key was pressed, which value a child component emitted. Pass `$event` into your handler to get it. Think of it as the intercom at the doorbell: it tells you who rang and the details of the visit.

| Event comes from | `$event` is |
|---|---|
| A native element (`click`, `input`, `keyup`) | the DOM `Event` (`MouseEvent`, `KeyboardEvent`, …) |
| A component `output()` | whatever value the output emitted |

For form fields, the value lives on `event.target`, which TypeScript only knows as a generic `EventTarget`. Cast it to the element type to read `.value`. The cast is the one place you tell the compiler something it cannot work out itself: you know this handler is attached to an `<input>`.

## See it

```typescript
@Component({
  selector: 'app-live-search',
  template: `
    <input placeholder="Search..." (input)="onInput($event)" />
    <p>Searching for: {{ query() }}</p>
  `,
})
export class LiveSearch {
  protected readonly query = signal('');

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;  // cast to read .value
    this.query.set(input.value);
  }
}
```

With a child component, `$event` is the emitted value, already typed by the output:

```typescript
// rating.ts:      rated = output<number>();
// parent template:
//   <app-rating (rated)="onRated($event)" />
// parent class:
onRated(stars: number): void {
  this.stars.set(stars);   // `stars` is a number, no cast needed
}
```

## Go deeper

Pick the most specific event type for the handler: `MouseEvent` for clicks (it has `clientX`, `shiftKey`), `KeyboardEvent` for key events (`key`, `ctrlKey`), and plain `Event` for `input`.

Angular type-checks the template call too. Passing `$event` from a `click` into a handler typed `(e: KeyboardEvent)` is a compile error, which catches wiring mistakes early.

The event object also carries the control methods you sometimes need: `event.preventDefault()` cancels the browser's default action, and `event.stopPropagation()` stops the event bubbling up to parent elements. Use them deliberately, in the handler, rather than as a habit.

## Watch out

- Leaving the parameter as `any` throws away type safety. Type it as `Event`, or a specific type like `KeyboardEvent` or `MouseEvent`.
- `$event` exists only inside an event binding. You cannot use it in property bindings or interpolation.
- If you only need an input's value, a template reference variable can skip `$event` entirely.

## Remember

- `$event` is the native event for DOM events and the emitted value for outputs.
- Type the parameter and cast `event.target` to read element-specific fields.
- Prefer the most specific event type: `MouseEvent`, `KeyboardEvent` or `Event`.

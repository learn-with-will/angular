---
slug: event-binding
title: "Event binding: (event)"
topic: templates
kind: api
summary: "Run a statement in your component when a DOM event or a component output fires."
tags: [templates, events, user-interaction]
related: [event-object, key-event-modifiers, two-way-binding, signal]
---
> **In one line:** `(event)="statement"` runs the statement when the event fires. Angular attaches the listener and removes it when the element is destroyed.

## The idea

A page is only useful if it reacts: people click, type, hover and press keys. In plain JavaScript you query the element, call `addEventListener`, and remember to clean up. Event binding declares the wiring right next to the element instead, like installing a doorbell: "when someone presses *this* button, ring *this* bell".

The same parentheses syntax works for native DOM events (`click`, `input`, `submit`, `keydown`) and for custom component outputs, so there is one mental model for both. Remember the direction by the brackets:

| Syntax | Data flows | Name |
|---|---|---|
| `[prop]="x"` | into the element | property binding |
| `(event)="y()"` | out of the element | event binding |

Here is the whole round trip for a click:

```sequence
actor user: User
actor browser: Browser | emits the event @blue
actor tpl: Template | the listener @primary
actor comp: Component | your class
user -> browser: Clicks the button
browser -> tpl: Fires a `click` event | `(click)="increment()"` is listening
tpl -> comp: Runs `increment()` | the statement from the template
comp --> tpl: `count` signal updated | the view refreshes
```

## See it

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <p>Clicks: {{ count() }}</p>
    <button (click)="increment()">Click me</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);

  increment(): void {
    this.count.update(n => n + 1);
  }
}
```

A statement can also be a short expression instead of a method call, which suits one-liners like toggling a panel:

```html
<button (click)="isOpen.set(!isOpen())">Toggle</button>
```

## Go deeper

The same syntax listens to your own components. If a child declares an `output()`, the parent binds to it exactly like a native event: `<app-panel (closed)="onClosed()" />`. Inside the handler, `$event` carries whatever the child emitted.

Angular removes the listener when the element is destroyed, so there is nothing to unsubscribe from, which is one of the main wins over hand-written listeners.

Some events have a default browser action, such as a form submit reloading the page. Call `event.preventDefault()` in your handler, deliberately, when you want to handle it yourself.

When a *component itself* needs to react to events on its own host element, prefer the `host` property in the decorator, for example `host: { '(click)': 'toggle()' }`, over the older `@HostListener` decorator, which is kept mainly for backwards compatibility.

## Watch out

- `(click)="save"` only *names* the method and never calls it. Write `(click)="save()"`, or a full statement such as `(click)="isOpen.set(true)"`.
- Keep statements short, ideally one call. Put real logic in a method so it is readable and testable.
- Mixing up `()` and `[]` is the most common slip: parentheses are for events going out, brackets for data coming in.

## Remember

- `(event)="handler()"` runs your code when the event fires.
- Parentheses mean events flowing out; square brackets mean data flowing in.
- Handlers usually update a signal, and the template follows.

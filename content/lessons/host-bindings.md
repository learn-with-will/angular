---
slug: host-bindings
title: "The host property"
topic: directives-pipes
kind: technique
summary: "Bind to and listen on a directive's or component's own element with the host metadata."
tags: [directives, host, bindings, events]
related: [attribute-directive, directives-overview, event-binding, class-and-style-binding]
---
> **In one line:** The `host` property of `@Directive` or `@Component` is a small template for the *host element itself*: property, class and style bindings, and event listeners.

## The idea

A directive changes the element it sits on, and the cleanest way is the `host` metadata. Each key says what to do to the host, using the same syntax as a template: brackets for bindings, parentheses for events, and a plain string for a static attribute.

| Key | Effect on the host |
|---|---|
| `'[style.color]': 'color()'` | binds a style |
| `'[class.active]': 'on()'` | toggles a class |
| `'[attr.aria-expanded]': 'open()'` | binds an attribute |
| `'(mouseenter)': 'hover.set(true)'` | listens to an event on the host |
| `'(document:keydown.escape)': 'close()'` | listens on `document`, `window` or `body` |
| `role: 'dialog'` | sets a static attribute |

Older code and older books use the `@HostBinding()` and `@HostListener()` decorators for the same job. They still work, but the Angular style guide now recommends `host`, which keeps everything about the host element in one place.

## See it

```typescript
// Before: decorators spread across the class
export class Hint {
  @HostBinding('class.active') active = false;
  @HostListener('mouseenter') onEnter() { this.active = true; }
  @HostListener('mouseleave') onLeave() { this.active = false; }
}

// After: one host block, with signal state
@Directive({
  selector: '[appHint]',
  host: {
    '[class.active]': 'active()',
    '(mouseenter)': 'active.set(true)',
    '(mouseleave)': 'active.set(false)',
  },
})
export class Hint {
  protected readonly active = signal(false);
}
```

Reading the `host` block tells you everything the directive does to its element.

## Go deeper

Prefer host bindings over reaching into the DOM yourself. `this.el.nativeElement.style.color = 'red'` bypasses Angular, breaks under server-side rendering, and is easy to leave in an inconsistent state. A binding is declarative and Angular keeps it correct.

When you really do need the element, for example to call `contains()` or `focus()`, inject it with `inject(ElementRef)`. Reserve that for what a binding cannot express.

Store state in **signals**. A host binding that reads a signal updates under `OnPush` and in zoneless apps with no extra work, whereas a plain field may not notify Angular.

## Watch out

- Writing to `nativeElement` for something a host binding can do. It fails under server rendering and drifts out of sync.
- Using a plain field for state that a host binding reads. Use a signal so the view updates.
- Listening on `document` for every instance without need. Each directive adds a global listener, so keep those handlers cheap.

## Remember

- `host` is a template for the element the directive or component sits on.
- Prefer it to `@HostBinding` and `@HostListener`, and to direct DOM access.
- Keep host-bound state in signals.

---
slug: attribute-directive
title: "Attribute directives"
topic: directives-pipes
kind: api
summary: "Write a directive that changes how an existing element looks or behaves."
tags: [directives, attribute, selector, exportas]
related: [directives-overview, host-bindings, pitfall-silent-directive, structural-directive]
---
> **In one line:** An attribute directive is a `@Directive` with an attribute selector like `[appHighlight]`. Put the attribute on any element and the directive's behavior applies to it.

## The idea

The simplest directive reacts to its host. Here the host highlights while the pointer is over it, and the attribute's *value* chooses the color. Three parts make that work: a selector that decides where it applies, an input that receives the attribute's value, and `host` entries that bind to the element.

The selector is the part beginners get wrong, because the brackets matter:

| Selector | Matches |
|---|---|
| `[appHighlight]` | any element with an `appHighlight` attribute (what you want) |
| `appHighlight` | an element *named* `<appHighlight>` (almost never what you want) |
| `button[appHighlight]` | only `<button>` elements with the attribute |

An input with an `alias` lets the attribute carry the value: `<p appHighlight="lightblue">` passes `"lightblue"` to the directive.

## See it

```typescript
@Directive({
  selector: '[appHighlight]',
  host: {
    '[style.backgroundColor]': 'active() ? color() : null',
    '(mouseenter)': 'active.set(true)',
    '(mouseleave)': 'active.set(false)',
  },
})
export class Highlight {
  // <p appHighlight="lightblue"> passes "lightblue"; a bare <p appHighlight> falls back to yellow
  readonly color = input('yellow', {
    alias: 'appHighlight',
    transform: (value: string) => value || 'yellow',
  });

  protected readonly active = signal(false);
}
```

Use it on any element, as in `<li appHighlight="lightyellow">{{ product.name }}</li>`. `active` is a signal, so the binding updates correctly in zoneless apps and under `OnPush`.

## Go deeper

`exportAs` lets a template grab the directive instance through a template reference variable, the same way `#f="ngForm"` gives you the `NgForm` directive:

```typescript
@Directive({ selector: '[appCollapsible]', exportAs: 'collapsible' })
export class Collapsible {
  readonly open = signal(true);
  toggle(): void { this.open.update(o => !o); }
}
```

```html
<div appCollapsible #panel="collapsible">…</div>
<button (click)="panel.toggle()">Toggle</button>
```

Use it when the template needs to call the directive's methods or read its state. Keep each directive focused on one behavior; combine behaviors rather than growing one directive into several.

## Watch out

- Writing `selector: 'appHighlight'` without brackets. That matches an element name, so nothing ever applies.
- Forgetting to import the directive into the component that uses it. The attribute is then ignored silently.
- Poking at `nativeElement.style` when a `host` binding would do. See the lesson on `host`.

## Remember

- An attribute directive uses an attribute selector in square brackets.
- Give its main input an alias equal to the selector so `<el appThing="value">` reads naturally.
- `exportAs` exposes the instance to the template through `#ref="name"`.

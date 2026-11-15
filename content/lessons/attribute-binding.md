---
slug: attribute-binding
title: "Attribute binding: [attr.x]"
topic: templates
kind: api
summary: "Set an HTML attribute that has no matching DOM property, such as colspan or an SVG attribute."
tags: [templates, binding, attributes, aria]
related: [property-binding, class-and-style-binding, template-expressions]
---
> **In one line:** `[attr.name]="expression"` sets an HTML **attribute** directly, for the cases where the element has no DOM property of that name.

## The idea

HTML *attributes* are the values written in the markup. DOM *properties* are the live values on the JavaScript object. Most of the time they line up, and Angular binds the property because it is the thing the browser actually uses. A few attributes have no matching property, and for those you need `[attr.…]`.

| | Attribute | Property |
|---|---|---|
| Lives in | the HTML markup | the DOM object |
| Binding syntax | `[attr.colspan]="n"` | `[colSpan]="n"` |
| Default target in Angular | no | yes |

Typical cases are `colspan` (the property is spelled `colSpan`), most SVG attributes and ARIA attributes. If you are unsure which one you need, try property binding first. Angular tells you at compile time when there is no such property, so a wrong guess is caught immediately.

## See it

```html
<button [attr.aria-label]="label()">X</button>
<td [attr.colspan]="span()">Cell</td>
```

In a full component, a cell that spans the whole table when there is no data:

```typescript
@Component({
  selector: 'app-results',
  template: `
    <table>
      <tr>
        <td [attr.colspan]="columns()">{{ message() }}</td>
      </tr>
    </table>
  `,
})
export class Results {
  protected readonly columns = signal(4);
  protected readonly message = signal('No results yet');
}
```

Accessibility is the everyday use. A disclosure button must tell assistive technology whether its panel is open, and that state belongs in an attribute:

SVG is the other. Shapes take their size from attributes such as `r`, `cx` and `width`, which have no plain DOM property to bind:

```html
<!-- Accessibility: the button announces whether its panel is open -->
<button [attr.aria-expanded]="open()" (click)="open.set(!open())">Details</button>

<!-- SVG: the radius is an attribute, not a bindable property -->
<svg width="100" height="40">
  <circle cx="20" cy="20" [attr.r]="radius()" fill="tomato" />
</svg>
```

## Go deeper

Binding `null` or `undefined` removes the attribute from the element, which makes `[attr.…]` handy for optional attributes: `[attr.aria-describedby]="hint() ? 'hint-id' : null"` adds the attribute only when there is a hint.

Attribute values are always strings in the DOM. `[attr.colspan]="2"` writes `colspan="2"`, and Angular converts the number for you.

## Watch out

- `<td [colspan]="2">` is a compile error: *Can't bind to 'colspan' since it isn't a known property of 'td'*. The DOM property is `colSpan`, so use `[attr.colspan]` instead.
- Since Angular 20 you can bind ARIA directly, as in `[aria-label]="label()"`. `[attr.aria-label]` works in every version and is what you will see in most code.

## Remember

- Use `[attr.name]` only when there is no DOM property to bind.
- `colspan` and most SVG attributes are the usual suspects.
- `[attr.aria-*]` works everywhere; direct ARIA binding needs Angular 20.

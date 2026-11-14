---
slug: component-styles
title: "Component styles are scoped"
topic: components
kind: concept
summary: "A component's CSS applies only to its own template by default, so styles never leak."
tags: [components, css, encapsulation, host]
related: [component-decorator, using-components, content-projection]
---
> **In one line:** CSS in a component's `styles` or `styleUrl` applies to that component's own template only, so a rule like `h1 { color: red }` in one component cannot restyle another.

## The idea

Global CSS has a well-known problem: any rule can hit any element, so changing one page quietly breaks another. Angular avoids that by default. Each component's styles are **scoped** to that component, and it does this by adding a unique attribute to the component's elements and rewriting its selectors to require it.

This is called view encapsulation, and it has three modes you can choose through the `encapsulation` metadata field:

| Mode | Behavior |
|---|---|
| `Emulated` (default) | styles are scoped with generated attributes |
| `None` | styles become global and affect the whole page |
| `ShadowDom` | uses the browser's native shadow DOM for real isolation |

Emulated is right almost all the time, which is why most components never mention `encapsulation` at all.

## See it

```typescript
@Component({
  selector: 'app-hello-box',
  template: `<div class="box"><p>Hello from a reusable component!</p></div>`,
  styles: `
    .box {
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
  `,
})
export class HelloBox {}
```

Drop `<app-hello-box />` in two places and each gets the `.box` look, while an unrelated `.box` elsewhere in the app is untouched.

## Go deeper

A component's styles cannot reach into the components it contains, because those have their own scope. Two selectors help at the boundary:

```css
/* Style the component's own host element, the <app-hello-box> tag itself */
:host {
  display: block;
  margin-block: 1rem;
}

/* Style the host only when it has a class */
:host(.compact) {
  padding: 0.25rem;
}
```

The host element is an unknown custom tag, so it is `display: inline` until you say otherwise. `:host { display: block }` is the first thing many components need.

For genuinely global rules, such as a reset or a theme, use the workspace `styles.css` instead of fighting encapsulation.

## Watch out

- Expecting a parent's CSS to style a child component's internals. It will not, by design. Give the child an input or a CSS custom property to customize.
- Reaching for `ViewEncapsulation.None` to "make a style work". It makes that component's CSS global and brings the leaking problem back.
- Forgetting that the host element is `inline` by default, which makes width, height and margins seem to do nothing.

## Remember

- Component styles are scoped to the component by default.
- `:host` styles the component's own tag, and `styles.css` is for rules that must be global.
- Reach for `None` or `ShadowDom` deliberately, not to work around a selector.

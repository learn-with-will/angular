---
slug: directives-overview
title: "Three kinds of directives"
topic: directives-pipes
kind: concept
summary: "Components, attribute directives and structural directives: what each adds to an element."
tags: [directives, components, attribute, structural]
related: [attribute-directive, structural-directive, host-bindings, component-decorator]
---
> **In one line:** A directive adds behavior to an element that already exists. Components, attribute directives and structural directives differ in *what* they add: a template, a look or behavior, or a piece of the DOM.

## The idea

Components bundle a template, styles and logic. But a lot of UI behavior has no template of its own: highlight a row on hover, close a dropdown when the user clicks elsewhere, show a button only to administrators, add the same focus ring to buttons, links and cards.

Wrapping every element in a component to get one behavior leads to extra DOM nodes, awkward styling, and components that only forward inputs. A **directive** attaches behavior directly to the element, the **host element**, without changing what it is. Angular's own `ngModel`, `routerLink` and `formControlName` are directives.

Every component is really a directive *with a template*. Beyond that, there are two kinds you write yourself:

| Kind | What it does | Example |
|---|---|---|
| **Component** | renders its own template inside its host | `<app-user-card [user]="u" />` |
| **Attribute directive** | changes the look or behavior of its host | `<p appHighlight="lightblue">` |
| **Structural directive** | adds or removes parts of the DOM from a template | `<button *appIfRole="'admin'">` |

A directive is a class with the `@Directive` decorator. Its `selector` is usually an **attribute selector** such as `[appHighlight]`, so it applies to any element carrying that attribute. Like components, directives are standalone, and a component that uses one lists it in `imports`.

## See it

The same behavior, once as a directive. This one adds a title tooltip to any element and nothing else:

```typescript
@Directive({
  selector: '[appHint]',
  host: { '[attr.title]': 'hint()' },
})
export class Hint {
  readonly hint = input.required<string>({ alias: 'appHint' });
}
```

```html
<button appHint="Saves the form">Save</button>
<a appHint="Opens the docs" href="/docs">Docs</a>
```

One directive, any element. No wrapper component, and no extra tag in the DOM.

## Go deeper

How do you choose? If the thing needs its own markup, make a **component**. If it only changes how an existing element looks or acts, make an **attribute directive**. If it decides whether a part of the template exists at all, it is a **structural directive**.

Since Angular 17 the built-in control flow (`@if`, `@for`, `@switch`) covers most of what structural directives such as `*ngIf` used to do, so you will write structural directives mainly for app-specific rules like permissions or feature flags.

A directive can also be applied to a *component's own host* with `hostDirectives`, which lets a component ship with behavior built in.

## Watch out

- Making a component just to add one behavior. A directive avoids the extra element and the forwarding inputs.
- Forgetting to import the directive. Angular then treats the attribute as plain HTML and does nothing, without an error.
- Skipping the prefix. Names like `[highlight]` can collide with other libraries; use your app prefix, such as `app`.

## Remember

- A directive adds behavior to an existing element, the host element.
- Component adds a template, attribute directive changes behavior, structural directive adds or removes DOM.
- Directives are standalone: list them in `imports` and prefix their selectors.

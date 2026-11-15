---
slug: component-decorator
title: "@Component"
topic: components
kind: api
summary: "Turn a class into a component by describing its tag, template and styles."
tags: [components, decorator, selector, template]
related: [using-components, component-styles, input, output]
---
> **In one line:** `@Component({...})` turns a TypeScript class into a component. The object you pass, its **metadata**, tells Angular its tag name, its HTML and its CSS.

## The idea

A real screen is far too big for one file: a navigation bar, a sidebar, a list of cards and a footer would be impossible to read, reuse or test. Components split the UI into small, self-contained pieces. Each one owns its template (HTML), its logic (a class) and its styles (CSS), so you build a piece once and use it anywhere.

Every component is a class with the `@Component` decorator. The decorator's argument is the component's metadata, and three fields carry most of the meaning:

| Field | What it does |
|---|---|
| `selector` | the custom tag that places the component in another template, such as `<app-greeting />` |
| `template` or `templateUrl` | the HTML Angular renders, inline or from a file |
| `styles` or `styleUrl` | CSS that applies to this component only |

When Angular finds `<app-greeting />` in a template, it creates an instance of the class and renders the template inside that element. The matched element is the **host element**, and the DOM it renders is the component's **view**.

## See it

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: `<h1>Hello, {{ name }}!</h1>`,
  styles: `h1 { color: rebeccapurple; }`,
})
export class Greeting {
  protected name = 'Angular';
}
```

Used from another template as `<app-greeting />`, this renders a purple heading. You normally generate the files with `ng generate component greeting`, which writes the class, template, styles and a test together.

## Go deeper

Components are **standalone** by default since Angular 19, so there is no `standalone: true` to write and no `NgModule` to declare them in. Two other fields come up early: `imports` lists the components, directives and pipes the template uses, and `changeDetection` chooses how Angular decides when to re-check the view.

Inline `template` and `styles` suit short components, and `templateUrl` and `styleUrl` suit larger ones. Both forms behave identically, so pick whichever keeps the file readable.

## Watch out

- Forgetting the prefix. Selectors such as `app-greeting` avoid clashing with native HTML tags and third-party components. A selector without a dash can collide with future HTML elements.
- Using a component in a template without adding it to that component's `imports`. The tag then fails to render, with an "unknown element" error.
- Writing `styles` as a list of strings from older tutorials. A single string, or `styleUrl`, is the current form.

## Remember

- `@Component` turns a class into a component through its metadata.
- `selector`, `template` and `styles` say where it goes, what it shows and how it looks.
- Standalone is the default, so a component lists what it uses in its own `imports`.

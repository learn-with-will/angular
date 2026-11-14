---
slug: using-components
title: "Using one component in another"
topic: components
kind: technique
summary: "Import a component class and use its tag, and your app becomes a tree of components."
tags: [components, imports, composition, standalone]
related: [component-decorator, input, output, smart-and-presentational]
---
> **In one line:** To use a component inside another, import its class and add it to the parent's `imports` array, then write its selector in the template.

## The idea

Components contain other components. A `UserList` renders many `UserCard`s, and a page renders a header, a list and a footer. Your whole app is a **tree of components** with one root, usually `App`, at the top.

```tree
App
  Header
    [nav] Navigation
  Page
    UserList
      [card] UserCard | one per user @blue
    Footer
```

Because components are standalone, each one declares what its own template uses. There is no shared `NgModule` to register things in: if `Home` shows `<app-greeting />`, then `Greeting` goes in `Home`'s `imports`. That makes every component self-describing, and a file lists everything it depends on.

## See it

```typescript
// greeting.ts
@Component({
  selector: 'app-greeting',
  template: `<p>Hello!</p>`,
})
export class Greeting {}
```

```typescript
// home.ts
import { Component } from '@angular/core';
import { Greeting } from './greeting';

@Component({
  selector: 'app-home',
  imports: [Greeting],              // makes <app-greeting> usable below
  template: `
    <app-greeting />
    <app-greeting />
  `,
})
export class Home {}
```

Angular creates two independent instances of `Greeting`, each with its own state and scoped styles.

## Go deeper

`imports` takes more than components. Directives and pipes your template uses go there too, such as `NgClass`, `CurrencyPipe` or `RouterLink`. The built-in control flow (`@if`, `@for`, `@switch`) needs no import.

The CLI will not add the import for you when you use a generated component. If a tag renders nothing, the first thing to check is the `imports` array of the component whose template contains it.

Keep each component small and single-purpose. If a template scrolls for pages, a piece of it is waiting to become its own component.

## Watch out

- Forgetting `imports`. An unknown tag fails the build in strict templates, and the usual fix is one missing class in the array.
- Building one giant page component. It cannot be reused or tested in parts, so extract children early.
- Importing a component you only use in TypeScript. `imports` is for what the template uses; classes you only call from code are imported normally.

## Remember

- A standalone component lists the components, directives and pipes its template uses in `imports`.
- An Angular app is a tree of components with one root.
- If a tag does not render, check the parent's `imports` first.

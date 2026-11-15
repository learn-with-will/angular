---
slug: pipe-basics
title: "Pipes: format in the template"
topic: directives-pipes
kind: concept
summary: "Transform a value for display with the | operator, leaving the underlying data untouched."
tags: [pipes, templates, formatting, standalone]
related: [pipe-arguments-chaining, builtin-pipes, custom-pipe, interpolation]
---
> **In one line:** A pipe takes the value on its left, returns a formatted copy for display, and never changes the data it came from. Write it as `{{ value | pipeName }}`.

## The idea

Most data is not in the shape a person wants to read. A timestamp is a raw `Date`, a price is `129.99`, a discount is `0.15`. You could format everything inside the component class, but that fills it with display-only code unrelated to your business rules.

A **pipe** moves that formatting into the template, right next to where the value appears. The pipe operator `|` hands the value to the pipe, and what comes out is only the displayed version. Think of an Instagram filter: the photo on your phone never changes, only how it looks when posted.

```flow
data: `price` | 129.99 in your class @primary
pipe: `currency` | the pipe @blue
view: Template | shows $129.99 @green
data -> pipe: value in
pipe -> view: text out
```

Because components are standalone, each pipe has to be imported by name before the template can use it. That keeps bundles small: you ship only the pipes you use.

## See it

```typescript
import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-receipt',
  imports: [CurrencyPipe, DatePipe],       // import each pipe you use
  template: `<p>{{ amount | currency }} on {{ when | date }}</p>`,
})
export class Receipt {
  amount = 49.5;
  when = new Date();
}
```

The stored `amount` is still the number `49.5`; only the text on screen reads `$49.50`.

## Go deeper

The data stays untouched, so the same value can be shown in several ways in one template: raw in an input, as currency in a summary, as a percentage in a tooltip. Nothing needs converting back.

Pipes are for light, display-only formatting. If a transformation is heavy or involves a business rule, compute it in the class, for example with a `computed()` signal, and bind the result. A pipe is not the place for a rule such as "a locked entry cannot be deleted".

Pipes also come in two flavors, pure and impure, which decide how often they re-run. That has its own lesson, and it explains a few surprising behaviors.

## Watch out

- Forgetting to import the pipe. The error `No pipe found with name 'currency'` means `CurrencyPipe` is missing from `imports`.
- Using a pipe in the TypeScript class. `'hello' | uppercase` only works in templates; use the matching function in code.
- Putting business logic in a pipe. Keep pipes small, pure and about presentation.

## Remember

- A pipe transforms a value for display; the original data is unchanged.
- Import each pipe you use in the component's `imports`.
- Use pipes for light formatting, and `computed()` for anything heavier.

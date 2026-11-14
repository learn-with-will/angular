---
slug: pipes-in-typescript
title: "Formatting in TypeScript"
topic: directives-pipes
kind: technique
summary: "Pipes only work in templates; use formatDate, formatCurrency and formatNumber in code."
tags: [pipes, typescript, formatting, locale]
related: [pipe-basics, builtin-pipes, locale-pipes, custom-pipe]
---
> **In one line:** The `|` operator exists only in templates. When you need the same formatting in your class, call the matching function from `@angular/common`.

## The idea

A pipe is a template feature. Writing `'hello' | uppercase` in a component's TypeScript is a syntax error, because in TypeScript `|` is the bitwise OR operator. Yet sometimes you need a formatted string in code: a page title, an exported file, a message passed to a service.

`@angular/common` exports plain functions that do the same job as the main pipes, so the formatting rule is the same in both places.

| In the template | In TypeScript |
|---|---|
| `date` | `formatDate(value, format, locale)` |
| `currency` | `formatCurrency(value, locale, symbol, code)` |
| `number` | `formatNumber(value, locale, digitsInfo)` |
| `percent` | `formatPercent(value, locale, digitsInfo)` |

The functions need the locale explicitly, which the pipes read from the app's `LOCALE_ID` automatically. Inject `LOCALE_ID` to pass the current one.

## See it

```typescript
import { Component, LOCALE_ID, inject } from '@angular/core';
import { formatCurrency, formatDate } from '@angular/common';

@Component({
  selector: 'app-invoice',
  template: `<h1>{{ title }}</h1>`,
})
export class Invoice {
  private readonly locale = inject(LOCALE_ID);

  protected readonly title = `Invoice of ${formatDate(new Date(), 'longDate', this.locale)}`;
  protected readonly total = formatCurrency(1840.5, this.locale, '$', 'USD');   // "$1,840.50"
}
```

The same format strings (`'longDate'`, `'mediumDate'`) work in both the pipe and the function.

## Go deeper

Another route is to inject a pipe and call it as a class. Provide it with `providers: [DatePipe]` and `inject(DatePipe).transform(value, 'short')`. This works, but the plain functions are simpler and need no provider, so prefer them when they exist.

For a rule that exists only in your app, write a small pure function and use it from both worlds: call it in code, and wrap it in a custom pipe for the template. One implementation, no drift:

```typescript
export function initials(name: string): string {
  return name.split(' ').map(part => part[0]).join('').toUpperCase();
}

@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(name: string): string {
    return initials(name);          // the template and your code share one rule
  }
}
```

A plain function is also the easiest thing to unit test, with no `TestBed`, and it can live in a shared `utils` file that both components and services import.

## Watch out

- Trying to use `|` in a `.ts` file. It is a template-only operator.
- Forgetting the locale argument. Without it, the function cannot know how to format for the user.
- Duplicating a format in a pipe and a function with different options, so the screen and the exported file disagree.

## Remember

- Pipes are template-only; in code use `formatDate`, `formatCurrency`, `formatNumber` and `formatPercent`.
- Pass the locale from `inject(LOCALE_ID)`.
- Share one pure function between code and a custom pipe for app-specific rules.

---
slug: pipe-arguments-chaining
title: "Pipe arguments and chaining"
topic: directives-pipes
kind: technique
summary: "Configure a pipe with colon-separated arguments and combine several pipes left to right."
tags: [pipes, templates, formatting, arguments]
related: [pipe-basics, builtin-pipes, locale-pipes, custom-pipe]
---
> **In one line:** Pass arguments to a pipe after colons, `date:'short'`, and chain pipes left to right, `date:'fullDate' | uppercase`.

## The idea

Most pipes have sensible defaults, but you often need to say *how* to format: which date style, which currency, how many decimals. Those settings are **arguments**, and each one follows a colon after the pipe name.

You can also feed one pipe's output straight into another. Chained pipes apply in order, left to right, and each receives the result of the one before it. It is like stacking filters: brighten, then warm the tone, then sharpen.

| Template | Result |
|---|---|
| `{{ today \| date }}` | the default date format |
| `{{ today \| date:'short' }}` | one argument |
| `{{ price \| currency:'USD':'symbol':'1.2-2' }}` | several arguments, in order |
| `{{ today \| date:'fullDate' \| uppercase }}` | a chain, left to right |

Argument order is fixed by the pipe, so check its documentation. For `currency` it is the currency code, then how to display it, then the digit format.

## See it

```typescript
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, DatePipe, PercentPipe, UpperCasePipe],
  template: `
    <h2>{{ product.name | uppercase }}</h2>
    <p>{{ product.price | currency:'USD':'symbol':'1.2-2' }}</p>
    <p>Save {{ product.discount | percent }}</p>
    <p>Released {{ product.releaseDate | date:'mediumDate' }}</p>
  `,
})
export class ProductCard {
  product = {
    name: 'Mechanical Keyboard',
    price: 129.99,
    discount: 0.15,      // stored as a decimal: 0.15 means 15%
    releaseDate: new Date('2025-09-01'),
  };
}
```

This shows `MECHANICAL KEYBOARD`, `$129.99`, `Save 15%` and `Released Sep 1, 2025`.

## Go deeper

The digit format `'1.2-2'` reads as `minIntegerDigits.minFractionDigits-maxFractionDigits`: at least one digit before the point, and exactly two after it. Storing percentages as decimals (`0.15`) lets the `percent` pipe do the conversion for you, so you never multiply by 100 by hand.

An argument can be any template expression, not just a literal. `date:format()` reads a signal, so the format can change at runtime. Wrap a chain in parentheses when you combine it with another operator, for example `(price | currency) + ' each'`.

## Watch out

- Using a comma between arguments. Pipe arguments are separated by colons.
- Getting the order wrong, such as putting the digit format before the currency code. Check the pipe's argument list.
- Chaining too many pipes. If the line is hard to read, compute the result in the class instead.

## Remember

- Arguments follow colons: `pipe:arg1:arg2`.
- Chained pipes apply left to right.
- Each pipe fixes its own argument order, so check the docs.

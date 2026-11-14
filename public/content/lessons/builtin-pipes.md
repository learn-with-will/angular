---
slug: builtin-pipes
title: "Built-in pipes"
topic: directives-pipes
kind: api
summary: "The pipes Angular ships for text, numbers, dates, collections and streams."
tags: [pipes, reference, formatting, common]
related: [pipe-basics, pipe-arguments-chaining, async-pipe, pure-and-impure-pipes]
---
> **In one line:** `@angular/common` provides ready-made pipes for the formatting you do most: text case, numbers, currency, percentages, dates, slicing and more.

## The idea

Before writing a custom pipe, check whether Angular already has it. Each built-in pipe lives in `@angular/common`, and each is its own class that you import by name, so unused ones cost nothing in your bundle.

| Pipe | Class | What it does |
|---|---|---|
| `uppercase`, `lowercase`, `titlecase` | `UpperCasePipe`, `LowerCasePipe`, `TitleCasePipe` | change text case |
| `number` | `DecimalPipe` | format a number with digits and grouping |
| `currency` | `CurrencyPipe` | format money for a currency and locale |
| `percent` | `PercentPipe` | turn `0.15` into `15%` |
| `date` | `DatePipe` | format a date or timestamp |
| `slice` | `SlicePipe` | take part of an array or string |
| `keyvalue` | `KeyValuePipe` | turn an object into key/value pairs to loop over |
| `json` | `JsonPipe` | show an object as JSON, for debugging |
| `async` | `AsyncPipe` | show the latest value of an Observable or Promise |

Notice that `number` is imported as `DecimalPipe`. The names do not always match, so use your editor's auto-import.

## See it

```typescript
@Component({
  selector: 'app-product-list',
  imports: [UpperCasePipe, CurrencyPipe, DatePipe, SlicePipe],
  template: `
    @for (p of products | slice:0:3; track p.name) {
      <article>
        <h3>{{ p.name | uppercase }}</h3>
        <p>{{ p.price | currency }} · {{ p.released | date:'mediumDate' }}</p>
      </article>
    }
  `,
})
export class ProductList {
  products = [
    { name: 'Keyboard', price: 89, released: new Date('2025-03-01') },
    { name: 'Mouse', price: 29, released: new Date('2025-04-12') },
    { name: 'Monitor', price: 249, released: new Date('2025-05-20') },
    { name: 'Webcam', price: 59, released: new Date('2025-06-02') },
  ];
}
```

The `slice` pipe in the loop header shows only the first three products. The fourth stays in the array but never renders.

## Go deeper

`keyvalue` is the one to reach for when you need to loop over an object's entries, since `@for` iterates arrays and iterables:

```html
@for (entry of settings | keyvalue; track entry.key) {
  <dt>{{ entry.key }}</dt>
  <dd>{{ entry.value }}</dd>
}
```

`json` is for debugging only: `<pre>{{ order | json }}</pre>` is a quick way to see what an object holds. Leave it out of production screens, because it is impure and re-runs on every change detection.

`slice`, `keyvalue`, `json` and `async` are the built-ins that are impure, which is covered in the lesson on pure and impure pipes.

## Watch out

- Importing the pipe by its template name. Import the class (`DecimalPipe`), not `number`.
- Leaving `json` in the UI. It re-runs constantly and is meant for debugging.
- Expecting `keyvalue` to keep your object's insertion order. It sorts by key by default.

## Remember

- Check the built-ins before writing a custom pipe, and import each class by name.
- `number` is `DecimalPipe`, and `keyvalue` lets you loop over an object.
- `json` is a debugging tool, not a production formatter.

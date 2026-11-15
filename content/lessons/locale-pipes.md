---
slug: locale-pipes
title: "Pipes and locales"
topic: directives-pipes
kind: technique
summary: "Format dates, numbers and currency for another region by registering locale data."
tags: [pipes, locale, i18n, formatting]
related: [pipe-arguments-chaining, pipes-in-typescript, builtin-pipes, pipe-basics]
---
> **In one line:** Pipes such as `date` and `currency` format for `en-US` unless you register another locale's data and provide `LOCALE_ID`.

## The idea

Dates, numbers and money are written differently around the world. One thousand two hundred thirty-four and a half is `1,234.5` in the United States and `1.234,5` in Germany. By default the formatting pipes use `en-US`, and Angular ships only that locale in your bundle to keep it small.

For any other region you do two things: register that locale's data, and tell Angular which locale the app uses through `LOCALE_ID`. After that, every formatting pipe follows it with no change to your templates.

| | `en-US` (default) | `de` |
|---|---|---|
| `{{ 1234.5 \| number }}` | 1,234.5 | 1.234,5 |
| `{{ 1234.5 \| currency:'EUR' }}` | €1,234.50 | 1.234,50 € |
| `{{ today \| date:'longDate' }}` | June 26, 2026 | 26. Juni 2026 |

## See it

```typescript
// main.ts
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { LOCALE_ID } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

registerLocaleData(localeDe);

bootstrapApplication(App, {
  providers: [{ provide: LOCALE_ID, useValue: 'de' }],
});
```

After this, `{{ price | currency:'EUR' }}` formats prices the German way throughout the app.

You can also pass a locale to a single pipe call, as its last argument, to format one value differently from the rest of the app. The locale must be registered the same way:

```html
<p>{{ price | currency:'EUR':'symbol':'1.2-2':'de' }}</p>
<p>{{ today | date:'longDate':'':'de' }}</p>
```

The empty string in the date example is the timezone argument, left at its default so the locale can be reached in the next position.

## Go deeper

`LOCALE_ID` is fixed for the whole app at startup. To let users switch language at runtime, you either reload with a different locale or pass a locale explicitly where it matters. The pipes accept a locale as a final argument, for example `{{ today | date:'longDate':'':'fr' }}`, but that locale must also be registered first.

A currency pipe formats the *number*, not the *money*. It does not convert `100` USD into euros. The currency code only chooses the symbol and the rules for decimals.

This is formatting only. Translating text into other languages is a separate feature called internationalization, and it works alongside what you registered here.

## Watch out

- Using `de`, `fr` or another locale in a pipe without registering it. Angular cannot find the data and throws.
- Expecting `currency:'EUR'` to convert amounts. It only changes how the number is displayed.
- Registering many locales you do not use. Each adds to your bundle; register only what the app needs.

## Remember

- The default locale is `en-US`; other regions need `registerLocaleData()` and `LOCALE_ID`.
- Pipes then follow the locale automatically.
- Locale changes how values look, not what they are; it neither converts nor translates.

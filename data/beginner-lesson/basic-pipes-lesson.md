---
title: "Basic Pipes in Angular"
level: "beginner"
estimatedTime: 25
tags:
  - angular
  - pipes
  - templates
  - formatting
  - data-transformation
---

# Learning Objectives

After completing this lesson, you will be able to:

- Explain what an Angular pipe is and when to reach for one.
- Use the most common built-in pipes (`uppercase`, `date`, `currency`, `number`, `percent`, `json`, `slice`, `async`) inside templates.
- Pass arguments to pipes and chain multiple pipes together.
- Import only the pipes you need into a standalone component.
- Recognize and avoid the most common pipe mistakes (missing imports, multiple subscriptions, misusing impure pipes).

# Why This Concept Exists

Most of the data your app holds is not in the exact shape a user wants to read. A timestamp is a raw `Date` object. A price is the number `129.99`. A discount is the decimal `0.15`. Showing those raw values directly is ugly and confusing.

You *could* transform every value inside your component class, but that quickly clutters your components with display-only formatting logic that has nothing to do with business rules. Pipes solve this by moving simple, reusable transformations **into the template, right next to where the value is displayed**. The original data stays untouched; only the displayed version changes.

In short, pipes give you a clean, declarative way to format values for display without writing repetitive formatting code.

# Concept Explanation

A **pipe** is a function you apply to a value in a template using the pipe operator `|`. It takes the value on its left, transforms it, and returns a new value for display. Crucially, pipes do **not** change the underlying data — they only change how it appears.

```html
{{ price | currency }}
```

Here `price` is the input value, `currency` is the pipe, and the result (`$129.99`) is what the user sees.

Angular ships with several built-in pipes from the `@angular/common` package:

- **Text:** `uppercase`, `lowercase`, `titlecase`
- **Numbers:** `number` (decimal), `currency`, `percent`
- **Dates:** `date`
- **Collections & utilities:** `slice`, `keyvalue`, `json`
- **Async:** `async` (subscribes to an Observable or Promise and returns its latest value)

Because modern Angular components are **standalone** (the default since Angular 19), each pipe must be explicitly imported into the component's `imports` array before its template can use it. This keeps your bundles small: you ship only the pipes you actually use.

Pipes also come in two flavors. **Pure** pipes (the default) only re-run when their input *reference* changes, which makes them fast. **Impure** pipes run on every change detection cycle. A few built-ins — `async`, `json`, `slice`, and `keyvalue` — are impure by design. You rarely need to think about this for basic usage, but it explains some surprising behavior later in this lesson.

# Key Terminology

- **Pipe** — A template feature that transforms a value for display using the `|` operator.
- **Pipe operator (`|`)** — The symbol that sends the value on its left into the pipe on its right.
- **Pipe argument (parameter)** — Extra configuration passed to a pipe using a colon, e.g. `date:'short'`.
- **Chaining** — Applying several pipes in sequence; the output of one becomes the input of the next.
- **Built-in pipe** — A pipe Angular provides out of the box (from `@angular/common`).
- **Custom pipe** — A pipe you create yourself by implementing the `PipeTransform` interface.
- **Pure pipe** — A pipe that only re-runs when its input reference changes (the default, and the fast choice).
- **Impure pipe** — A pipe that re-runs on every change detection cycle (e.g. `async`, `json`, `slice`).

# Syntax Overview

**Basic pipe usage** — value on the left, pipe on the right:

```html
{{ value | pipeName }}
```

**Pipe with one argument** — use a colon:

```html
{{ today | date:'short' }}
```

**Pipe with multiple arguments** — separate each with a colon:

```html
{{ price | currency:'USD':'symbol':'1.2-2' }}
```

**Chaining pipes** — applied left to right:

```html
{{ today | date:'fullDate' | uppercase }}
```

**Importing pipes into a standalone component:**

```typescript
import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-example',
  imports: [CurrencyPipe, DatePipe], // each pipe imported by name
  template: `{{ amount | currency }} on {{ when | date }}`,
})
export class ExampleComponent {
  amount = 49.5;
  when = new Date();
}
```

> Note: Since Angular 19, `standalone: true` is the default, so you no longer write it. If you are on an older version, add `standalone: true` to the `@Component` decorator.

# Real World Analogy

Think of a pipe like an **Instagram filter** on a photo. The original photo on your phone never changes — the filter only changes how the photo *looks* when you post it. You can even stack filters (chain them): brighten, then add a warm tone, then sharpen.

In the same way, a pipe leaves your underlying data exactly as it is and only changes how it's presented. And just like you can reapply the same filter to thousands of photos, you can reuse one pipe across your entire app.

# Examples

## 1. Basic Example — Formatting text and a date

This component greets a user. The name is stored in lowercase but displayed in uppercase, and the date is formatted into a friendly, readable form.

```typescript
import { Component } from '@angular/core';
import { UpperCasePipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-greeting',
  imports: [UpperCasePipe, DatePipe],
  template: `
    <h1>Welcome, {{ username | uppercase }}!</h1>
    <p>Today is {{ today | date:'fullDate' }}</p>
  `,
})
export class GreetingComponent {
  username = 'ada lovelace';
  today = new Date();
}
```

**What happens:**
- `{{ username | uppercase }}` displays `ADA LOVELACE` while the stored value remains `'ada lovelace'`.
- `{{ today | date:'fullDate' }}` turns the raw `Date` into something like `Friday, June 26, 2026`. The `'fullDate'` argument selects a built-in date format.
- Both `UpperCasePipe` and `DatePipe` are imported by name, so the template can use them.

## 2. Real-World Example — A product card

A realistic product display needs several formats at once: an uppercase title, a currency price, a percentage discount, and a release date. This is exactly what pipes are built for.

```typescript
import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe, PercentPipe, UpperCasePipe } from '@angular/common';

interface Product {
  name: string;
  price: number;
  discount: number; // stored as a decimal: 0.15 means 15%
  releaseDate: Date;
}

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, DatePipe, PercentPipe, UpperCasePipe],
  template: `
    <article class="card">
      <h2>{{ product.name | uppercase }}</h2>
      <p class="price">{{ product.price | currency:'USD':'symbol':'1.2-2' }}</p>
      <p class="discount">Save {{ product.discount | percent }}</p>
      <p class="released">Released {{ product.releaseDate | date:'mediumDate' }}</p>
    </article>
  `,
})
export class ProductCardComponent {
  product: Product = {
    name: 'Mechanical Keyboard',
    price: 129.99,
    discount: 0.15,
    releaseDate: new Date('2025-09-01'),
  };
}
```

**What happens:**
- `currency:'USD':'symbol':'1.2-2'` shows `$129.99`. The arguments are the currency code (`USD`), the display (`symbol`, so `$`), and the digit format `1.2-2`: at least **1** integer digit and between **2** and **2** fraction digits (`minIntegerDigits.minFractionDigits-maxFractionDigits`).
- `percent` converts the decimal `0.15` into `15%`. (Storing percentages as decimals lets the pipe do the conversion for you.)
- `date:'mediumDate'` produces something like `Sep 1, 2025`.
- Each pipe is imported individually so the bundle stays lean.

## 3. Best-Practice Example — The `async` pipe for streams

When a value comes from an `Observable` (for example, data over time or from an HTTP call), the **`async` pipe** is the recommended way to display it. It subscribes for you, shows the latest value, and — importantly — **unsubscribes automatically when the component is destroyed**, preventing memory leaks.

```typescript
import { Component } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { interval, map, Observable } from 'rxjs';

@Component({
  selector: 'app-clock',
  imports: [AsyncPipe, DatePipe],
  template: `
    @if (now$ | async; as now) {
      <p>Current time: {{ now | date:'mediumTime' }}</p>
    } @else {
      <p>Loading…</p>
    }
  `,
})
export class ClockComponent {
  // Emits the current Date once every second.
  now$: Observable<Date> = interval(1000).pipe(map(() => new Date()));
}
```

**Why this is best practice:**
- No manual `subscribe()` and no manual `unsubscribe()` — the `async` pipe handles the whole lifecycle.
- Using `@if (now$ | async; as now)` creates **one** subscription and stores the emitted value in the local variable `now`. This avoids the common mistake of writing `now$ | async` multiple times (which would create multiple subscriptions).
- The result is then chained into `date:'mediumTime'` to display a clean time like `2:45:09 PM`, while the `@else` block shows a loading state until the first value arrives.

# Common Mistakes

- **Forgetting to import the pipe.** In standalone components you must add the pipe to `imports`. If you see `No pipe found with name 'currency'`, you forgot to import `CurrencyPipe`. Add it to the `imports` array.
- **Trying to use a pipe in the TypeScript class.** Pipes are a *template* feature. You cannot write `'hello' | uppercase` in your component code. For formatting in TypeScript, use the underlying functions such as `formatDate`, `formatCurrency`, or `formatNumber` from `@angular/common`.
- **Using `| async` more than once on the same Observable.** Each occurrence creates a new subscription (and possibly a new HTTP request). Subscribe once with `@if (data$ | async; as data)` and reuse the alias.
- **Expecting impure pipes to be free.** `json`, `slice`, and `keyvalue` are impure and run on every change detection cycle. Use `json` for debugging only, never in production UI.
- **Mutating an array/object in place and expecting the pipe to update.** Pure pipes detect a *new reference*, not an in-place change. Replace the array (`this.items = [...this.items, newItem]`) instead of pushing into it.
- **Using a non-default locale without registering it.** Pipes like `date` and `currency` default to the `en-US` locale. To format in another locale you must register that locale's data — see Best Practices below.

# Best Practices

- **Import only the pipes you use.** Import individual pipes (`DatePipe`, `CurrencyPipe`, …) rather than the whole `CommonModule`. This keeps bundles smaller and intent clearer.
- **Prefer the `async` pipe for Observables and Promises.** It removes an entire class of subscription-management bugs and memory leaks.
- **Keep pipe expressions simple.** Pipes are for lightweight, display-only formatting. If a transformation is heavy or involves business logic, compute it in the component (for example with a `computed` signal) and bind the result.
- **Favor pure pipes.** Pure is the default and the fast path. Only make a pipe impure when it genuinely must react to mutations you cannot avoid.
- **Register locale data when formatting for other regions.** For non-`en-US` formatting, register the locale and provide `LOCALE_ID`:

  ```typescript
  // main.ts
  import { registerLocaleData } from '@angular/common';
  import localeDe from '@angular/common/locales/de';
  import { LOCALE_ID } from '@angular/core';
  import { bootstrapApplication } from '@angular/platform-browser';
  import { AppComponent } from './app/app.component';

  registerLocaleData(localeDe);

  bootstrapApplication(AppComponent, {
    providers: [{ provide: LOCALE_ID, useValue: 'de' }],
  });
  ```

  After this, `{{ price | currency:'EUR' }}` formats prices the German way.
- **Reuse logic with a custom pipe.** When you repeat the same formatting in many places, extract it into a custom pipe implementing `PipeTransform`. Keep it pure and free of side effects.

# Summary

- A **pipe** transforms a value for display in a template using the `|` operator, without changing the underlying data.
- Angular provides built-in pipes for text, numbers, currency, percentages, dates, slicing, and async values, all from `@angular/common`.
- In standalone components, **import each pipe** into the `imports` array before using it.
- Pass **arguments** with colons (`date:'short'`) and **chain** pipes left to right.
- The `currency`, `number`, and `percent` pipes use a `digitsInfo` format like `'1.2-2'` to control digits.
- The **`async` pipe** subscribes to Observables/Promises and unsubscribes automatically — use it instead of manual subscriptions.
- Use the `@if (stream$ | async; as value)` pattern to subscribe **once** and reuse the value.
- **Pure pipes** (the default) re-run only on reference changes; **impure pipes** (`async`, `json`, `slice`, `keyvalue`) run every cycle.
- Use `json` for debugging only, and avoid heavy logic inside pipes.
- For non-default locales, **register locale data** and provide `LOCALE_ID`.

# Flash Cards

Q: What is an Angular pipe?
A: A template feature, applied with the `|` operator, that transforms a value for display without modifying the underlying data.

Q: How do you pass arguments to a pipe?
A: With a colon after the pipe name, e.g. `{{ today | date:'short' }}`. Multiple arguments are chained with more colons: `currency:'USD':'symbol':'1.2-2'`.

Q: In a standalone component, what must you do before using `CurrencyPipe` in the template?
A: Import it and add it to the component's `imports` array: `imports: [CurrencyPipe]`.

Q: Why is the `async` pipe recommended for Observables?
A: It subscribes automatically, displays the latest emitted value, and unsubscribes when the component is destroyed — preventing memory leaks and removing manual subscription code.

Q: What is the difference between a pure and an impure pipe?
A: A pure pipe (the default) only re-runs when its input reference changes, making it fast. An impure pipe (e.g. `async`, `json`, `slice`) re-runs on every change detection cycle.

# Exercises

## Easy

Create a standalone component called `UserBadgeComponent` that displays a person's name in title case and their account balance formatted as US currency with two decimal places. Use the `TitleCasePipe` and `CurrencyPipe`. Start from this data:

```typescript
name = 'grace hopper';
balance = 1840.5;
```

*Expected output (roughly):* `Grace Hopper — $1,840.50`

## Medium

Build a `ProductListComponent` that renders a list of products using the `@for` control-flow block. For each product display the name in uppercase, the price as currency, and the release date with `date:'mediumDate'`. Then use the `slice` pipe so the list shows **only the first 3 products**.

Hints:
- Import `UpperCasePipe`, `CurrencyPipe`, `DatePipe`, and `SlicePipe`.
- Apply the slice pipe in the `@for` expression: `@for (p of products | slice:0:3; track p.name) { … }`.

## Challenging

Create a custom pipe named `truncate` that shortens a long string and appends `…` if it exceeds a maximum length. It should accept the max length as an argument (default `20`).

Starter signature:

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' }) // standalone & pure by default
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength: number = 20): string {
    // Your implementation here.
    // If value.length <= maxLength, return it unchanged.
    // Otherwise return the first maxLength characters plus '…'.
    return value;
  }
}
```

Then use it in a component:

```html
<p>{{ description | truncate:50 }}</p>
```

Stretch goal: make the cutoff break on the nearest word boundary instead of mid-word.

# Further Reading

- **Angular — Pipes overview:** https://angular.dev/guide/templates/pipes
- **Angular — Creating custom pipes:** https://angular.dev/guide/templates/pipes (see the "custom pipes" section)
- **Angular API — `DatePipe`:** https://angular.dev/api/common/DatePipe
- **Angular API — `CurrencyPipe`:** https://angular.dev/api/common/CurrencyPipe
- **Angular API — `AsyncPipe`:** https://angular.dev/api/common/AsyncPipe
- **Angular — Standalone components:** https://angular.dev/guide/components/importing
- **Angular — Internationalization (locale data for `date`/`currency`):** https://angular.dev/guide/i18n

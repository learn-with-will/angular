---
slug: template-expressions
title: "Template expressions"
topic: templates
kind: concept
summary: "The restricted JavaScript you can write inside bindings, and how to work around its limits."
tags: [templates, expressions, binding]
related: [interpolation, property-binding, signals-in-templates, event-binding]
---
> **In one line:** A template expression looks like JavaScript but is deliberately restricted: it reads data from the component and must not change anything.

## The idea

Everything between the quotes of a binding, or between `{{ }}`, is a **template expression**. Angular evaluates it against the component instance, not against the global scope. That is why it is a safe, predictable subset of JavaScript: an expression can look at your component's data, and that is about all it can do.

| Allowed | Not allowed |
|---|---|
| `price() * quantity()` | `new Date()` |
| `user.name` | `count++`, `a = b` (outside event bindings) |
| `isOn() ? 'on' : 'off'` | chained statements with `;` |
| `items().length` | globals such as `window`, `document`, `console` |

Statements with side effects are only allowed in **event bindings**, where `(click)="open.set(true)"` is expected to change state. Event bindings may even chain two statements: `(click)="save(); close()"`. Everywhere else the rule is: reading is fine, changing is not.

Several conveniences do work inside expressions: the ternary `a ? b : c`, optional chaining `user()?.name`, nullish coalescing `name() ?? 'Guest'`, and pipes such as `price() | currency`.

The restriction has a purpose. Angular may evaluate an expression many times (on every change-detection pass), so it must give the same answer each time and leave no trace.

## See it

If you need something the template cannot reach, such as `Math.max`, compute it in the class:

```typescript
@Component({
  selector: 'app-scores',
  template: `<p>Best score: {{ best() }}</p>`,
})
export class Scores {
  protected readonly scores = signal([3, 9, 4]);

  // Math lives in the class, not in the template
  protected readonly best = computed(() => Math.max(...this.scores()));
}
```

The template stays a plain read, and the logic lives where it can be tested. The conveniences from above keep simple cases short:

```html
<p>Hello, {{ user()?.name ?? 'Guest' }}</p>
<p>{{ isOn() ? 'Light is on' : 'Light is off' }}</p>
<p>{{ price() | currency }}</p>
```

## Go deeper

The same rule explains why a method call in `{{ }}` is a code smell. It is *allowed*, but it runs on every change-detection pass, even when nothing it uses has changed:

```html
<!-- Before: recalculated on every check -->
<p>{{ expensiveTotal() }}</p>

<!-- After: a computed signal, cached until its inputs change -->
<p>{{ total() }}</p>
```

A `computed()` gives you the same readable template with the result cached. The test of a good expression is whether you could evaluate it twice in a row and get the same answer with nothing else changing. If it fails that test, it belongs in a method that an event handler calls, not in a binding.

## Watch out

- Do not put heavy work inside `{{ }}`. A method call there runs on every change detection. Derive the value once with `computed()` instead.
- Keep expressions short and free of side effects. Reading data is their only job.
- You cannot use `new`, so build values (a `Date`, a `Set`) in the class and expose the result.

## Remember

- Expressions run against the component, not the global scope.
- No `new`, no `++`, no assignments (except in events), no `;`.
- Do real calculations in the class, ideally in a `computed()`.

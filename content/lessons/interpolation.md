---
slug: interpolation
title: "Interpolation: {{ }}"
topic: templates
kind: api
summary: "Render a component value into the page as text with double curly braces."
tags: [templates, binding, text]
related: [property-binding, template-expressions, signals-in-templates]
---
> **In one line:** `{{ expression }}` evaluates an expression and renders the result as **text** in the template. Angular keeps it up to date.

## The idea

A web page is static HTML until you need to show something that changes: a username, a cart count. You could reach for the DOM (`querySelector(...).textContent = ...`), but then you must find the element, update it, and remember to do it again every time the data changes. That bookkeeping is where bugs live.

Angular lets you *declare* the relationship once and keeps the DOM in sync for you. Interpolation is the simplest form of that: a read-only display screen. The component sets the value, the template shows it, and the reader cannot change it by looking.

Whatever the expression returns is converted to a string. When the expression reads a signal, Angular re-renders just that piece of text when the signal changes.

| Template | Renders (`name = 'Ada'`, `qty = 3`) |
|---|---|
| `Hello, {{ name() }}!` | Hello, Ada! |
| `{{ qty() * 2 }}` | 6 |
| `{{ qty() > 2 ? 'many' : 'few' }}` | many |

## See it

```typescript
@Component({
  selector: 'app-profile-card',
  template: `
    <h1>Hello, {{ name() }}!</h1>
    <p>You have {{ messageCount() }} new messages.</p>
  `,
})
export class ProfileCard {
  protected readonly name = signal('Ada');
  protected readonly messageCount = signal(3);
}
```

Note the parentheses: `name` is a signal, so you *call* it to read its value. Pipes format the result, and they must be imported in a standalone component:

```typescript
@Component({
  selector: 'app-price',
  imports: [CurrencyPipe],
  template: `Total: {{ total() | currency }}`,
})
export class Price {
  protected readonly total = signal(42.5);
}
```

## Go deeper

Interpolation always renders **text**. If a value contains HTML such as `<b>hi</b>`, Angular escapes it and the user sees the literal characters, which is what stops injected markup from running.

You can also use interpolation inside an attribute value, as in `<img alt="Avatar of {{ name() }}">`. It still produces a string, which is why it is fine for text-like attributes and the wrong tool for booleans or numbers.

When a value is `null` or `undefined`, interpolation renders nothing rather than the words "null" or "undefined", so an optional value simply leaves a gap. Pair it with a fallback when the gap would look wrong: `{{ nickname() ?? 'Anonymous' }}`.

## Watch out

- `[disabled]="{{ isSaving() }}"` is invalid. Brackets already take an expression, so use `[disabled]="isSaving()"`.
- Interpolation always produces text. To set a boolean, number or object on an element, use property binding instead.
- Forgetting the call renders the signal object, not its value: `{{ name }}` instead of `{{ name() }}`.

## Remember

- `{{ expr }}` renders the expression's result as text.
- Read signals by calling them: `{{ count() }}`.
- Use interpolation for text, and property binding for everything else.

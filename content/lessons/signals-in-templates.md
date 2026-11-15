---
slug: signals-in-templates
title: "Reading signals in templates"
topic: signals
kind: technique
summary: "Call a signal inside a template and Angular re-renders exactly that expression when it changes."
tags: [signals, templates, binding]
related: [signal, computed, interpolation, if-block]
since: "17"
---
> **In one line:** Read a signal in a template by calling it, `{{ count() }}`, and Angular updates just that expression whenever the value changes.

## The idea

A template is a reactive context. When it calls `count()`, Angular records the read, so it knows which parts of the page depend on which signals. There is no subscription to manage, no pipe to add, and no manual refresh.

The rule is the same everywhere in a template: **call the signal**. Reads use the parentheses; writes call `.set()` or `.update()` on the signal itself, which is why the click handler below has no `count()` around it.

| Where | What you write |
|---|---|
| Interpolation | `{{ count() }}` |
| Property binding | `[disabled]="count() === 0"` |
| Control flow | `@if (count() > 5) { … }` |
| Writing from an event | `(click)="count.update(n => n + 1)"` |

Because only the expressions that read `count()` are re-evaluated, a page with hundreds of bindings updates just the ones whose signals changed. That is fine-grained reactivity at the level of a single binding.

It works the same inside control flow. `@for (todo of todos(); track todo.id)` reads the signal in the loop header, so the list re-renders when the array is replaced, and each row can read other signals of its own. The same goes for `@if` and `@switch` conditions: whatever signal they call becomes the thing they depend on.

## See it

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <p>{{ count() }}</p>
    @if (count() > 5) {
      <p>That's a lot!</p>
    }
    <button (click)="count.update(n => n + 1)">+1</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);
}
```

## Go deeper

Keep template expressions short. When a binding needs real logic, calculate it once in the class with `computed()` and read the result. The computed caches its answer, while an inline expression runs again on every check:

```html
<!-- Before: logic in the template, re-evaluated on every check -->
<p>{{ items().filter(i => !i.done).length }} left</p>

<!-- After: derived once in the class, cached -->
<p>{{ remaining() }} left</p>
```

```typescript
protected readonly remaining = computed(() => this.items().filter(i => !i.done).length);
```

Writes from a template should stay tiny. A one-liner like `(click)="count.update(n => n + 1)"` is fine; the moment a handler needs two steps or a condition, call a method on the class instead. That keeps the template readable and the logic testable.

## Watch out

- `{{ count }}` without parentheses renders the signal object itself, and the compiler warns that the signal was not called.
- Heavy logic inside `{{ }}` runs again and again. Move it into a `computed()`.
- Reading a signal in a template does not need `async` or any pipe. Do not wrap it in one.

## Remember

- In a template, read a signal by calling it: `count()`.
- Angular tracks each read and re-renders only the expressions that used it.
- Do calculations in `computed()`, not inline in the template.

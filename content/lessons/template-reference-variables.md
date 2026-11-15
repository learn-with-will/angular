---
slug: template-reference-variables
title: "Template reference variables: #ref"
topic: templates
kind: api
summary: "Give an element a name inside its template, then read it from other bindings with no component code."
tags: [templates, events, references]
related: [event-binding, event-object, key-event-modifiers, template-expressions]
---
> **In one line:** `#name` gives an element (or directive) a name that other bindings in the same template can use directly.

## The idea

Sometimes the only thing a handler needs is the current value of another element. Instead of wiring up an `(input)` handler, a signal and a cast, name the element and read it where you need it. It is a label on a door: anyone in the same building can refer to "the search box" without a map.

`#query` on an `<input>` makes `query` the input element itself, so `query.value` is whatever the user typed. The name is available to every binding in the same template.

| You write | `name` refers to |
|---|---|
| `#name` | the element (or the component, if placed on one) |
| `#name="exportName"` | the directive instance that exports that name, e.g. `#f="ngForm"` |

## See it

```html
<input #query placeholder="Search..." (keyup.enter)="search(query.value)" />
<button (click)="search(query.value)">Search</button>
```

Both the Enter key and the button pass the live input value to `search()`. There is no extra signal and no `$event` cast. The component only needs the method:

```typescript
@Component({
  selector: 'app-search',
  template: `
    <input #query placeholder="Search..." (keyup.enter)="search(query.value)" />
    <button (click)="search(query.value)">Search</button>
    <p>Last search: {{ last() }}</p>
  `,
})
export class Search {
  protected readonly last = signal('');

  search(term: string): void {
    this.last.set(term);
  }
}
```

## Go deeper

Template variables shine for DOM calls that need no state at all, such as moving focus:

```html
<input #q placeholder="Search..." />
<button (click)="q.focus()">Focus the search box</button>
```

Scope follows the template's structure. A variable declared outside an `@if` or `@for` block is visible inside it, but one declared *inside* a block is only visible within that block.

Placed on a component, `#name` refers to the component instance, so a parent template can call its public methods: `<app-player #player /> <button (click)="player.play()">Play</button>`.

The `#f="ngForm"` form is how templates reach a directive's API. `ngForm` exports itself under that name, so `f.valid` and `f.value` become available in the template. You will meet it again with forms.

Names must be unique within a template: declaring `#query` twice in the same scope is a compile error, so give each element a distinct, descriptive name such as `#searchBox` rather than a generic `#el`.

## Watch out

- A template variable is visible only inside the template that declares it. Another component's template cannot see it, and neither can the class unless you pass it as an argument.
- The value is read at the moment the event fires. If other code needs to react to every keystroke, use a signal instead.

## Remember

- `#name` names an element for the rest of the template.
- `#name="exportName"` gives you a directive instead of the element.
- It is a shortcut for reading values, not a replacement for state.

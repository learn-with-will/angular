---
slug: if-block
title: "@if, @else if, @else"
topic: templates
kind: api
summary: "Render part of a template only when a condition is true, with optional else branches."
tags: [templates, control-flow, conditional-rendering]
related: [switch-block, for-block, signals-in-templates, template-expressions]
since: "18"
---
> **In one line:** `@if (condition) { … }` renders a block only while the condition is truthy; add `@else if` and `@else` for the alternatives.

## The idea

Control flow decides *what* renders. Show a button only when the user is logged in, a different screen while data loads, an empty state when there is nothing to show. Angular's built-in blocks are part of the template compiler itself, so there is nothing to import (no `CommonModule`), and the braces make nesting easy to read.

They replace the old `*ngIf`, `*ngFor` and `*ngSwitch` directives, which still work but are not recommended for new code. The old syntax had friction: the leading `*`, the `; else templateRef` pattern, and an import in every component.

| Old | New |
|---|---|
| `*ngIf="ok; else other"` plus an `<ng-template>` | `@if (ok) { … } @else { … }` |
| needs `CommonModule` / `NgIf` | built in |

The condition can be any expression, and when it reads a signal Angular re-renders only this block when the signal changes. There are three control-flow blocks, and picking the right one is mostly a matter of what you are deciding:

```tree
What do you need to render?
  Only sometimes
    [@if] Conditional block | with optional `@else` @blue
  One of several
    [@switch] Pick a branch | `@case` and `@default` @green
  Once per item
    [@for] Repeat a block | needs `track` @amber
```

## See it

```html
@if (isLoggedIn()) {
  <p>Welcome back!</p>
} @else if (isGuest()) {
  <p>Browsing as a guest.</p>
} @else {
  <p>Please log in to continue.</p>
}
```

Combined with a signal, the whole thing is a few lines:

```typescript
@Component({
  selector: 'app-login-status',
  template: `
    <button (click)="isLoggedIn.set(!isLoggedIn())">Toggle login</button>
    @if (isLoggedIn()) { <p>Welcome back!</p> } @else { <p>Please log in.</p> }
  `,
})
export class LoginStatus {
  protected readonly isLoggedIn = signal(false);
}
```

## Go deeper

Save the condition's value with `as` so you can reuse it inside the block:

```html
@if (user().address; as address) {
  <p>{{ address.city }}, {{ address.country }}</p>
}
```

The alias also narrows the type: inside the block, `address` is known to be truthy, so you do not need `?.` to reach into it. This is also the tidy way to avoid calling the same expression twice: evaluate once in the `@if` header, then use the alias everywhere inside.

## Watch out

- An expensive function call in the condition runs on every change detection. Move it into a `computed()`.
- Do not import `CommonModule` just for `@if`; you only need imports for pipes and directives you actually use.
- Prefer `@switch` over a long `@else if` chain when every branch tests the same value.

## Remember

- `@if`, `@else if` and `@else` are built into the compiler, with no imports.
- `as` stores the condition's value in a variable for the block.
- Read signals in conditions by calling them: `@if (open())`.

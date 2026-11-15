---
slug: switch-block
title: "@switch"
topic: templates
kind: api
summary: "Pick exactly one branch of the template from a single value, with strict matching and no fallthrough."
tags: [templates, control-flow, conditional-rendering]
related: [if-block, for-block, signals-in-templates, template-expressions]
since: "18"
---
> **In one line:** `@switch (value) { @case (x) { … } @default { … } }` renders exactly one branch. It matches with `===` and never falls through.

## The idea

When you branch on a *single* value, a long `@if` / `@else if` chain gets noisy, with the same expression repeated in every condition. `@switch` reads better, and it is the natural fit for UI states such as loading, error and loaded.

Think of a host reading a guest's ticket type (VIP, standard, staff) and sending them down exactly one matching hallway, with a "please see reception" fallback for anything unexpected. That fallback is `@default`.

| | Old `*ngSwitch` | `@switch` |
|---|---|---|
| Comparison | loose `==` | strict `===` |
| Fallthrough | no | no, so no `break` |
| No match, no default | nothing renders | nothing renders |

The strict comparison is the one to remember: `@case ('1')` does **not** match the number `1`.

## See it

```html
@switch (state()) {
  @case ('loading') {
    <p>Loading your todos…</p>
  }
  @case ('error') {
    <p>Could not load todos. Please retry.</p>
  }
  @case ('loaded') {
    <p>{{ remaining() }} todos remaining</p>
  }
  @default {
    <p>Unknown state.</p>
  }
}
```

The value behind it is usually a union type held in a signal:

```typescript
type LoadState = 'loading' | 'error' | 'loaded';

protected readonly state = signal<LoadState>('loading');
```

Because the signal is typed as a union, the editor can check that every `@case` is a value the state can actually take.

## Go deeper

When the switched value is a union type, `@default never;` asks the compiler to prove every case is handled, so adding a new value later fails to compile until you add its `@case`. It needs a recent Angular version: Angular 20's compiler does not accept it, so check yours first.

`@switch` pairs well with `@if` inside a branch. Use `@switch` for the top-level state and `@if` for small details within it.

How to choose between them:

| Situation | Reach for |
|---|---|
| One yes/no condition | `@if` |
| Two or three unrelated conditions | `@if` / `@else if` |
| Many outcomes of **one** value | `@switch` |

If you find yourself repeating the same expression in every `@else if`, that is the sign to switch to `@switch`.

## Watch out

- Each `@case` is its own block, and an empty one renders nothing. If several values need the same content, move that content into a small component or an `<ng-template>` and render it from each case.
- Migrating from `*ngSwitch` changes `==` to `===`, so review every `@switch` the schematic produces.
- With no matching `@case` and no `@default`, nothing renders. Add a `@default` for states you did not expect.

## Remember

- `@switch` picks one branch by strict `===`; `@default` is the fallback.
- There is no fallthrough, so there is no `break`.
- Prefer it over long `@else if` chains when branching on one value.

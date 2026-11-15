---
slug: for-context-variables
title: "@for context variables"
topic: templates
kind: api
summary: "Use $index, $first, $last and friends inside @for, and alias them with let."
tags: [templates, control-flow, lists]
related: [for-block, track-expressions, if-block]
since: "18"
---
> **In one line:** Inside `@for` you get `$index`, `$count`, `$first`, `$last`, `$even` and `$odd`; alias them with `let` when you want clearer names.

## The idea

Each iteration knows where it is in the list. Those facts are available as implicit variables, so you can number rows, style the first one, stripe alternating rows, or skip a divider after the last.

| Variable | Value |
|---|---|
| `$index` | zero-based position of the current item |
| `$count` | total number of items |
| `$first` / `$last` | `true` for the first / last item |
| `$even` / `$odd` | `true` for even / odd positions |

You can use them as they are. Alias them with `let` when a clearer name helps, or when nested loops would otherwise shadow `$index`. Several aliases are separated with commas inside one `let`. A name like `isLast` reads like a sentence in the template (`@if (!isLast)`), which is the real reason to alias even when nothing is shadowed.

These variables exist only inside the repeated block. The `@empty` block runs when there are no items, so there is no current item and no position to report there.

These variables describe *position*. They never replace the `track` expression, which is about identity; keeping the two ideas apart avoids the classic mistake of tracking by `$index`.

The variables cover the usual list chores:

| Goal | How |
|---|---|
| Number the rows | `{{ $index + 1 }}` |
| Style the first row | `[class.first]="$first"` |
| Stripe rows | `[class.striped]="$even"` |
| Skip the separator after the last item | `@if (!$last) { <hr /> }` |
| Show "3 of 12" | `{{ $index + 1 }} of {{ $count }}` |

## See it

```html
@for (item of items(); track item.id; let i = $index, isLast = $last) {
  <p>{{ i + 1 }}. {{ item.name }}</p>

  @if (!isLast) {
    <hr />
  }
}
```

Striped rows use `$even` together with a class binding:

```html
@for (row of rows(); track row.id) {
  <tr [class.striped]="$even">
    <td>{{ $index + 1 }}</td>
    <td>{{ row.name }}</td>
  </tr>
} @empty {
  <tr><td colspan="2">No rows.</td></tr>
}
```

## Go deeper

`$count` is handy for "item 3 of 12" labels, and `$first` suits things like a heading that only the first entry needs. All of these are plain expressions, so you can combine them: `[class.last-odd]="$last && $odd"`.

In nested loops each level has its own variables, and the inner `$index` hides the outer one. Alias them to keep both reachable.

```html
@for (group of groups(); track group.id; let g = $index) {
  @for (item of group.items; track item.id; let i = $index) {
    <p>{{ g + 1 }}.{{ i + 1 }} {{ item.name }}</p>
  }
}
```

## Watch out

- `$index` being handy is not a reason to `track $index`. Track by a stable id.
- In nested loops, alias each level's `$index` (`let row = $index`, `let col = $index`) so you can tell them apart.

## Remember

- The implicit variables are `$index`, `$count`, `$first`, `$last`, `$even` and `$odd`.
- Alias them with `let name = $variable`, comma-separated.
- They describe position; they are not a track key.

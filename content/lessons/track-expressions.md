---
slug: track-expressions
title: "Choosing a track expression"
topic: templates
kind: technique
summary: "Track by a stable id so Angular reuses the right DOM nodes when a list changes."
tags: [templates, control-flow, performance, lists]
related: [for-block, for-context-variables, pitfall-mutating-signal-array]
since: "18"
---
> **In one line:** `track` tells Angular which item is which. Track by a stable, unique id, and use `$index` only for lists that never change.

## The idea

When the list changes, Angular matches new items to old ones using the `track` value. Matches keep their DOM nodes, and with them the text typed into an input, the focus, running animations; only the new, moved or removed rows are touched. A wrong key makes Angular reuse the wrong nodes, which shows up as stale data or lost focus. The key is read for every item on every update, so keep it a plain property read rather than anything that does work.

Think of a restaurant host who seats guests using their name tags. If one guest leaves, the host adjusts one seat instead of re-seating the whole line. Tracking by `$index` is like identifying guests by *position in the queue*: when someone steps out, everyone behind shifts and gets mistaken for the person before them.

| Track by | What can go wrong |
|---|---|
| `item.id` | nothing, as long as your data has a unique `id` |
| `item` | duplicate values break the identity |
| `$index` | wrong DOM reuse on any insert, sort or filter |

Which one to use depends on what you are looping over:

```tree
What are you looping over?
  Objects with a unique id
    [id] Track by the id | `track item.id` @green
  Unique strings or numbers
    [value] Track the value | `track item` @blue
  A list that never changes
    [index] Track by position | `track $index` @amber
  Objects with no id
    [!] Add an id first | then track by it @red
```

## See it

```html
<!-- Before: after a reorder, row 1's typed text sticks to whatever is now first -->
@for (t of todos(); track $index) {
  <li><input [value]="t.title" /></li>
}

<!-- After: each row keeps its own node, whatever its position -->
@for (t of todos(); track t.id) {
  <li><input [value]="t.title" /></li>
}
```

For a list of unique strings or numbers the value is its own identity:

```html
@for (tag of tags(); track tag) {
  <span class="chip">{{ tag }}</span>
}
```

## Go deeper

A good key has three qualities. It is **unique** within the list, **stable** for the same item across updates, and **cheap** to read. A database id, a slug or an email address usually qualifies; the item's position, its array index or a random number does not.

Tracking by a *method call* or a new object each time defeats the purpose: `track getKey(item)` that returns a fresh value on every pass makes every row look new, and Angular rebuilds the list on each change. The key must be stable for the same item.

If your data comes from a server without ids, derive a stable key from the fields that are unique (an email, a slug) rather than falling back to `$index`.

## Watch out

- If your data has no `id`, add one to the model. Tracking by `$index` "just to make it compile" hides bugs.
- Running `ng generate @angular/core:control-flow` picks a fallback `track` where `*ngFor` had no `trackBy`. Review every one after migrating.
- Duplicate keys in one list confuse the matching. Keep tracked values unique.

## Remember

- Track by a stable, unique id: `track item.id`.
- `track $index` is only safe for static lists.
- A bad track key causes stale rows and lost input focus.

---
slug: flattening-operators
title: "switchMap, mergeMap, concatMap, exhaustMap"
topic: rxjs
kind: concept
summary: "Four ways to answer one question: what if a new value arrives while the previous async work is still running?"
tags: [rxjs, switchmap, mergemap, concatmap, exhaustmap]
related: [switchmap-typeahead, exhaustmap-submit, pitfall-rxjs-misuse, pipe-and-operators]
---
> **In one line:** All four start an inner Observable per value. They differ only in what they do when a new value arrives while the previous inner one is still running.

## The idea

Mapping a value to an Observable, such as a search term to an HTTP request, gives an Observable *of* Observables. Flattening turns that back into one stream. The real design decision is concurrency:

| Operator | New value arrives while one is running | Pick it for |
|---|---|---|
| `switchMap` | **cancels** the old one, starts the new | typeahead, route-driven loads |
| `mergeMap` | runs **all concurrently**, results in any order | independent work, such as several uploads |
| `concatMap` | **queues**, one at a time, in order | ordered writes, sequences of edits |
| `exhaustMap` | **ignores** the new value until the current finishes | submit buttons, refresh actions |

```tree
New value arrives while inner is running | what should happen? @primary
  switchMap | cancel old, use new @blue
  mergeMap | run both in parallel @green
  concatMap | wait in line @amber
  exhaustMap | ignore the new one @red
```

Ask which of the four sentences in the table you mean, and the operator follows. Habit is the wrong guide here.

## See it

```typescript
// Only the latest search matters: cancel stale requests
term$.pipe(switchMap((t) => this.api.search(t)));

// Independent uploads: run them together
files$.pipe(mergeMap((f) => this.api.upload(f)));

// Edits must reach the server in order
edits$.pipe(concatMap((e) => this.api.save(e)));

// A second click while saving must do nothing
save$.pipe(exhaustMap(() => this.api.save(form())));
```

## Go deeper

The wrong choice produces specific, recognisable bugs. `mergeMap` for search lets a slow response to an *earlier* keystroke arrive after a faster later one and overwrite the right results. `switchMap` for saves **cancels** the first save when the user clicks twice, so data is lost. `exhaustMap` for search silently drops the latest keystroke while a request runs. `concatMap` for unrelated uploads serialises work that could have been parallel.

`mergeMap` accepts a second argument to cap concurrency: `mergeMap(fn, 3)` runs at most three at once, which protects a server from a flood of simultaneous requests.

`switchMap` cancels by unsubscribing. For HTTP that aborts the request in the browser, but the server may still have received and processed it, so cancellation is not an undo for writes.

A mental shortcut helps when you are unsure: ask what the user would see if two triggers happened at the same instant. For search, they want the *latest* answer, so switch. For a "refresh" button, a second press mid-refresh should do nothing, so exhaust. For a chat message list, every message must go out in order, so concat. For ten thumbnails loading together, parallel is fine, so merge.

If you cannot decide, the operator is probably hiding a requirement you have not written down yet. Settle the requirement first, and the choice becomes mechanical.

## Watch out

- Using `switchMap` for saves, which cancels earlier submissions.
- Using `mergeMap` for search, which allows stale results to win.
- Choosing `concatMap` everywhere "to be safe", which slows independent work.

## Remember

- Switch cancels, merge parallelises, concat queues, exhaust ignores.
- Choose by the concurrency you want, not by habit.
- Cancelling an HTTP write does not undo it on the server.

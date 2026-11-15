---
slug: catch-error-placement
title: "Where to put catchError"
topic: rxjs
kind: technique
summary: "catchError inside the inner Observable keeps a long-lived stream alive; outside, one error ends it for good."
tags: [rxjs, catcherror, errors, switchmap]
related: [switchmap-typeahead, exhaustmap-submit, http-error-response, flattening-operators]
---
> **In one line:** Put `catchError` on the *inner* request, inside the flattening operator. Placed on the outer stream, the first error ends it permanently.

## The idea

By the Observable contract, an error **terminates** the stream. After it, nothing more is emitted. That is fine for a one-off request, and disastrous for a long-lived stream such as a search box's `valueChanges`.

Where the handler sits decides what dies:

| Placement | What an HTTP failure does |
|---|---|
| inside `switchMap` (inner) | that one request is replaced by a fallback; the outer stream keeps working |
| after `switchMap` (outer) | the outer stream is replaced and ends; the search box stops working for every later keystroke |

```tree
valueChanges | outer stream, lives as long as the page @primary
  switchMap | starts one inner request per value @blue
    http.get | inner stream, ends after one response @amber
      catchError | here: only this request is rescued @green
```

## See it

```typescript
// Before: one failed request kills the search for good
term$.pipe(
  switchMap((t) => this.http.get<Book[]>('/api/books', { params: { q: t } })),
  catchError(() => of([])),            // outer: the stream completes after this
);

// After: the failure is contained; later keystrokes still search
term$.pipe(
  switchMap((t) =>
    this.http.get<Book[]>('/api/books', { params: { q: t } }).pipe(
      catchError(() => of([])),         // inner: only this request is replaced
    ),
  ),
);
```

## Go deeper

The same rule applies to `mergeMap`, `concatMap` and `exhaustMap`. Whenever an operator creates an inner Observable per value, the inner one is where errors should be handled if the outer stream must survive.

Decide what the fallback *means*. `of([])` shows an empty list, which can look like "no results" when the truth is "the search failed". Often better is to emit a result object such as `{ items: [], failed: true }` so the template can show an error message instead.

Do not swallow errors you cannot recover from. If the caller needs to know, log or notify in `catchError`, then re-throw with `throwError(() => err)`. Returning a plausible value hides real failures from everyone downstream.

`retry` follows the same placement logic: put it on the inner request, so a retry re-sends one request, not the whole outer pipeline.

A small helper keeps the fallback distinguishable without repeating yourself. Wrap the result in a tagged shape so the template can tell "no results" from "search failed":

```typescript
type Outcome<T> = { ok: true; value: T } | { ok: false };

const safely = <T>(source: Observable<T>): Observable<Outcome<T>> =>
  source.pipe(map((value) => ({ ok: true as const, value })), catchError(() => of({ ok: false as const })));
```

Use `switchMap((t) => safely(this.api.search(t)))`, and the outer stream survives while the UI can still show an error message.

## Watch out

- `catchError` after the flattening operator on a stream that must keep working.
- A fallback that looks like genuine "no data".
- Swallowing errors that callers need to see.

## Remember

- An error ends its stream.
- Catch on the inner Observable to keep the outer one alive.
- Make the fallback distinguishable from real results.

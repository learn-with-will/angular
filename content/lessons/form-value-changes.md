---
slug: form-value-changes
title: "Reacting to changes"
topic: forms
kind: technique
summary: "valueChanges, statusChanges and the unified events stream, subscribed to without leaks."
tags: [forms, valuechanges, events, rxjs]
related: [form-reset-and-raw-value, control-state, async-validator, ng-on-destroy]
---
> **In one line:** Every control exposes Observables for its value and status. Subscribe with `takeUntilDestroyed()` so the subscription ends with the component.

## The idea

Sometimes the UI should react as the user types: live search, a derived total, enabling a section when a checkbox is ticked. Controls publish what changes:

| Stream | Emits when |
|---|---|
| `valueChanges` | the value changes |
| `statusChanges` | validity changes (`VALID`, `INVALID`, `PENDING`, `DISABLED`) |
| `events` | any of value, status, touched, pristine, submit or reset change (Angular 18+) |

These Observables belong to the *control*, which can outlive a single view of it. A subscription you never end therefore stays alive, still holding the component, after it is destroyed. That is a leak.

`takeUntilDestroyed()` from `@angular/core/rxjs-interop` ends the subscription when the component is destroyed. Called in a constructor or field initialiser it needs no argument, because it is in an injection context.

## See it

```typescript
export class ProductSearch {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly filters = this.fb.group({ query: '', inStock: false });

  constructor() {
    this.filters.controls.query.valueChanges
      .pipe(
        debounceTime(300),         // wait for a pause in typing
        distinctUntilChanged(),    // ignore repeats
        takeUntilDestroyed(),      // clean up with the component
      )
      .subscribe((query) => this.search(query));
  }
}
```

## Go deeper

One stream for everything, with `events`:

```typescript
this.form.events.pipe(takeUntilDestroyed()).subscribe((event) => {
  if (event instanceof ValueChangeEvent) console.log('value', event.value);
  if (event instanceof StatusChangeEvent) console.log('status', event.status);
});
```

If the template is the only consumer, `toSignal(control.valueChanges, { initialValue: '' })` hands you a signal that unsubscribes by itself, and a `computed()` can derive a total from it.

Heavy work in `valueChanges` needs `debounceTime`, because the default is one emission per keystroke. When the work is an HTTP call, put `switchMap` after the debounce so each new query cancels the previous request. Remember that `valueChanges` does not emit the *initial* value; read `control.value` once, or use `startWith`.

Prefer the declarative route when the template is the only consumer. A signal made from the stream has no subscription for you to forget:

```typescript
readonly query = toSignal(this.filters.controls.query.valueChanges, { initialValue: '' });
readonly isLong = computed(() => this.query().length > 20);
```

Reach for an explicit subscription only when a change must trigger a side effect, such as a request, analytics or syncing to storage. Even then, keep the chain short: debounce, `switchMap` to the work, and let `takeUntilDestroyed()` close it.

## Watch out

- Subscribing to `valueChanges` with no cleanup.
- Doing a request per keystroke, with no `debounceTime`.
- Expecting `valueChanges` to emit the starting value.

## Remember

- `valueChanges`, `statusChanges` and `events` are Observables owned by the control.
- End subscriptions with `takeUntilDestroyed()`, or use `toSignal`.
- Debounce, then `switchMap`, for typed searches.

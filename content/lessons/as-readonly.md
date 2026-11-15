---
slug: as-readonly
title: "Read-only signals: asReadonly()"
topic: signals
kind: api
summary: "Hand out a read-only view of a writable signal so only its owner can change it."
tags: [signals, encapsulation, services]
related: [signal-state-service, signal, computed, pitfall-mutating-signal-array]
since: "17"
---
> **In one line:** `.asReadonly()` returns a view of a writable signal that can be read but not changed. Keep the writable one private and share the view.

## The idea

Angular has two signal types. `WritableSignal<T>` has `.set()` and `.update()`. `Signal<T>` can only be read.

| Type | Read it | `.set()` / `.update()` | You get one from |
|---|---|---|---|
| `WritableSignal<T>` | yes | yes | `signal()` |
| `Signal<T>` | yes | no | `computed()`, `.asReadonly()` |

`computed()` already returns a read-only signal. For a signal you created with `signal()`, call `.asReadonly()` to share it without giving up control.

The TypeScript `readonly` keyword does not do this job. It only stops you reassigning the *field*; the signal behind it is still writable.

| Declaration | What is protected |
|---|---|
| `readonly count = signal(0)` | the field cannot be reassigned, but `count.set(1)` still works |
| `readonly count = _count.asReadonly()` | the signal itself cannot be written to |

Why bother? A signal exposed from a service is state everyone can see. If it is writable, anyone can overwrite it from anywhere, and the rules you meant to enforce (a counter that never goes below zero, a status that only moves forward) are suddenly optional. Handing out a read-only view makes the safe path the only path.

The view is live, not a copy. Later changes show up the next time it is read, so components that bind to it in a template update automatically.

## See it

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _theme = signal<'light' | 'dark'>('light'); // private, writable
  readonly theme = this._theme.asReadonly();                   // public, read-only

  toggle(): void {
    this._theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }
}
```

A component can read the theme, but cannot overwrite it:

```typescript
protected readonly store = inject(ThemeStore);

// In the template: {{ store.theme() }}       <- fine
// In the class:    store.theme.set('dark')   <- compile error: set does not exist on Signal
```

## Go deeper

The `_name` / `name` pairing is a convention worth following: the underscore marks the private writable signal, and the plain name is the public read-only one. It keeps service code readable and makes a stray `.set()` on the public name an immediate compile error. Reviewers benefit too: seeing `private _x` next to `readonly x = _x.asReadonly()` tells them at a glance that this class owns its state and that only its own methods can change it.

You can also expose derived state from the same store with `computed()`, which is read-only by nature, so a store typically publishes a mix of `asReadonly()` views and computed selectors:

```typescript
private readonly _items = signal<string[]>([]);

readonly items = this._items.asReadonly();                 // the list, read-only
readonly count = computed(() => this._items().length);     // derived, read-only
```

## Watch out

- Read-only protects the signal, not the value inside it. If the value is an array or object, a caller could still edit its contents. Treat values as immutable.
- A read-only signal is still a normal signal for readers: it works in `computed()`, `effect()` and templates exactly like the writable one.

## Remember

- `.asReadonly()` turns a `WritableSignal<T>` into a read-only `Signal<T>`.
- Name the private signal `_name` and the public view `name`.
- All writes then go through the owner's methods.

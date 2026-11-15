---
slug: linked-signal
title: "linkedSignal()"
topic: signals
kind: api
summary: "A signal that follows a source by default but can also be overwritten by hand."
tags: [signals, derived-state, writable]
related: [signal, computed, effect, pitfall-effect-derived-state]
since: "20"
---
> **In one line:** `linkedSignal(() => …)` is a hybrid of `signal` and `computed`: it derives its value from a source, but you can still `.set()` it, until the source changes again.

## The idea

Sometimes state is *usually* derived but occasionally needs a manual override. A selected option that defaults to the first item in a list is the classic case: the user can pick another, but if the list is replaced the selection should reset. A form field pre-filled from a computed default that the user may edit is the same shape.

`computed()` cannot do that because it is read-only. Faking it with an `effect()` that writes to a signal is the anti-pattern. `linkedSignal()` is the purpose-built answer.

| | Derived from other signals | You can `.set()` it |
|---|---|---|
| `signal()` | no | yes |
| `computed()` | yes | no |
| `linkedSignal()` | yes | yes, until the source changes |

```sequence
actor code: Your code
actor selected: `selected` | linkedSignal @blue
actor sizes: `sizes` | source signal @primary
code -> selected: Reads `selected()` | follows the source: 'Small'
code -> selected: `selected.set('Large')` | a manual override
code -> sizes: `sizes.set(['XS', 'S'])` | the source changes
note selected..sizes: The override is dropped @amber
code -> selected: Reads `selected()` | resets to 'XS'
```

## See it

```typescript
import { signal, linkedSignal } from '@angular/core';

const sizes = signal(['Small', 'Medium', 'Large']);
const selected = linkedSignal(() => sizes()[0]);

console.log(selected());          // 'Small'  <- follows the source
selected.set('Large');            // manual override
console.log(selected());          // 'Large'
sizes.set(['XS', 'S']);           // the source changed...
console.log(selected());          // 'XS'     <- ...so it resets
```

In a component the source is often an input. A size picker that always starts on the first size offered by its parent, and resets if the parent offers different ones:

```typescript
@Component({
  selector: 'app-size-picker',
  template: `
    @for (s of sizes(); track s) {
      <button [class.active]="s === selected()" (click)="selected.set(s)">{{ s }}</button>
    }
  `,
})
export class SizePicker {
  readonly sizes = input.required<string[]>();
  protected readonly selected = linkedSignal(() => this.sizes()[0]);
}
```

## Go deeper

The long form receives the previous value, so you can keep a choice when it is still valid after the source changes:

```typescript
const selected = linkedSignal<string[], string>({
  source: sizes,
  computation: (list, previous) =>
    previous && list.includes(previous.value) ? previous.value : list[0],
});
```

With this version, replacing `sizes` with a list that still contains `'Large'` keeps `'Large'` selected, and only falls back to the first item when the old choice is gone.

Choosing between the three signal APIs is a short checklist. Is the value ever written to by you or the user? If not, it is a `computed()`. Does it have no source to follow? Then it is a plain `signal()`. Only the combination of *follows a source* and *can be overridden* calls for `linkedSignal()`.

> **Tip:** A form field that defaults to something calculated, such as a display name that starts as `firstName()` but that the user may retype, is a textbook `linkedSignal()`.

## Watch out

- It is writable, so use it only when the value can genuinely be overridden. For a pure formula, `computed()` is the better fit.
- Writing to it never changes the source. The override lasts only until the source signal changes.
- It does not run side effects. To push the value somewhere, add an `effect()` that reads it.

## Remember

- `linkedSignal()` derives from a source and can still be written to.
- A change in the source resets any manual override.
- Reach for it instead of faking this behavior with an `effect()`.

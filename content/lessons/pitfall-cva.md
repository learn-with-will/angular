---
slug: pitfall-cva
title: "Pitfall: broken custom controls"
topic: forms
kind: pitfall
summary: "The accessor mistakes that produce a widget which looks right but ignores reset, disable or touched."
tags: [forms, controlvalueaccessor, bugs, onpush]
related: [cva-methods, cva-register, cva-validator, cva-toggle-example]
---
> **In one line:** A custom control that renders correctly can still be broken. Check it against reset, disable, touched, `null` and `OnPush` before you trust it.

## The idea

Every item below produces a widget that works when you click it, and fails later when the form does something to it. A short checklist finds almost all of them:

| You see | The likely cause |
|---|---|
| *No value accessor for form control* | not provided under `NG_VALUE_ACCESSOR`, or missing `multi: true` |
| Widget stays clickable after `form.disable()` | `setDisabledState` not implemented |
| Error messages gated on `touched` never appear | the touched callback is never called |
| Crash or `NaN` after `form.reset()` | `writeValue` did not handle `null` |
| `patchValue` changes the model but the widget does not repaint | state kept in plain fields under `OnPush` |
| Extra `valueChanges` emissions, or an infinite loop | `onChange` called inside `writeValue` |
| NG0200 circular dependency | `NgControl` self-injection combined with `NG_VALIDATORS` |

## See it

```typescript
// Before: three bugs in six lines
export class Broken implements ControlValueAccessor {
  value = 0;                                      // plain field: stale under OnPush
  onChange!: (v: number) => void;

  writeValue(v: number): void {
    this.value = v;                               // null after reset()
    this.onChange(v);                             // wrong direction: loops back to the model
  }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(): void {}                    // never stored, never called
}
// After
export class Fixed implements ControlValueAccessor {
  protected readonly value = signal(0);
  protected readonly disabled = signal(false);
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: number): void { this.value.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
```

## Go deeper

Signals are the cleanest answer to the `OnPush` problem. `writeValue` and `setDisabledState` are called by the forms system, outside your template's event handlers. A plain field assignment does not schedule a refresh, whereas a signal write does. If you keep plain fields, inject `ChangeDetectorRef` and call `markForCheck()` in both methods.

Since `OnPush` is the default for components in newer Angular versions, this is no longer an edge case. Treat signals as the default state container for a widget.

`NG_VALUE_ACCESSOR` and `NG_VALIDATORS` are separate tokens for separate jobs. A component can implement one, both or neither, and writing a validation rule inside `writeValue` is always the wrong place.

## Watch out

- Calling `onChange` inside `writeValue`.
- Skipping `setDisabledState` and `registerOnTouched`.
- Storing state in non-signal fields in an `OnPush` component.

## Remember

- Test every widget against reset, disable, touched, `null` and `patchValue`.
- Signals keep the view fresh when the forms system writes in from outside.
- Value sync and validation are different tokens.

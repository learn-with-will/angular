---
slug: cva-methods
title: "The four CVA methods"
topic: forms
kind: api
summary: "writeValue, registerOnChange, registerOnTouched and setDisabledState: which direction each one runs."
tags: [forms, controlvalueaccessor, writevalue, api]
related: [control-value-accessor, cva-register, cva-toggle-example, pitfall-cva]
---
> **In one line:** Two methods carry data *into* your component (`writeValue`, `setDisabledState`), and two hand you callbacks to report changes *out* (`registerOnChange`, `registerOnTouched`).

## The idea

Think in two directions. Angular tells your component something (model to view), or your component tells Angular something (view to model).

| Method | Direction | When Angular calls it | What you do |
|---|---|---|---|
| `writeValue(value)` | model → view | initial value, `setValue`, `patchValue`, `reset` | update what the widget shows |
| `registerOnChange(fn)` | view → model | once, at creation | store `fn`; call it when the user changes the value |
| `registerOnTouched(fn)` | view → model | once, at creation | store `fn`; call it on blur |
| `setDisabledState(flag)` | model → view | `disable()` or `enable()` | switch the widget's interactive state |

`registerOnChange` and `registerOnTouched` do not move data themselves. They give you a function to **call later**, when the user acts.

```sequence
actor ctrl: FormControl
actor cva: Your widget
actor user: User
ctrl -> cva: `registerOnChange(fn)` | stored once
ctrl -> cva: `writeValue(3)` | model to view
user -> cva: Clicks a star
cva -> ctrl: Calls `fn(4)` | view to model
cva -> ctrl: Calls the touched callback
```

## See it

```typescript
export class StarRating implements ControlValueAccessor {
  protected readonly value = signal(0);
  protected readonly disabled = signal(false);

  // No-op defaults mean we never null-check before calling
  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};

  select(star: number): void {
    if (this.disabled()) return;
    this.value.set(star);
    this.onChange(star);        // view -> model
    this.onTouched();
  }

  writeValue(value: number): void { this.value.set(value ?? 0); }                 // model -> view
  registerOnChange(fn: (value: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
```

## Go deeper

`setDisabledState` is optional in the type, but implement it every time. Skipping it means the widget stays clickable after `form.disable()`, a bug that is easy to miss in manual testing and obvious to users.

Never call `onChange` from inside `writeValue`. `writeValue` is the model-to-view direction; calling `onChange` there writes the value straight back to the model, and can loop or emit extra `valueChanges`.

`form.reset()` usually passes `null` to `writeValue`, so always guard: `value ?? 0`.

Order matters at startup. Angular calls `registerOnChange` and `registerOnTouched` first, then `writeValue` with the initial value, so by the time your widget has to show something its callbacks already exist. That is why the no-op defaults are safe: they cover the brief window before registration, and any code path that fires early.

A good habit is to test the contract without a form at all. Create the component, call `writeValue(3)` and assert the display, call `registerOnChange(spy)`, click, and assert the spy received the new value. If both directions pass, the widget will behave inside any form, reactive or template-driven, because the forms directives only ever use these four methods.

## Watch out

- Calling `onChange` inside `writeValue`, creating a feedback loop.
- Never calling the touched callback, so `touched` stays false and gated errors never show.
- Crashing on `null` after a reset.

## Remember

- `writeValue` and `setDisabledState` come in; the two callbacks go out.
- Store the callbacks, and call them when the user acts.
- Guard `null` in `writeValue`.

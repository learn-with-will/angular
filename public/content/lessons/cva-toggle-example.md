---
slug: cva-toggle-example
title: "Build it: a toggle switch"
topic: forms
kind: technique
summary: "A complete, accessible toggle that works with formControl, formControlName and ngModel."
tags: [forms, controlvalueaccessor, example, signals]
related: [control-value-accessor, cva-methods, cva-register, pitfall-cva]
---
> **In one line:** The smallest useful accessor: a boolean switch, with signals for state, all four methods and the provider.

## The idea

A toggle is a good first accessor. It holds one boolean, it has an obvious UI, and it exercises every part of the contract: showing a value from the model, reporting a user change, reporting touch and honouring disable.

Use a real `<button role="switch">` rather than a styled `<div>`. You inherit keyboard support and focus for free, and `aria-checked` tells assistive technology the state. Do not reinvent accessibility when a native element does the job.

State lives in **signals**. `writeValue` and `setDisabledState` are called from outside your template, and writing a signal marks the view for update automatically, so the widget stays correct under `OnPush` and in zoneless apps.

## See it

```typescript
@Component({
  selector: 'app-toggle-switch',
  template: `
    <button type="button" role="switch" [attr.aria-checked]="checked()"
            [disabled]="disabled()" (click)="toggle()">{{ checked() ? 'On' : 'Off' }}</button>
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ToggleSwitch), multi: true }],
})
export class ToggleSwitch implements ControlValueAccessor {
  protected readonly checked = signal(false);
  protected readonly disabled = signal(false);
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  protected toggle(): void {
    if (this.disabled()) return;
    this.checked.update((v) => !v);
    this.onChange(this.checked());   // view -> model
    this.onTouched();
  }

  writeValue(value: boolean): void { this.checked.set(!!value); }
  registerOnChange(fn: (value: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
```

```typescript
@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, ToggleSwitch],
  template: `
    <label>Email notifications <app-toggle-switch [formControl]="notifications" /></label>
    <p>Current value: {{ notifications.value }}</p>
  `,
})
export class Settings {
  readonly notifications = new FormControl(true, { nonNullable: true });
}
```

## Go deeper

Try each method from the consuming form:

| You do | Method that runs | Direction |
|---|---|---|
| `notifications.setValue(false)` | `writeValue` | model to view |
| click the switch | `onChange`, `onTouched` | view to model |
| `notifications.disable()` | `setDisabledState` | model to view |
| `notifications.reset()` | `writeValue(null)` | model to view |

Test the contract directly rather than only the DOM: create the component, call `writeValue`, `registerOnChange`, `registerOnTouched` and `setDisabledState`, and assert on both directions of data flow.

`!!value` in `writeValue` turns `null` (what `reset()` sends) into `false`, so a reset form never crashes the widget.

## Watch out

- Using a `<div>` with a click handler. It has no keyboard support or role.
- Storing state in plain fields under `OnPush`, so `writeValue` does not refresh the view.
- Letting `toggle()` run while disabled.

## Remember

- Use a native `<button role="switch">` and signals for state.
- `toggle()` calls `onChange` and `onTouched`; `writeValue` only sets state.
- Test each method in both directions.

---
slug: cva-validator
title: "A self-validating control"
topic: forms
kind: technique
summary: "Implement Validator alongside the accessor so min and max live inside the widget, not in every form."
tags: [forms, controlvalueaccessor, validator, ng-validators]
related: [control-value-accessor, cva-register, custom-validator, pitfall-cva]
---
> **In one line:** A component can be both a value accessor and a `Validator`. Register it under both tokens, and its rules travel with it into every form.

## The idea

A numeric stepper with `min` and `max` inputs has built-in rules: a value above `max` is wrong no matter which form uses the stepper. If each consumer has to add `Validators.max(20)` themselves, the rule is copied everywhere and can disagree with the widget's own buttons.

Implementing `Validator` moves the rule inside. The accessor syncs the value; the validator judges it. They stay separate interfaces, and each needs its own token.

| Interface | Token | Method |
|---|---|---|
| `ControlValueAccessor` | `NG_VALUE_ACCESSOR` | `writeValue`, `registerOnChange`, ... |
| `Validator` | `NG_VALIDATORS` | `validate(control)` |

## See it

```typescript
@Component({
  selector: 'app-numeric-stepper',
  template: `{{ value() }}`,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumericStepper), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => NumericStepper), multi: true },
  ],
})
export class NumericStepper implements ControlValueAccessor, Validator {
  readonly min = input(0);
  readonly max = input(10);
  protected readonly value = signal(0);
  private onValidatorChange: () => void = () => {};

  constructor() {
    // Re-run validation whenever a bound changes
    effect(() => { this.min(); this.max(); this.onValidatorChange(); });
  }

  registerOnValidatorChange(fn: () => void): void { this.onValidatorChange = fn; }
  // writeValue, registerOnChange, registerOnTouched, setDisabledState: as in the toggle
}
```

The rule itself is one method:

```typescript
validate(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v == null || (v >= this.min() && v <= this.max())) return null;
  return v < this.min()
    ? { min: { min: this.min(), actual: v } }
    : { max: { max: this.max(), actual: v } };
}
```

## Go deeper

`registerOnValidatorChange` is the part people skip. If `max` changes from 20 to 10 while the value is 15, the control is now invalid, but Angular only re-validates on a value change. Calling the stored callback from an `effect` tells it to run `validate` again.

Because the component provides both tokens itself, you must **not** also use `NgControl` self-injection. `formControlName` asks the element for `NG_VALIDATORS`, which points back at your component while it waits on `NgControl`, which is the circular-dependency error NG0200.

Use it like any control: `<app-numeric-stepper formControlName="quantity" [min]="1" [max]="20" />`. The consumer can still add its own `Validators` on top.

## Watch out

- Providing `NG_VALUE_ACCESSOR` but forgetting `NG_VALIDATORS`, so `validate` never runs.
- Not implementing `registerOnValidatorChange` when bounds are dynamic.
- Mixing `NgControl` self-injection with these providers.

## Remember

- Implement `Validator` and provide `NG_VALIDATORS` for a self-validating widget.
- Call the validator-change callback when its inputs change.
- Keep value syncing and validation as separate concerns.

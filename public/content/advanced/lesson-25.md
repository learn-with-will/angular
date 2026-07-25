---
id: lesson-25
slug: custom-form-controls-control-value-accessor
title: "Custom Form Controls with ControlValueAccessor"
level: advanced
order: 23
duration: 75
tags:
  - forms
  - reactive-forms
  - control-value-accessor
  - custom-components
  - accessibility
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what `ControlValueAccessor` is and why Angular's forms system needs it to work with anything that isn't a native `<input>`, `<select>`, or `<textarea>`.
- Implement the `ControlValueAccessor` interface from scratch to turn any standalone component into a fully-fledged, reusable form control.
- Register a custom control with Angular's forms module using the `NG_VALUE_ACCESSOR` provider token and `forwardRef`, and understand the alternative `NgControl` self-injection technique used by many component libraries.
- Combine `ControlValueAccessor` with the `Validator` interface (`NG_VALIDATORS`) to build a self-validating, reusable control.
- Recognize common pitfalls (missing `multi: true`, forgotten `setDisabledState`, stale `OnPush` views) and apply best practices used in production-grade component libraries.

## Why This Concept Exists

Angular's form system — both **Reactive Forms** and **Template-driven Forms** — is built around a simple idea: a `FormControl` holds a value, and *something* keeps that value in sync with whatever the user sees on screen. For native elements, Angular already ships that "something": internal directives like `DefaultValueAccessor` (text inputs), `CheckboxControlValueAccessor`, `SelectControlValueAccessor`, and `RadioControlValueAccessor` quietly translate between the `FormControl` and the DOM.

The problem starts the moment you build your own UI: a star-rating widget, a toggle switch, a date-range picker, a tag input, a currency field with formatting. If you just add `@Input() value` and `@Output() valueChange` to that component, it works fine on its own — but it **cannot** be used with `formControlName`, `[formControl]`, or `ngModel`. Angular's forms module has no idea your component holds a value, has no way to push a programmatic `setValue()` into it, and can't tell when the user has interacted with it (`touched`/`dirty`).

`ControlValueAccessor` exists to close that gap. It's a small, well-defined contract that lets *any* component — no matter how exotic its internal UI — plug into Angular's forms ecosystem exactly like a native `<input>` does. Once implemented, your component gets validation, `disable()`/`enable()`, `reset()`, `dirty`/`touched` tracking, and `formControlName` binding for free, and consumers of your component never need to know it isn't a native element.

## Concept Explanation

### The forms directive → accessor relationship

When you write `<input formControlName="email">`, Angular attaches the `FormControlName` directive to that `<input>`. That directive doesn't touch the DOM directly — instead, it looks for a **value accessor** registered on the same element and delegates all the reading/writing to it. For a plain text input, Angular's built-in `DefaultValueAccessor` handles that job. For your custom component, *you* have to provide the accessor.

```
FormControl (data model)
      ↕
FormControlName / NgModel / [formControl]   ← the forms directive
      ↕
ControlValueAccessor                        ← the bridge (yours, or Angular's built-in one)
      ↕
Your component's internal state / the DOM
```

### The interface

```typescript
interface ControlValueAccessor {
  writeValue(obj: any): void;
  registerOnChange(fn: any): void;
  registerOnTouched(fn: any): void;
  setDisabledState?(isDisabled: boolean): void; // optional, but implement it
}
```

- **`writeValue(value)`** — Angular calls this in the **model → view** direction: initial value, `setValue()`, `patchValue()`, or `reset()`. Your job is to update the component's internal/displayed state. Never call `onChange` from inside `writeValue` — doing so would immediately write the value back to the model and can create feedback loops.
- **`registerOnChange(fn)`** — Called **once**, right after your component is created. Angular hands you a callback; store it. Every time the *user* changes the value (view → model direction), you call this stored function with the new value.
- **`registerOnTouched(fn)`** — Also called once. Store this callback and invoke it when the control should be marked as touched — typically on blur. This is what makes `control.touched` and CSS classes like `ng-touched` work.
- **`setDisabledState(isDisabled)`** — Optional in the type signature, but you should almost always implement it. Angular calls it whenever `.disable()` / `.enable()` is called on the bound `FormControl`. Skipping it means your widget stays interactive even when the surrounding form is disabled.

### Registering the accessor

Implementing the interface isn't enough — Angular's forms directives find accessors through **dependency injection**, using the `NG_VALUE_ACCESSOR` token. There are two common ways to register your component:

1. **The classic provider array** (most common, works everywhere):

   ```typescript
   providers: [
     {
       provide: NG_VALUE_ACCESSOR,
       useExisting: forwardRef(() => MyComponent),
       multi: true,
     },
   ]
   ```

   `forwardRef` is required because this object is evaluated as part of the `@Component` decorator's metadata — at that point in the file, the class `MyComponent` hasn't finished being defined yet. `forwardRef(() => MyComponent)` defers resolving the reference until Angular actually needs it. `multi: true` is equally important: `NG_VALUE_ACCESSOR` is a *multi-provider* token, meaning several accessors can coexist on one injector; without `multi: true` you'd replace the list instead of adding to it.

2. **`NgControl` self-injection** (no provider array, no `forwardRef` needed for the value accessor — used internally by many component libraries such as Angular Material):

   ```typescript
   private ngControl = inject(NgControl, { optional: true, self: true });

   constructor() {
     if (this.ngControl) {
       this.ngControl.valueAccessor = this;
     }
   }
   ```

   `NgControl` is the abstract base class shared by `NgModel`, `FormControlName`, and `FormControlDirective`. By injecting it with `{ optional: true, self: true }` and assigning `this` to its `valueAccessor` property in the constructor, you sidestep the whole provider/`forwardRef` dance. The trade-off: this only works when the component is *always* used alongside `formControlName`, `[formControl]`, or `ngModel` — if someone drops your component onto a page without one of those directives, `ngControl` will simply be `null`, and you should handle that gracefully.

### What CVA does *not* do

`ControlValueAccessor` only synchronizes **value**, **touched**, and **disabled** state. It does **not** perform validation. Validation is a separate concern, handled either by `Validators` passed into the `FormControl` by the consumer, or by your component implementing the parallel `Validator` interface and registering itself with the `NG_VALIDATORS` token (shown in the best-practice example below). Keeping these concerns separate is intentional — it lets the same control be validated differently in different forms.

### Where CVA fits today (Signal Forms context)

Angular's Reactive Forms and Template-driven Forms — the systems `ControlValueAccessor` powers — remain fully supported and are what the vast majority of production Angular applications and component libraries (Angular Material, Angular CDK, and most third-party UI kits) are built on. `ControlValueAccessor` is essential knowledge if you work with either of them, or if you build components meant to be reused across many codebases.

Angular has, more recently, introduced an additional, separately-imported forms system called **Signal Forms** (`@angular/forms/signals`). In Signal Forms, custom controls implement a different, signal-based contract — `FormValueControl` (a `value` model signal) or `FormCheckboxControl` (a `checked` model signal) — instead of `ControlValueAccessor`, which removes the need for `forwardRef` and manual `registerOnChange`/`registerOnTouched` wiring entirely. If your project has adopted Signal Forms, that's the API you'd reach for when building new custom controls. Because this lesson is specifically about `ControlValueAccessor`, we focus on that — but it's worth knowing the newer alternative exists so you can choose deliberately. See **Further Reading** for the official comparison guide.

## Key Terminology

| Term | Meaning |
|---|---|
| `ControlValueAccessor` | The interface a component/directive implements to act as a bridge between Angular's forms API and its own UI. |
| `NG_VALUE_ACCESSOR` | The DI token used to register a class as a value accessor so forms directives can find it. |
| `forwardRef()` | An Angular function that lazily resolves a class reference, required when a class refers to itself inside its own decorator metadata. |
| `multi: true` | A provider configuration flag meaning "add this to the list of providers for this token" instead of replacing it. |
| `writeValue` | CVA method: model → view. Updates your component when the `FormControl`'s value changes programmatically. |
| `registerOnChange` | CVA method: Angular hands you the callback to invoke on every user-driven value change (view → model). |
| `registerOnTouched` | CVA method: Angular hands you the callback to invoke when the control should be marked "touched." |
| `setDisabledState` | CVA method (optional but recommended): keeps your control's UI in sync with `.disable()`/`.enable()`. |
| `NgControl` | The abstract base class of `NgModel`, `FormControlName`, and `FormControlDirective`; exposes a `valueAccessor` property you can assign directly. |
| `Validator` / `NG_VALIDATORS` | The parallel interface/token used to supply custom validation logic from a component, separate from value synchronization. |
| `DefaultValueAccessor` | Angular's own built-in `ControlValueAccessor` implementation for native text-like `<input>` and `<textarea>` elements. |

## Syntax Overview

Minimal skeleton showing every required piece:

```typescript
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-my-control',
  standalone: true,
  template: `<!-- your UI here -->`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MyControlComponent),
      multi: true,
    },
  ],
})
export class MyControlComponent implements ControlValueAccessor {
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};
  disabled = false;

  writeValue(value: unknown): void {
    // update internal state from the FormControl
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

Usage is identical to a native control, in both reactive and template-driven forms:

```html
<!-- Reactive forms -->
<app-my-control [formControl]="myControl"></app-my-control>
<app-my-control formControlName="email"></app-my-control>

<!-- Template-driven forms -->
<app-my-control [(ngModel)]="myValue"></app-my-control>
```

## Real World Analogy

Think of `ControlValueAccessor` as a **travel plug adapter**. Your laptop charger has one specific plug shape; the wall socket in a different country has a completely different shape. Neither the charger nor the socket needs to change — the adapter sits in between, translating one side's protocol into the other's.

Angular's forms system speaks one protocol: *give me the current value, take this value when it changes, tell me when the user has touched it, respect it when I disable you.* Your custom star-rating widget, toggle switch, or date picker speaks its own protocol: clicks, drags, internal component state. `ControlValueAccessor` is the adapter. Angular's forms module never needs to know how your widget is built internally, and your widget never needs to know whether a `FormControl`, `ngModel`, or nothing at all is driving it.

## Examples

### Example 1 — Basic: A Toggle Switch

A minimal, complete `ControlValueAccessor` implementation covering all four interface methods. This is the smallest useful example — a boolean toggle switch, standalone, with no external dependencies.

```typescript
// toggle-switch.component.ts
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  template: `
    <button
      type="button"
      class="toggle"
      role="switch"
      [attr.aria-checked]="checked"
      [class.on]="checked"
      [disabled]="disabled"
      (click)="toggle()"
    >
      <span class="thumb"></span>
    </button>
  `,
  styles: [`
    .toggle {
      width: 48px;
      height: 26px;
      border-radius: 13px;
      border: none;
      background: #ccc;
      position: relative;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .toggle.on { background: #4caf50; }
    .toggle:disabled { opacity: 0.5; cursor: not-allowed; }
    .thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: white;
      transition: transform 0.2s ease;
    }
    .toggle.on .thumb { transform: translateX(22px); }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true,
    },
  ],
})
export class ToggleSwitchComponent implements ControlValueAccessor {
  checked = false;
  disabled = false;

  // Default to no-ops so we never have to null-check before calling.
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.onChange(this.checked); // view -> model
    this.onTouched();
  }

  // model -> view
  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

Using it in a reactive form:

```typescript
// settings.component.ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToggleSwitchComponent } from './toggle-switch.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, ToggleSwitchComponent],
  template: `
    <label>
      Email notifications
      <app-toggle-switch [formControl]="notifications" />
    </label>
    <p>Current value: {{ notifications.value }}</p>
  `,
})
export class SettingsComponent {
  notifications = new FormControl(true, { nonNullable: true });
}
```

Nothing in `SettingsComponent` knows or cares that `app-toggle-switch` isn't a native checkbox — that's the whole point.

### Example 2 — Real World: A Star Rating in a Product Review Form

A more realistic control: a five-star rating widget used inside a reactive product-review form, alongside a required validator and a comment field. This example uses `ChangeDetectionStrategy.OnPush` and Angular's built-in `@for` control-flow syntax.

```typescript
// star-rating.component.ts
import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stars" role="radiogroup" [attr.aria-label]="'Rating out of ' + max()">
      @for (star of stars(); track star) {
        <button
          type="button"
          class="star"
          [class.filled]="star <= value"
          [disabled]="disabled"
          role="radio"
          [attr.aria-checked]="star === value"
          (click)="select(star)"
          (blur)="onTouched()"
        >★</button>
      }
    </div>
  `,
  styles: [`
    .stars { display: inline-flex; gap: 4px; }
    .star { font-size: 1.5rem; background: none; border: none; cursor: pointer; color: #ccc; }
    .star.filled { color: #f5a623; }
    .star:disabled { cursor: not-allowed; opacity: 0.5; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true,
    },
  ],
})
export class StarRatingComponent implements ControlValueAccessor {
  max = input(5);

  value = 0;
  disabled = false;
  protected onTouched: () => void = () => {};
  private onChange: (value: number) => void = () => {};

  stars(): number[] {
    return Array.from({ length: this.max() }, (_, i) => i + 1);
  }

  select(star: number): void {
    if (this.disabled) return;
    this.value = star;
    this.onChange(this.value);
    this.onTouched();
  }

  writeValue(value: number): void {
    this.value = value ?? 0;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

```typescript
// product-review.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StarRatingComponent } from './star-rating.component';

@Component({
  selector: 'app-product-review',
  standalone: true,
  imports: [ReactiveFormsModule, StarRatingComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>
        Your rating
        <app-star-rating formControlName="rating" [max]="5" />
      </label>

      @if (form.controls.rating.invalid && form.controls.rating.touched) {
        <p class="error">Please select a rating.</p>
      }

      <textarea formControlName="comment" placeholder="Write a review..."></textarea>

      <button type="submit" [disabled]="form.invalid">Submit review</button>
    </form>
  `,
})
export class ProductReviewComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    rating: this.fb.control(0, { validators: [Validators.min(1)] }),
    comment: this.fb.control(''),
  });

  submit(): void {
    if (this.form.valid) {
      console.log(this.form.getRawValue());
    }
  }
}
```

Notice that `StarRatingComponent` itself knows nothing about `Validators.min` — validation is composed by whoever owns the form, while the star-rating component only handles reading and writing its own value. That separation is exactly what `ControlValueAccessor` is designed to preserve.

### Example 3 — Best Practice: A Self-Validating Numeric Stepper

This example demonstrates a production-grade pattern: `ControlValueAccessor` **and** `Validator` implemented together, `OnPush` change detection handled correctly, signal-based inputs, and the `NgControl` self-injection technique instead of the `NG_VALUE_ACCESSOR` provider array.

```typescript
// numeric-stepper.component.ts
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NgControl,
  ValidationErrors,
  Validator,
} from '@angular/forms';

@Component({
  selector: 'app-numeric-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stepper" [class.disabled]="disabled">
      <button type="button" (click)="decrement()" [disabled]="disabled || value <= min()">−</button>
      <span class="value">{{ value }}</span>
      <button type="button" (click)="increment()" [disabled]="disabled || value >= max()">+</button>
    </div>
  `,
  styles: [`
    .stepper { display: inline-flex; align-items: center; gap: 8px; }
    .stepper.disabled { opacity: 0.5; }
    button { width: 28px; height: 28px; border-radius: 4px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
    button:disabled { cursor: not-allowed; }
    .value { min-width: 24px; text-align: center; }
  `],
  providers: [
    // Only NG_VALIDATORS needs a provider here; the value accessor is
    // registered manually below via NgControl, so no NG_VALUE_ACCESSOR
    // provider (and no forwardRef for it) is needed.
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NumericStepperComponent),
      multi: true,
    },
  ],
})
export class NumericStepperComponent implements ControlValueAccessor, Validator {
  min = input(0);
  max = input(10);
  step = input(1);

  value = 0;
  disabled = false;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};
  private cdr = inject(ChangeDetectorRef);
  private ngControl = inject(NgControl, { optional: true, self: true });

  constructor() {
    // Bypass NG_VALUE_ACCESSOR entirely: assign this component directly
    // as the accessor for whatever form directive (formControlName,
    // [formControl], or ngModel) sits on this element.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Re-run validation whenever min/max change, so a dynamically
    // changing bound stays in sync with the FormControl's error state.
    effect(() => {
      this.min();
      this.max();
      this.onValidatorChange();
    });
  }

  increment(): void {
    this.setValue(Math.min(this.value + this.step(), this.max()));
  }

  decrement(): void {
    this.setValue(Math.max(this.value - this.step(), this.min()));
  }

  private setValue(next: number): void {
    if (this.disabled || next === this.value) return;
    this.value = next;
    this.onChange(this.value);
    this.onTouched();
  }

  // --- ControlValueAccessor ---

  writeValue(value: number): void {
    this.value = value ?? 0;
    this.cdr.markForCheck(); // required: writeValue can be called from outside Angular's normal change detection path under OnPush
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  // --- Validator ---

  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value == null) return null;
    if (value < this.min()) return { min: { min: this.min(), actual: value } };
    if (value > this.max()) return { max: { max: this.max(), actual: value } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }
}
```

```typescript
// quantity-form.component.ts
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NumericStepperComponent } from './numeric-stepper.component';

@Component({
  selector: 'app-quantity-form',
  standalone: true,
  imports: [ReactiveFormsModule, NumericStepperComponent],
  template: `
    <form [formGroup]="form">
      <label>
        Quantity
        <app-numeric-stepper formControlName="quantity" [min]="1" [max]="20" />
      </label>
      @if (form.controls.quantity.hasError('max')) {
        <p class="error">Maximum quantity is 20.</p>
      }
    </form>
  `,
})
export class QuantityFormComponent {
  form = new FormGroup({
    quantity: new FormControl(1, { nonNullable: true }),
  });
}
```

Because `NumericStepperComponent` implements `Validator`, the `max`/`min` validation logic lives once, inside the component, instead of being re-declared with `Validators.max(20)` in every form that uses it. Combined with the `NgControl` self-injection technique, this is the pattern used by many production component libraries to keep custom-control boilerplate to a minimum.

## Common Mistakes

- **Forgetting `multi: true`.** Without it, your provider *replaces* the list of accessors on that injector instead of joining it, which can silently break sibling directives or cause confusing "no value accessor" errors.
- **Omitting `forwardRef`.** Referring to the component class by name inside its own `providers` array without `forwardRef(() => MyComponent)` throws a runtime error, because the class identifier isn't fully initialized yet at the point the decorator metadata is evaluated.
- **Never implementing `setDisabledState`.** It's optional in the type signature, but skipping it means your control stays interactive even after `form.disable()` — a subtle bug that's easy to miss in manual testing but obvious to real users.
- **Not implementing `registerOnTouched`.** Without calling the stored `onTouched` callback (usually on blur), `control.touched` never becomes `true`, so error messages that are gated on `touched` never appear.
- **Calling `onChange` inside `writeValue`.** `writeValue` is the model → view direction; calling the `onChange` callback from inside it re-triggers the view → model direction and can create infinite loops or unexpected `valueChanges` emissions.
- **Forgetting `ChangeDetectorRef.markForCheck()` under `OnPush`.** When `writeValue` or `setDisabledState` is called from outside your component (e.g., `patchValue()` from a parent), `OnPush` components won't re-render unless you explicitly call `markForCheck()`.
- **Crashing on `null`/`undefined` in `writeValue`.** `form.reset()` typically writes `null`. Always guard: `this.value = value ?? defaultValue;`.
- **Mixing up `NG_VALUE_ACCESSOR` and `NG_VALIDATORS`.** They're separate concerns and separate tokens — value synchronization is not validation, and a component can implement one, both, or neither.
- **Using the `NgControl` self-injection technique without the `@Optional()`/`optional: true` flag.** If the component is ever used without `formControlName`/`[formControl]`/`ngModel`, injecting `NgControl` without marking it optional throws an error instead of simply returning `null`.

## Best Practices

- Always pair `NG_VALUE_ACCESSOR` (and `NG_VALIDATORS`, if used) with `multi: true`.
- Initialize `onChange`/`onTouched` as no-op functions so you never need to null-check them before calling.
- Implement `setDisabledState` even when it feels trivial — it's part of the contract consumers expect.
- Call `ChangeDetectorRef.markForCheck()` inside `writeValue`/`setDisabledState` whenever the component uses `ChangeDetectionStrategy.OnPush`.
- Keep validation logic in `Validator`/`NG_VALIDATORS` (or let the consumer supply `Validators`), not inside the value-accessor methods — the two concerns are intentionally separate in Angular's design.
- Prefer the `NgControl` self-injection pattern for components that will *always* be used with a form directive; prefer the classic `NG_VALUE_ACCESSOR` provider array for components that might also be used standalone (outside any form).
- Don't reinvent accessibility: delegate to native `<input>`/`<button>` elements internally where possible, and add appropriate ARIA roles/attributes when you can't.
- Write unit tests that exercise the `ControlValueAccessor` contract directly — construct the component, call `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`, and assert on both directions of data flow, not just the rendered DOM.
- Keep your control "dumb" about its surrounding form: it should never inject a `FormGroup` or reach out to sibling controls; it should only ever speak through the `ControlValueAccessor`/`Validator` contract.
- If your project uses Angular's newer Signal Forms (`@angular/forms/signals`), reach for `FormValueControl`/`FormCheckboxControl` instead for new controls — but keep `ControlValueAccessor` in your toolkit for Reactive/Template-driven forms and third-party component libraries built on it.

## Summary

- `ControlValueAccessor` is the interface that lets a custom component behave like a native form control inside Angular's Reactive and Template-driven forms.
- It defines four methods: `writeValue`, `registerOnChange`, `registerOnTouched`, and the optional-but-recommended `setDisabledState`.
- `writeValue` handles the model → view direction; the registered `onChange`/`onTouched` callbacks handle the view → model direction.
- Registration happens via the `NG_VALUE_ACCESSOR` multi-provider token, typically combined with `forwardRef()` to work around the class's self-reference.
- An alternative registration technique — injecting `NgControl` with `{ optional: true, self: true }` and assigning `this.ngControl.valueAccessor = this` — avoids the provider array and `forwardRef` entirely, at the cost of requiring the component to always be used with a form directive.
- `ControlValueAccessor` handles value/touched/disabled state only; validation is a separate concern, handled by `Validators` or the parallel `Validator`/`NG_VALIDATORS` contract.
- `OnPush` components must call `ChangeDetectorRef.markForCheck()` inside `writeValue`/`setDisabledState` to reflect externally-driven updates.
- Angular's newer Signal Forms system uses a different, simpler `FormValueControl`/`FormCheckboxControl` contract — but `ControlValueAccessor` remains essential for Reactive/Template-driven forms and the wider Angular component ecosystem.

## Flash Cards

**Q: What is the primary purpose of `ControlValueAccessor`?**
A: It's the interface that lets Angular's forms API (reactive or template-driven) read and write the value of a custom component, and track its touched/disabled state, without the forms system needing to know how the component is built internally.

**Q: Why does the `NG_VALUE_ACCESSOR` provider need `forwardRef(() => MyComponent)`?**
A: Because the provider object is evaluated as part of the class's own decorator metadata, before the class identifier is fully initialized; `forwardRef` defers resolving the reference until it's actually needed.

**Q: What happens if you forget `multi: true` on the `NG_VALUE_ACCESSOR` provider?**
A: It replaces, rather than adds to, the list of accessors registered on that injector, which can silently break other accessors or cause "no value accessor" errors.

**Q: When should you implement `setDisabledState`, given that it's optional?**
A: Whenever your control should visually and functionally respond to `form.disable()`/`form.enable()` — which is almost always. Skipping it leaves the control interactive even when the form is disabled.

**Q: Does `ControlValueAccessor` perform validation?**
A: No. It only synchronizes value, touched, and disabled state. Validation is handled separately via `Validators` or the parallel `Validator`/`NG_VALIDATORS` interface and token.

## Exercises

**1. Easy — Like Button**
Build a `LikeButtonComponent` that represents a boolean "liked" state as a single button (e.g., toggling between a filled and outlined heart icon or emoji). Implement `ControlValueAccessor` fully, including `setDisabledState`. Wire it into a small reactive form using `FormControl<boolean>` and display the current value beneath the button.

**2. Medium — Tag Input**
Build a `TagInputComponent` whose value is a `string[]` (e.g., keywords for a blog post). Users type a word and press Enter to add it as a "chip"; clicking a chip's "×" removes it. Implement `ControlValueAccessor` (value type `string[]`), call the registered `onTouched` callback when the text input blurs, support `setDisabledState` (disable the text input and hide the remove buttons), and integrate it into a form using `Validators.required` so an error shows when the tag list is empty. *Hint: `Validators.required` on an array control is falsy for an empty array.*

**3. Challenging — Date Range Picker**
Build a `DateRangePickerComponent` composed of two native `<input type="date">` elements that together represent a single value shaped like `{ start: string | null; end: string | null }`. Requirements:
- Implement both `ControlValueAccessor` and `Validator`, with the validator returning an error (e.g., `{ rangeInvalid: true }`) when `start` is after `end`.
- Use `ChangeDetectionStrategy.OnPush`, and make sure externally-driven updates (`writeValue`) still update the view correctly.
- Use the `NgControl` self-injection technique instead of the `NG_VALUE_ACCESSOR` provider array, and handle the case where the component is used without any surrounding form directive.
- Bonus: re-run validation automatically when either date input changes, without requiring the consumer to do anything extra.

## Further Reading

- [`ControlValueAccessor` — Angular API Reference](https://angular.dev/api/forms/ControlValueAccessor)
- [Forms — Overview](https://angular.dev/guide/forms)
- [Reactive Forms Guide](https://angular.dev/guide/forms/reactive-forms)
- [Template-driven Forms Guide](https://angular.dev/guide/forms/template-driven-forms)
- [Strictly Typed Reactive Forms](https://angular.dev/guide/forms/typed-forms)
- [Validate Form Input](https://angular.dev/guide/forms/form-validation)
- [Signal Forms — Custom Controls (`FormValueControl`/`FormCheckboxControl`)](https://angular.dev/guide/forms/signals/custom-controls)
- [Signal Forms — Comparison with Other Form Systems](https://angular.dev/guide/forms/signals/comparison)
- [Angular Material](https://material.angular.dev/) — its source code contains many real-world, production-quality `ControlValueAccessor` implementations worth studying.

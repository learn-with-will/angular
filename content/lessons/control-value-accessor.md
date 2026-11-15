---
slug: control-value-accessor
title: "ControlValueAccessor: the forms adapter"
topic: forms
kind: concept
summary: "How a custom widget, such as a star rating, plugs into formControlName and ngModel like a native input."
tags: [forms, controlvalueaccessor, custom-controls, adapter]
related: [cva-methods, cva-register, cva-toggle-example, reactive-form-model]
---
> **In one line:** `ControlValueAccessor` is the small contract that lets any component act as a form control. Implement it, and `formControlName`, `[formControl]` and `ngModel` all work with your widget.

## The idea

For a native `<input>`, Angular already ships a bridge between the `FormControl` and the DOM: `DefaultValueAccessor`, `CheckboxControlValueAccessor` and friends. The forms directive never touches the element itself, it asks the **value accessor** on that element to read and write.

Now you build a star rating, a toggle, a tag input. Giving it an `input()` and an `output()` makes it work on its own, but Angular's forms know nothing about it. It cannot receive `setValue()`, cannot report `touched`, cannot be disabled by `form.disable()`.

`ControlValueAccessor` closes that gap. It is a plug adapter between two protocols:

```flow
model: FormControl | the data model @primary
dir: `formControlName` / `ngModel` | the forms directive @blue
cva: ControlValueAccessor | your adapter, or Angular's built-in one @amber
ui: Your component | clicks, drags, internal state @green
model -> dir: value and state
dir -> cva: delegates
cva -> ui: renders and listens
```

Once implemented, your component gets validation, `disable()` and `enable()`, `reset()`, `touched` and `dirty` tracking and `formControlName` binding, and its users never need to know it is not a native element.

## See it

A component that **uses** a custom control looks identical to one using a text box:

```html
<!-- Reactive forms -->
<app-star-rating formControlName="rating" [max]="5" />
<app-toggle-switch [formControl]="notifications" />

<!-- Template-driven forms -->
<app-toggle-switch [(ngModel)]="notificationsOn" />
```

Nothing in the consuming component changes when the widget's internals do. That decoupling is the point of the contract.

## Go deeper

`ControlValueAccessor` synchronises exactly three things: **value**, **touched** and **disabled**. It does *not* validate. Validation stays separate, either through `Validators` supplied by whoever owns the form, or through the parallel `Validator` interface, which a later lesson covers.

Angular Material, the CDK and most third-party UI kits are built on this contract, so it is essential if you build reusable components. For new projects that have adopted **Signal Forms** (`@angular/forms/signals`), custom controls instead implement `FormValueControl` or `FormCheckboxControl`, which removes the callbacks and `forwardRef`. The classic contract remains the one used by reactive and template-driven forms.

Keep the widget ignorant of its form. It should never inject a `FormGroup` or reach for sibling controls, and should speak only through the contract.

## Watch out

- Giving a widget `input()` and `output()` and expecting `formControlName` to work. It needs the accessor.
- Putting validation inside the accessor methods. They only sync value, touched and disabled.
- Building a widget that knows about the surrounding form.

## Remember

- A value accessor is the bridge between a `FormControl` and your UI.
- It syncs value, touched and disabled, not validity.
- Consumers use your widget exactly like a native input.

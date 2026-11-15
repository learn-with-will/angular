---
slug: cva-register
title: "Registering the accessor"
topic: forms
kind: technique
summary: "NG_VALUE_ACCESSOR with forwardRef and multi, or NgControl self-injection: what each needs and when to use it."
tags: [forms, controlvalueaccessor, providers, forwardref]
related: [cva-methods, injection-token, provider-recipes, pitfall-cva]
---
> **In one line:** Implementing the interface is not enough. Angular's forms directives find accessors through DI, so you must provide your component under `NG_VALUE_ACCESSOR`.

## The idea

`formControlName` asks the same element for its value accessor by injecting the `NG_VALUE_ACCESSOR` token. If nothing provides it, Angular reports that there is *no value accessor for form control*. There are two ways to provide it:

| | Provider array | `NgControl` self-injection |
|---|---|---|
| Code | `providers: [{ provide: NG_VALUE_ACCESSOR, ... }]` | `inject(NgControl, { self: true, optional: true })` |
| Needs `forwardRef` | yes | no |
| Works without a form directive | yes | `ngControl` is `null`, handle it |
| Can also provide `NG_VALIDATORS` | yes | **no**, circular dependency |
| Use for | most components, anything self-validating | simple widgets always used inside a form |

The provider array is the default choice. It works everywhere.

## See it

```typescript
@Component({
  selector: 'app-my-control',
  template: `<!-- widget UI -->`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MyControl),
      multi: true,
    },
  ],
})
export class MyControl implements ControlValueAccessor { /* four methods */ }
```

```typescript
// The alternative: no provider array, no forwardRef
export class SimpleControl implements ControlValueAccessor {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }
}
```

## Go deeper

Each detail of the provider has a reason:

- `useExisting` points the token at *this* component instance, rather than creating a second one.
- `forwardRef(() => MyControl)` is needed because the object is evaluated in the decorator, before the class below it is defined. It defers the lookup until Angular needs it.
- `multi: true` is required because `NG_VALUE_ACCESSOR` is a **list** token; the forms directive expects a list of accessors. Without it you get an error instead of a working control.

For the self-injection pattern, `{ optional: true }` matters: if someone drops your widget on a page without `formControlName`, `ngControl` is `null` instead of a thrown error.

Do not combine the two patterns. `formControlName` also asks the element for `NG_VALIDATORS`; if that points back at your component while it is waiting on `NgControl`, Angular reports a circular dependency (NG0200).

## Watch out

- Omitting `multi: true` or `forwardRef`.
- Self-injecting `NgControl` without `optional: true`.
- Mixing `NgControl` self-injection with provider arrays.

## Remember

- Provide the component under `NG_VALUE_ACCESSOR` with `useExisting`, `forwardRef` and `multi`.
- `NgControl` self-injection is the lighter alternative for non-validating widgets.
- Never mix the two in one component.

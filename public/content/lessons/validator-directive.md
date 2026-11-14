---
slug: validator-directive
title: "Validators in template-driven forms"
topic: forms
kind: technique
summary: "Wrap a custom rule in a directive that provides NG_VALIDATORS, so ngModel inputs can use it as an attribute."
tags: [forms, validation, directives, ng-validators]
related: [custom-validator, template-validation, injection-token, attribute-directive]
---
> **In one line:** Template-driven forms find validators through the `NG_VALIDATORS` token, so a custom rule needs a small directive that registers itself there.

## The idea

In a reactive form you pass validator functions straight to the control. A template-driven form has no such place, since the template *is* the model. Instead, Angular collects every provider of the `NG_VALIDATORS` multi-token on the element.

To use a custom rule as an attribute, such as `appForbiddenWord="spam"`, you wrap it in a directive that implements `Validator` and provides itself under that token.

```flow
attr: Attribute | `appForbiddenWord="spam"` @primary
dir: Directive | implements `Validator` @blue
token: `NG_VALIDATORS` | multi-provider token @amber
ctrl: `NgModel` | collects all validators @green
attr -> dir: matches selector
dir -> token: provides itself
token -> ctrl: injected into
```

## See it

```typescript
@Directive({
  selector: '[appForbiddenWord]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => ForbiddenWord), multi: true },
  ],
})
export class ForbiddenWord implements Validator {
  readonly appForbiddenWord = input.required<string>();

  validate(control: AbstractControl): ValidationErrors | null {
    const word = this.appForbiddenWord().toLowerCase();
    const value = String(control.value ?? '').toLowerCase();
    return word && value.includes(word) ? { forbiddenWord: { word } } : null;
  }
}
```

```html
<input name="bio" ngModel appForbiddenWord="spam" #bio="ngModel" />
@if (bio.hasError('forbiddenWord')) {
  <p class="error">Please don't use "{{ bio.errors?.['forbiddenWord'].word }}".</p>
}
```

Add `ForbiddenWord` to the component's `imports`.

## Go deeper

Two details in the provider are not optional. `multi: true` is required because `NG_VALIDATORS` is a *list* of validators; without it the forms directive receives a single value and fails. `forwardRef` is required because the object is evaluated in the decorator, before the class below it is finished being defined.

If the rule should re-run when the directive's input changes, implement `registerOnValidatorChange(fn)` and call `fn()` from an `effect` that reads the input. Otherwise the control keeps its old validity until the user types again.

The same directive also works on `formControlName` inputs in reactive forms, so one directive serves both styles. Reuse the pure `ValidatorFn` inside it, and the logic lives in one place.

## Watch out

- Leaving out `multi: true`, which replaces the built-in validators instead of adding to them.
- Forgetting to import the directive. The attribute is then ignored.
- Not notifying the control when the directive's input changes.

## Remember

- `NG_VALIDATORS` is how template-driven forms find validators.
- Provide the directive with `useExisting`, `forwardRef` and `multi: true`.
- Reuse a plain validator function inside the directive.

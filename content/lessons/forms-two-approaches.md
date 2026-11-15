---
slug: forms-two-approaches
title: "Template-driven or reactive?"
topic: forms
kind: concept
summary: "Angular has two forms systems, and a third arriving. Know what each is for before you pick one."
tags: [forms, template-driven, reactive, signal-forms]
related: [ngmodel-two-way, reactive-form-model, control-state]
---
> **In one line:** In a **template-driven** form the template describes the form and Angular builds the model for you. In a **reactive** form you build the model in TypeScript and the template binds to it.

## The idea

Almost every app collects input: login, signup, search, settings. Doing that with raw HTML means wiring listeners, tracking values, running validation and updating the DOM by hand. Angular's forms packages do that bookkeeping for you, in one of two styles.

Both produce the same underlying objects, `FormControl` and `FormGroup`. The difference is **who owns the model**:

| | Template-driven | Reactive |
|---|---|---|
| Source of truth | the template | the component class |
| You write | directives such as `ngModel` | `FormControl`, `FormGroup`, `FormBuilder` |
| Access to the model | indirect, built at runtime | direct and synchronous |
| Validation | attributes like `required` | functions passed to the control |
| Unit testing | needs a rendered template | plain TypeScript |
| Best for | small, simple forms | anything larger, dynamic or heavily validated |

Pick per form, not per app, and never mix both styles *inside one form*.

## See it

The same email field, in each style:

```typescript
// Template-driven: the template is the model
@Component({
  selector: 'app-subscribe-td',
  imports: [FormsModule],
  template: `<input name="email" [(ngModel)]="email" required email />`,
})
export class SubscribeTd {
  email = '';
}

// Reactive: the class is the model
@Component({
  selector: 'app-subscribe-reactive',
  imports: [ReactiveFormsModule],
  template: `<input [formControl]="email" />`,
})
export class SubscribeReactive {
  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
}
```

## Go deeper

A rule of thumb: start template-driven for a search box or a one-field form, and switch to reactive the moment you need cross-field rules, a dynamic list of fields or serious unit tests. Moving later is mostly rewriting the template, not rethinking the design.

Angular also ships **Signal Forms** (`@angular/forms/signals`), a signal-based system that was experimental in Angular 21 and is stable from Angular 22. The two classic systems are still fully supported, and Angular Material and most libraries are built on them, so everything in this topic stays relevant.

Both classic styles need an import: `FormsModule` for template-driven, `ReactiveFormsModule` for reactive. Importing the wrong one is the most common first error.

## Watch out

- Using `ngModel` inside a `[formGroup]`. That mix throws a runtime error; choose one style per form.
- Starting a large form template-driven, then fighting scattered validation attributes.
- Forgetting the module import. The directives silently do nothing or throw a template error.

## Remember

- Template-driven: the template owns the model. Reactive: the class owns it.
- Choose by size and complexity, one style per form.
- `FormsModule` and `ReactiveFormsModule` are different imports.

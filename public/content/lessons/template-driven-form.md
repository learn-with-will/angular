---
slug: template-driven-form
title: "A complete template-driven form"
topic: forms
kind: technique
summary: "NgForm, template references, ngSubmit and ngModelGroup: how Angular builds the model from your template."
tags: [forms, ngform, ngmodelgroup, template-driven]
related: [ngmodel-two-way, template-validation, pitfall-forms-module-and-name, nested-groups]
---
> **In one line:** Import `FormsModule` and Angular attaches `NgForm` to every `<form>`. Each `ngModel` input becomes a control in it, keyed by its `name`.

## The idea

You write normal HTML, decorate it with directives, and Angular constructs the form model at runtime:

| In your template | Angular creates |
|---|---|
| `<form>` | an `NgForm`, holding a top-level `FormGroup` |
| an input with `ngModel` and a `name` | a `FormControl` registered under that name |
| `ngModelGroup="address"` | a nested `FormGroup` |

State is tracked for you and reflected as CSS classes such as `ng-valid`, `ng-touched` and `ng-dirty`. You get at the form with a **template reference variable**: `#f="ngForm"` exports the `NgForm` so you can read `f.value` and `f.valid`.

`(ngSubmit)` fires when the form is submitted and also prevents the browser's default page reload.

## See it

```typescript
@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  template: `
    <form #contactForm="ngForm" (ngSubmit)="onSubmit(contactForm)">
      <input name="fullName" [(ngModel)]="model.fullName" required />

      <fieldset ngModelGroup="address">
        <input name="street" [(ngModel)]="model.address.street" required />
        <input name="city" [(ngModel)]="model.address.city" required />
      </fieldset>

      <button type="submit" [disabled]="contactForm.invalid">Save</button>
    </form>
  `,
})
export class Contact {
  model = { fullName: '', address: { street: '', city: '' } };

  onSubmit(form: NgForm): void {
    if (form.invalid) return;              // never trust the disabled button alone
    console.log(form.value);               // { fullName, address: { street, city } }
    form.resetForm();                      // clears values AND touched/dirty state
  }
}
```

## Go deeper

Binding to **one typed object** (`model`) beats a pile of separate properties: the component stays tidy and TypeScript checks the field names. `ngModelGroup` then makes `form.value` nested in the same shape as your model, so it can go straight to an API.

`form.resetForm()` resets values *and* state. Reassigning the model object alone leaves the controls dirty and touched, so error messages can reappear on a form that looks empty.

`[disabled]="form.invalid"` is a user-experience hint, not a guarantee. The submit handler checks validity again because other code, or a quick keypress, can still reach it.

## Watch out

- Skipping the `invalid` check in `onSubmit`, trusting the disabled button.
- Reassigning the model object by hand and expecting the form state to reset.
- Growing a template-driven form into dozens of fields with cross-field rules. That is the signal to move to reactive.

## Remember

- `FormsModule` gives each `<form>` an `NgForm`; `ngModel` plus `name` makes a control.
- `ngModelGroup` nests the value; `#f="ngForm"` exposes the form.
- Re-check `invalid` in the handler, and reset with `resetForm()`.

---
id: lesson-12
slug: template-driven-forms
title: "Template-Driven Forms"
level: beginner
order: 8
duration: 40
tags:
  - forms
  - template-driven-forms
  - ngmodel
  - validation
  - two-way-binding
---


# Learning Objectives

After completing this lesson, you will be able to:

- Build a working template-driven form using `FormsModule`, `ngModel`, and `ngForm`.
- Use two-way data binding (`[(ngModel)]`) to keep a component property in sync with an input field.
- Add validation with native HTML attributes and display friendly error messages based on a control's state.
- Read form and control state (valid, invalid, touched, dirty) to control UI behavior such as disabling a submit button.
- Decide when a template-driven form is the right tool versus a reactive form.

# Why This Concept Exists

Almost every web application needs to collect input: login screens, contact forms, signups, settings pages. Doing this with raw HTML means manually wiring up event listeners, tracking values, running validation, and updating the DOM. That is repetitive and error-prone.

Angular offers **two** ways to build forms:

1. **Template-driven forms** – you describe the form in the HTML template using directives, and Angular builds the underlying form model for you automatically.
2. **Reactive forms** – you define the form model explicitly in the component class with `FormControl` and `FormGroup`.

Template-driven forms exist to make **simple forms fast and familiar**. If you already know HTML forms, the jump is small: you add a few Angular directives, and Angular quietly handles value tracking, validation status, and two-way binding behind the scenes. They are the most beginner-friendly entry point into Angular forms and require very little TypeScript code.

> **When to use them:** Template-driven forms are a great choice for small or simple forms (login, contact, search, basic settings). For large, dynamic, or heavily validated forms, reactive forms are more scalable and easier to test. Angular also has **Signal Forms** (`@angular/forms/signals`), a signal-based forms API that was experimental in Angular 21 and is stable since Angular 22 (see *Further Reading*). Template-driven forms remain a stable, widely used approach.

# Concept Explanation

The core idea: **the template is the source of truth for the form's structure.** You write normal HTML, decorate it with Angular form directives, and Angular constructs the form model at runtime.

Here is what happens behind the scenes:

- When you import `FormsModule`, Angular watches for `<form>` elements and automatically attaches the **`NgForm`** directive to them. `NgForm` creates a top-level `FormGroup` that tracks the whole form.
- Every input that has the **`ngModel`** directive becomes a **`FormControl`** inside that group. The `name` attribute tells Angular what key to use for that control in the form's value object.
- A **`ngModelGroup`** directive creates a nested `FormGroup`, letting you group related fields (for example, an address block).
- Angular continuously tracks each control's **value** and **state** (valid/invalid, touched/untouched, pristine/dirty) and reflects state changes onto the element using CSS classes like `ng-valid`, `ng-touched`, and `ng-dirty`.

Because the model is built from the template, you write far less component code — but you also have less direct, synchronous access to the form model, which is why complex scenarios are easier with reactive forms.

# Key Terminology

- **`FormsModule`** – The Angular module that provides the template-driven form directives (`ngModel`, `ngForm`, `ngModelGroup`). You must import it for these forms to work.
- **`NgForm`** – The directive Angular attaches automatically to every `<form>`. It represents the whole form and exposes its value and validity.
- **`NgModel` / `ngModel`** – The directive that turns a single input into a tracked form control.
- **Two-way binding `[(ngModel)]`** – "Banana in a box" syntax that keeps an input and a component property in sync in both directions.
- **`ngModelGroup`** – Groups several controls into a nested structure within the form.
- **Template reference variable** – A `#name` variable in the template. Exporting a directive into it (e.g. `#emailCtrl="ngModel"`) gives you access to that control's state.
- **Control state** – Boolean flags Angular tracks: `valid`/`invalid`, `pristine`/`dirty` (changed?), `touched`/`untouched` (focused then blurred?).

# Syntax Overview

A template-driven form has three essential pieces.

**1. Import `FormsModule` into your standalone component:**

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-example',
  imports: [FormsModule], // required for ngModel / ngForm to work
  template: `...`,
})
export class ExampleComponent {}
```

> **Note on `standalone`:** In Angular 19 and later, components are standalone by default, so you do **not** write `standalone: true`. If you are on Angular 15–18, add `standalone: true` to the `@Component` decorator for the examples below to work.

**2. Bind an input with `[(ngModel)]` (two-way binding):**

```html
<input name="username" [(ngModel)]="username" />
```

This is shorthand for combining property binding and event binding:

```html
<input
  name="username"
  [ngModel]="username"
  (ngModelChange)="username = $event"
/>
```

**3. Wire up the form and submission:**

```html
<form #f="ngForm" (ngSubmit)="onSubmit(f)">
  <input name="email" ngModel required />
  <button type="submit" [disabled]="f.invalid">Submit</button>
</form>
```

- `#f="ngForm"` exports the `NgForm` instance so you can read `f.value`, `f.valid`, etc.
- `(ngSubmit)` fires when the form is submitted (it also prevents the default page reload).
- **The `name` attribute is required** for any `ngModel` used inside a `<form>` — it is the key Angular registers the control under.

# Real World Analogy

Think of a template-driven form like ordering at a **restaurant with a paper menu**.

You (the template) just point at items on the menu — "I'll have the soup and the salad." You do not walk into the kitchen, grab pots, and cook. The kitchen staff (Angular) reads your order, prepares everything, tracks what you asked for, and tells the waiter if something is unavailable (validation errors).

In contrast, a **reactive form** is like cooking the meal yourself in your own kitchen: total control over every ingredient and step, but a lot more work. For a quick meal (a simple form), the menu approach is faster and perfectly good.

# Examples

## Example 1 — Basic: Two-Way Binding

The simplest possible use of `ngModel`: keep a single input in sync with a component property. No `<form>` element is needed for a single standalone control.

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-greeting',
  imports: [FormsModule],
  template: `
    <label for="name">Your name</label>
    <input id="name" name="name" [(ngModel)]="username" />

    <p>Hello, {{ username || 'stranger' }}! 👋</p>
  `,
})
export class GreetingComponent {
  username = '';
}
```

**What's happening:**

- `[(ngModel)]="username"` creates a two-way link. Typing in the input updates `username`; changing `username` in code updates the input.
- The interpolation `{{ username }}` re-renders instantly as you type, demonstrating the binding is live.
- Because this input is **not inside a `<form>`**, the `name` attribute is optional here, but it is good HTML practice to include it.

## Example 2 — Real-World: A Registration Form with Validation

A practical signup form: required fields, email validation, a minimum password length, inline error messages, and a submit button that stays disabled until the form is valid.

```typescript
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  template: `
    <form #registerForm="ngForm" (ngSubmit)="onSubmit(registerForm)">
      <!-- Email -->
      <label for="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        [(ngModel)]="email"
        required
        email
        #emailCtrl="ngModel"
      />
      @if (emailCtrl.invalid && emailCtrl.touched) {
        <p class="error">
          @if (emailCtrl.errors?.['required']) { Email is required. }
          @if (emailCtrl.errors?.['email']) { Please enter a valid email. }
        </p>
      }

      <!-- Password -->
      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        [(ngModel)]="password"
        required
        minlength="8"
        #passwordCtrl="ngModel"
      />
      @if (passwordCtrl.invalid && passwordCtrl.touched) {
        <p class="error">
          @if (passwordCtrl.errors?.['required']) { Password is required. }
          @if (passwordCtrl.errors?.['minlength']) {
            Password must be at least 8 characters.
          }
        </p>
      }

      <button type="submit" [disabled]="registerForm.invalid">
        Create account
      </button>
    </form>
  `,
  styles: [`.error { color: #c0392b; font-size: 0.85rem; }`],
})
export class RegisterComponent {
  email = '';
  password = '';

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      return; // guard: never trust the disabled button alone
    }
    console.log('Submitting:', form.value); // { email: '...', password: '...' }
    // ...call your service to register the user here
    form.resetForm(); // clears values AND resets touched/dirty/submitted state
  }
}
```

**What's happening and why:**

- `required`, `email`, and `minlength` are Angular's built-in validation attributes. Angular reads them and applies the matching built-in validators automatically, with no extra code. (Most look like HTML5 attributes, but `email` exists only in Angular.)
- `#emailCtrl="ngModel"` exports the control so we can read `emailCtrl.invalid`, `emailCtrl.touched`, and `emailCtrl.errors`.
- Errors are shown **only after the user has touched the field** (`&& emailCtrl.touched`), so the form does not scream at the user before they have typed anything — a key UX detail.
- `errors?.['required']` uses optional chaining and bracket notation, which is required under TypeScript strict mode.
- `[disabled]="registerForm.invalid"` improves UX, but `onSubmit` **also re-checks validity** because a disabled button is not real security.
- `@if` is Angular's modern built-in control flow (Angular 17+). It is the recommended replacement for `*ngIf` and needs no extra imports.

## Example 3 — Best Practice: Typed Model + Grouped Fields

For anything beyond a couple of inputs, bind to a single typed object and group related fields with `ngModelGroup`. This keeps the component clean and the form value well-structured.

```typescript
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

interface ContactModel {
  fullName: string;
  address: {
    street: string;
    city: string;
  };
}

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  template: `
    <form #contactForm="ngForm" (ngSubmit)="onSubmit(contactForm)">
      <label for="fullName">Full name</label>
      <input
        id="fullName"
        name="fullName"
        [(ngModel)]="model.fullName"
        required
        #nameCtrl="ngModel"
      />
      @if (nameCtrl.invalid && (nameCtrl.dirty || nameCtrl.touched)) {
        <p class="error">Full name is required.</p>
      }

      <!-- Grouped, nested fields -->
      <fieldset ngModelGroup="address">
        <legend>Address</legend>

        <label for="street">Street</label>
        <input id="street" name="street" [(ngModel)]="model.address.street" required />

        <label for="city">City</label>
        <input id="city" name="city" [(ngModel)]="model.address.city" required />
      </fieldset>

      <button type="submit" [disabled]="contactForm.invalid">Save</button>
    </form>
  `,
  styles: [`.error { color: #c0392b; font-size: 0.85rem; }`],
})
export class ContactComponent {
  model: ContactModel = {
    fullName: '',
    address: { street: '', city: '' },
  };

  onSubmit(form: NgForm): void {
    if (form.invalid) return;
    // form.value is shaped like the model, with address nested:
    // { fullName: '...', address: { street: '...', city: '...' } }
    console.log(form.value);
    form.resetForm();
  }
}
```

**Why this is the recommended structure:**

- A single typed `model` object keeps the component tidy and gives you compile-time safety via the `ContactModel` interface.
- `ngModelGroup="address"` produces a **nested** form value (`{ address: { street, city } }`) that mirrors your data model — easy to send straight to an API.
- Showing errors when the field is `dirty` **or** `touched` is a robust UX pattern: it catches both "user edited then cleared" and "user tabbed past without typing".
- Using semantic `<fieldset>` / `<legend>` and properly associated `<label for>` elements keeps the form accessible.

# Common Mistakes

- **Forgetting to import `FormsModule`.** Without it, `ngModel` is not recognized and you'll get a template error like *"Can't bind to 'ngModel'"*. In standalone components, add it to the component's `imports` array.
- **Omitting the `name` attribute inside a `<form>`.** Angular needs `name` to register the control. Without it (and without `[ngModelOptions]="{ standalone: true }"`), Angular throws a runtime error.
- **Showing errors immediately.** Displaying validation messages before the user interacts feels hostile. Always gate error messages behind `touched` and/or `dirty`.
- **Trusting the disabled submit button as your only validation.** Always re-check `form.invalid` (and validate on the server). A disabled button can be bypassed.
- **Using dot notation for errors under strict mode.** `control.errors.required` will not compile in strict TypeScript. Use `control.errors?.['required']`.
- **Reaching for template-driven forms for complex, dynamic forms.** As validation and cross-field logic grow, template-driven forms get hard to read and test. Switch to reactive forms when that happens.
- **Mutating the bound object the wrong way and expecting a reset.** Use `form.resetForm()` to clear values *and* state, rather than only reassigning component properties.

# Best Practices

- **Bind to a single typed model object** for non-trivial forms instead of many separate properties.
- **Always include `name`** on every `ngModel` inside a form.
- **Gate error messages** on `touched`/`dirty` so the UX feels natural.
- **Disable submit on `form.invalid`** for good UX, and **re-validate in the handler** for safety.
- **Group related fields with `ngModelGroup`** so the form value matches your data shape.
- **Prefer the modern `@if` / `@for` control flow** over the older `*ngIf` / `*ngFor` structural directives.
- **Consider `[ngModelOptions]="{ updateOn: 'blur' }"`** when you want validation to run on blur rather than on every keystroke — useful for expensive or noisy validations.
- **Reach for reactive forms** (or the newer Signal Forms) once a form becomes large, dynamic, or needs heavy unit testing.

# Summary

- Template-driven forms let you build forms declaratively in the template, with Angular constructing the form model for you.
- You must import `FormsModule` to use `ngModel`, `ngForm`, and `ngModelGroup`.
- `[(ngModel)]` provides two-way binding between an input and a component property.
- Inside a `<form>`, every `ngModel` needs a `name` attribute so Angular can register the control.
- Angular automatically attaches `NgForm` to `<form>` elements and tracks value and validity.
- Validation uses Angular's built-in validation attributes (`required`, `email`, `minlength`, `maxlength`, `pattern`), which map to built-in validators.
- Export controls and the form with template variables (`#x="ngModel"`, `#f="ngForm"`) to read state like `invalid`, `touched`, and `errors`.
- Show error messages only after a field is `touched` or `dirty`, and disable submit while the form is invalid.
- `ngModelGroup` creates nested structures that mirror your data model.
- Use template-driven forms for simple forms; choose reactive forms for complex or dynamic ones.

# Flash Cards

**Q:** Which Angular module must you import to use template-driven forms?
**A:** `FormsModule` from `@angular/forms`. In a standalone component, add it to the component's `imports` array.

**Q:** What does the `[(ngModel)]` "banana in a box" syntax do?
**A:** It sets up two-way data binding — input changes update the component property, and property changes update the input. It is shorthand for `[ngModel]` plus `(ngModelChange)`.

**Q:** Why is the `name` attribute required on an `ngModel` input inside a `<form>`?
**A:** Angular uses `name` as the key to register the control within the form's `FormGroup`. Without it (and without `standalone` options), Angular throws an error.

**Q:** How do you access a control's validity and error state in the template?
**A:** Export the directive into a template reference variable, e.g. `#emailCtrl="ngModel"`, then read `emailCtrl.invalid`, `emailCtrl.touched`, `emailCtrl.errors`.

**Q:** When should you choose template-driven forms over reactive forms?
**A:** For small or simple forms with light validation. Reactive forms are preferable for large, dynamic, or heavily tested forms because they give synchronous, explicit control over the model.

# Exercises

## Easy
Create a standalone component with a single text input bound to a `city` property using `[(ngModel)]`. Below the input, display the live text: `"Weather for: {city}"`. Confirm that typing updates the text instantly.

## Medium
Build a login form (`email` + `password`) inside a `<form>`. Make both fields `required`, make the email use the `email` validator, and require the password to be at least 6 characters. Show an inline error under each field **only after it has been touched**, and disable the submit button while the form is invalid. On submit, log `form.value` to the console.

## Challenging
Create a "Shipping details" form using a typed model and `ngModelGroup`. Group `firstName` and `lastName` under a `customer` group, and `street`, `city`, and `postalCode` under an `address` group. Add `required` to every field and a `pattern` validator on `postalCode` (for example, 5 digits: `[0-9]{5}`). Display tailored error messages, disable submit until valid, and on submit log the nested `form.value`, then call `form.resetForm()`. Bonus: set `[ngModelOptions]="{ updateOn: 'blur' }"` on `postalCode` so its validation runs on blur instead of every keystroke.

# Further Reading

- **Template-driven forms (official guide):** https://angular.dev/guide/forms/template-driven-forms
- **Forms overview & choosing an approach:** https://angular.dev/guide/forms
- **Validate form input (official guide):** https://angular.dev/guide/forms/form-validation
- **Built-in `Validators` API reference:** https://angular.dev/api/forms/Validators
- **`NgModel` API reference:** https://angular.dev/api/forms/NgModel
- **`NgForm` API reference:** https://angular.dev/api/forms/NgForm
- **Reactive forms (when you outgrow template-driven):** https://angular.dev/guide/forms/reactive-forms
- **Signal Forms (newer signal-based forms API):** https://angular.dev/guide/forms (see the Signal Forms section)
- **Built-in control flow `@if` / `@for`:** https://angular.dev/guide/templates/control-flow

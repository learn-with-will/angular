---
title: "Angular Templating Syntax: Interpolation & Binding"
level: "beginner"
estimatedTime: 35
tags:
  - angular
  - templates
  - data-binding
  - interpolation
  - signals
  - frontend
---

# Learning Objectives

After completing this lesson, you will be able to:

- Display dynamic component data in the DOM using **interpolation** (`{{ }}`).
- Push data from your component into element **properties**, **attributes**, **classes**, and **styles** using one-way binding.
- React to user actions with **event binding** and the `$event` object.
- Keep a value in sync between the component and the view using **two-way binding** (`[(ngModel)]` and `model()`).
- Recognize the difference between DOM properties and HTML attributes, and choose the correct binding for each situation.

# Why This Concept Exists

A web page is built from HTML, which is static by design. The moment your app needs to show something that *changes* — a username, a shopping-cart count, a button that becomes disabled while a form submits — plain HTML stops being enough.

You could reach for the DOM API directly (`document.querySelector(...).textContent = ...`), but that approach is fragile: you have to manually find elements, manually update them, and manually keep them in sync every time the data changes. In a real app this becomes a maze of update code that breaks easily.

Angular's templating syntax solves this. Instead of imperatively *telling the DOM what to do*, you *declare a relationship* between your component's data and the template. Angular then keeps the DOM up to date for you. You describe **what** the UI should look like for a given state, and Angular handles the **how**. This declarative, automatic synchronization is the foundation of every Angular app.

# Concept Explanation

In Angular, a **template** is the HTML that defines what a component renders. Inside that template you can connect the HTML to your component class using **bindings**.

There are four directions data can flow, and each has its own syntax:

1. **Interpolation** — component → view, as *text*. Renders a value into the page as a string. Syntax: `{{ value }}`.
2. **Property / attribute / class / style binding** — component → view, into an element *property*. Syntax: `[target]="expression"`.
3. **Event binding** — view → component. Runs a method when something happens in the DOM. Syntax: `(event)="handler()"`.
4. **Two-way binding** — view ↔ component, both directions at once. Syntax: `[(target)]="value"`.

The first two are **one-way** flows from your data into the view. The third is a one-way flow from the view back into your data. The fourth combines a one-way binding *in* with an event binding *out*, which is why its `[( )]` syntax literally combines the `[ ]` of property binding with the `( )` of event binding.

A critical detail in modern Angular: **values that change over time should be stored in signals.** A signal is a reactive container created with `signal(...)`. When you read a signal in a template (by calling it: `count()`), Angular tracks that read and automatically re-renders the affected part of the page whenever the signal's value changes. This is the recommended way to drive bindings in current Angular.

Whatever you write inside a binding (the part between the quotes or curly braces) is a **template expression**. It looks like JavaScript but is intentionally restricted — more on that in the next sections.

# Key Terminology

- **Template** — The HTML associated with a component; where bindings live.
- **Interpolation** — Embedding a value as text using `{{ }}`.
- **Template expression** — The code inside a binding (e.g. `user.name`, `price * 2`). It is evaluated against the component instance, not against global scope, and cannot have side effects like assignments (except in event bindings).
- **Property binding** — Setting a DOM **property** with `[property]="expr"`.
- **Attribute binding** — Setting an HTML **attribute** that has no matching DOM property, using `[attr.name]="expr"`.
- **Event binding** — Listening for a DOM event with `(event)="handler($event)"`.
- **Two-way binding** — Keeping a value synced in both directions with `[(target)]="value"` (the "banana in a box").
- **Signal** — A reactive value container (`signal(0)`). Reading it in a template (`count()`) makes the view update automatically when it changes.
- **`$event`** — A special variable in event bindings holding the event payload (the DOM event, or a value emitted by a custom event).
- **DOM property vs. HTML attribute** — Attributes are the static values written in HTML markup; properties are the live values on the JavaScript DOM object. Angular bindings target *properties* by default.

# Syntax Overview

### Interpolation

```html
<!-- Renders the value of a signal or property as text -->
<h1>Hello, {{ name() }}!</h1>
<p>Total: {{ price * quantity }}</p>
```

### Property binding

```html
<!-- Sets the DOM property `disabled` (a boolean), not a string -->
<button [disabled]="isSaving()">Save</button>

<!-- Sets the `src` property of the image -->
<img [src]="avatarUrl()" />
```

### Attribute binding (for attributes without a DOM property)

```html
<!-- ARIA, SVG, colspan, etc. have no matching DOM property -->
<button [attr.aria-label]="label()">X</button>
<td [attr.colspan]="span()">Cell</td>
```

### Class and style binding

```html
<!-- Toggle a single class based on a boolean -->
<div [class.active]="isActive()">...</div>

<!-- Bind multiple classes via an object or string -->
<div [class]="{ active: isActive(), disabled: isDisabled() }">...</div>

<!-- Set a single style, optionally with a unit -->
<p [style.color]="color()">...</p>
<div [style.width.px]="width()">...</div>
```

### Event binding

```html
<!-- Call a method when the click event fires -->
<button (click)="addItem()">Add</button>

<!-- $event holds the DOM event payload -->
<input (input)="onInput($event)" />
```

### Two-way binding

```html
<!-- Built-in form controls: requires FormsModule -->
<input [(ngModel)]="searchTerm" />

<!-- Custom component with a model() input -->
<app-counter [(count)]="total" />
```

> **Template expression rules:** expressions are evaluated against the component instance. You **cannot** use `new`, `++`/`--`, assignments (outside event bindings), or chained statements (`;`). You also can't reference globals like `window`, `document`, or `console`. If you need a value like `Math.max(...)`, expose it from your component class.

# Real World Analogy

Think of your component class as the **control room** of a building and the template as the **lobby dashboard** that visitors see.

- **Interpolation** is a *read-only display screen* in the lobby. The control room sets the number ("Current visitors: 12") and the lobby just shows it. Visitors can't change it.
- **Property binding** is the control room *flipping a switch* on a device in the lobby — locking a door (`[disabled]`), changing a sign's image (`[src]`), turning a light red (`[style.color]`). Data flows one way: control room → device.
- **Event binding** is a *button or motion sensor* in the lobby that sends a signal back to the control room. Data flows the other way: lobby → control room.
- **Two-way binding** is a *smart thermostat dial*. It always shows the current temperature (display in), and turning it sends the new setting back (event out). The dial and the control room are always in sync — change one, and the other updates automatically.

# Examples

## Example 1 — Basic: Interpolation and property binding

A simple profile card that displays data and binds it into element properties.

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-profile-card',
  template: `
    <article>
      <!-- Interpolation: render signal values as text -->
      <h1>Hello, {{ name() }}!</h1>
      <p>You have {{ messageCount() }} new messages.</p>

      <!-- Property binding: set the src and alt PROPERTIES of the image -->
      <img [src]="avatarUrl()" [alt]="'Avatar of ' + name()" width="80" />

      <!-- Property binding to a boolean DOM property -->
      <button [disabled]="messageCount() === 0">Open inbox</button>
    </article>
  `,
})
export class ProfileCardComponent {
  // Signals hold values that may change over time.
  // Reading them in the template (name(), etc.) makes the view reactive.
  name = signal('Ada');
  messageCount = signal(3);
  avatarUrl = signal('https://example.com/avatars/ada.png');
}
```

**What's happening:**
- `{{ name() }}` and `{{ messageCount() }}` render text. Notice the parentheses — `name` is a signal, so you *call* it to read its value.
- `[src]="avatarUrl()"` sets the image element's `src` **property**. Using property binding (rather than `src="{{ avatarUrl() }}"`) is the clearest choice and works for any value type.
- `[disabled]="messageCount() === 0"` binds a real boolean to the button's `disabled` property. Angular will add or remove the disabled state correctly.

## Example 2 — Real-world: Event binding with class and style binding

A task item the user can toggle complete. This combines event binding (handling the click) with class and style binding (reflecting state visually).

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-task-item',
  template: `
    <div
      class="task"
      [class.completed]="done()"
      [style.opacity]="done() ? 0.5 : 1"
    >
      <span>{{ title() }}</span>

      <!-- Event binding: run toggle() when the button is clicked -->
      <button (click)="toggle()">
        {{ done() ? 'Mark as not done' : 'Mark as done' }}
      </button>
    </div>
  `,
  styles: `
    .task { display: flex; gap: 1rem; align-items: center; }
    .completed span { text-decoration: line-through; }
  `,
})
export class TaskItemComponent {
  title = signal('Write the lesson');
  done = signal(false);

  toggle(): void {
    // update() reads the current value and returns the new one.
    this.done.update((current) => !current);
  }
}
```

**What's happening:**
- `(click)="toggle()"` listens for clicks and calls the component method. The parentheses after `toggle` matter — `(click)="toggle"` would *not* call the method.
- `[class.completed]="done()"` adds the `completed` CSS class only while `done()` is true, leaving any static classes (`task`) untouched.
- `[style.opacity]="done() ? 0.5 : 1"` sets an inline style reactively.
- The button label uses interpolation with a ternary so it always matches the current state.

## Example 3 — Best practice: Two-way binding with a custom `model()` input

The modern Angular approach for a reusable two-way-bindable component is a **`model()` signal input**. Here a child `<app-quantity-stepper>` owns its UI, and the parent stays perfectly in sync with a signal.

```typescript
import { Component, model, signal } from '@angular/core';

// CHILD: exposes a two-way bindable `value` via model()
@Component({
  selector: 'app-quantity-stepper',
  template: `
    <div class="stepper">
      <button (click)="change(-1)" [disabled]="value() <= 0">-</button>
      <span>{{ value() }}</span>
      <button (click)="change(1)">+</button>
    </div>
  `,
})
export class QuantityStepperComponent {
  // model() creates an input that can be READ and WRITTEN, and that
  // propagates changes back to whatever the parent bound to it.
  value = model<number>(0);

  change(delta: number): void {
    this.value.update((current) => Math.max(0, current + delta));
  }
}

// PARENT: binds its own signal with the banana-in-a-box syntax
@Component({
  selector: 'app-cart',
  imports: [QuantityStepperComponent],
  template: `
    <h2>Cart</h2>
    <!-- [(value)] keeps `quantity` and the child's model in sync -->
    <app-quantity-stepper [(value)]="quantity" />
    <p>Subtotal: {{ quantity() * unitPrice }}</p>
  `,
})
export class CartComponent {
  quantity = signal(1);
  unitPrice = 12;
}
```

**What's happening:**
- `value = model<number>(0)` declares a two-way bindable input on the child. Angular automatically creates a matching `valueChange` output behind the scenes.
- The child can both read (`value()`) and write (`this.value.update(...)`) its model. Writing propagates the new value up to the parent.
- `[(value)]="quantity"` in the parent binds directly to the `quantity` **signal instance** (not `quantity()`). Change the stepper and `quantity` updates; change `quantity` in code and the stepper updates.

> For native form controls (`<input>`, `<select>`, `<textarea>`), use `[(ngModel)]` instead, and import `FormsModule`:
>
> ```typescript
> import { Component } from '@angular/core';
> import { FormsModule } from '@angular/forms';
>
> @Component({
>   selector: 'app-search',
>   imports: [FormsModule],
>   template: `
>     <input [(ngModel)]="term" placeholder="Search..." />
>     <p>Searching for: {{ term }}</p>
>   `,
> })
> export class SearchComponent {
>   term = '';
> }
> ```

# Common Mistakes

- **Mixing interpolation with binding brackets.** Writing `[disabled]="{{ isSaving }}"` is invalid. Use one or the other: `[disabled]="isSaving()"`. The `[ ]` *already* takes an expression.
- **Using string interpolation for boolean properties.** `<button disabled="{{ isSaving() }}">` sets the attribute to the *string* `"false"`, which the browser still treats as "disabled present" — so the button stays disabled. Use property binding: `[disabled]="isSaving()"`.
- **Forgetting to call signals.** `{{ count }}` renders the signal *function* (something like `() => ...`), not its value. You must call it: `{{ count() }}`.
- **Forgetting the parentheses on event handlers.** `(click)="save"` references the method without calling it; nothing happens. Use `(click)="save()"`.
- **Confusing attributes and properties.** `[colspan]`, `[aria-label]`, and most SVG attributes have no DOM property, so plain property binding silently fails. Use attribute binding: `[attr.colspan]`, `[attr.aria-label]`.
- **Forgetting `FormsModule` for `[(ngModel)]`.** Without importing it in the component's `imports`, Angular throws a "can't bind to 'ngModel'" error.
- **Putting heavy logic in templates.** Calling an expensive method inside `{{ }}` runs it on every change detection cycle. Compute the value in the class (ideally with a `computed()` signal) instead.

# Best Practices

- **Store changing values in signals** and read them in templates. This gives you reliable, fine-grained reactivity and works with modern zoneless and OnPush change detection.
- **Prefer property binding over attribute interpolation** for anything that isn't plain static text — it's clearer and handles non-string values (booleans, numbers, objects) correctly.
- **Use `[attr.*]` only when there is no DOM property** (ARIA, SVG, `colspan`, `role` on some elements). Otherwise use normal property binding.
- **Keep template expressions short and side-effect free.** They should read data, not change it. Move calculations into `computed()` signals or methods.
- **Use object or array syntax for class and style binding** (`[class]="{ active: isActive() }"`) instead of building strings by concatenation — it's easier to read and less error-prone.
- **Reach for `[(ngModel)]` for native form fields** and **`model()` for custom reusable components.** Don't hand-roll two-way binding with separate `[value]` + `(input)` unless you need custom behavior.
- **Don't overuse two-way binding.** Most data should flow one way. Reserve two-way binding for genuinely bidirectional controls like form inputs and sliders.
- **In modern Angular, `standalone` components are the default** — you simply list dependencies in the `imports` array. (On Angular versions before 19 you must add `standalone: true` explicitly.)

# Summary

- Angular templating lets you **declaratively connect** component data to the DOM instead of updating elements by hand.
- **Interpolation** (`{{ value }}`) renders data as text.
- **Property binding** (`[prop]="expr"`) sets a DOM property; it's the right tool for booleans, numbers, and dynamic values.
- **Attribute binding** (`[attr.name]="expr"`) is for attributes that have no DOM property, like ARIA and SVG.
- **Class and style binding** (`[class.x]`, `[style.x]`, and their object forms) reactively control appearance.
- **Event binding** (`(event)="handler($event)"`) responds to user actions; `$event` carries the payload.
- **Two-way binding** (`[(target)]="value"`) combines a one-way binding in with an event out — use `[(ngModel)]` for native inputs and `model()` for custom components.
- **Signals** are the modern, recommended source for any value that changes over time; read them in templates by calling them (`count()`).
- Template expressions are a **restricted subset of JavaScript**: no assignments (outside events), no `new`, no globals.
- Choosing the correct binding depends on understanding the **difference between HTML attributes and DOM properties**.

# Flash Cards

Q: What does interpolation (`{{ }}`) do, and what does it render the value as?
A: It embeds a component value into the template, rendering it as **text** (a string).

Q: Why should you use `[disabled]="isSaving()"` instead of `disabled="{{ isSaving() }}"`?
A: Property binding sets the real boolean DOM property. Interpolation produces the string `"false"`, which the browser still treats as disabled — so the button never re-enables.

Q: When must you use attribute binding (`[attr.name]`) instead of property binding?
A: When the attribute has **no corresponding DOM property**, such as ARIA attributes, SVG attributes, or `colspan`.

Q: What is the `$event` variable in an event binding?
A: A special variable holding the event's payload — the native DOM event for built-in events, or the emitted value for custom outputs.

Q: What is the modern Angular way to make a custom component support two-way binding?
A: Declare a `model()` signal input on the child (e.g. `value = model(0)`), then bind it from the parent with `[(value)]="..."`.

# Exercises

### Easy

Create a standalone `GreetingComponent` with a `username` signal initialized to `'Sam'`. In the template, display `Welcome back, Sam!` using interpolation, and bind the page section's `[class.vip]` to a `isVip` signal (start it as `true`).

### Medium

Build a `LightSwitchComponent` with an `isOn` signal (default `false`). Add a button that toggles it using event binding. The button should:
- show the text `Turn on` or `Turn off` depending on state (interpolation),
- bind `[style.backgroundColor]` to yellow when on and grey when off,
- bind `[attr.aria-pressed]` to the current state for accessibility.

### Challenging

Create a reusable `RatingComponent` that exposes a two-way bindable `value` using `model<number>(0)`. It should render five buttons (1–5); clicking a button sets the rating. Then build a parent `ReviewComponent` that holds a `score` signal, binds `[(value)]="score"` to the rating component, and displays `You rated this 4 / 5` using interpolation. Bonus: in the parent, add a "Reset" button that sets `score` back to `0` and confirm the rating component updates automatically.

# Further Reading

- [Templates — Overview](https://angular.dev/guide/templates) — the entry point for all template syntax in the official Angular docs.
- [Binding dynamic text, properties and attributes](https://angular.dev/guide/templates/binding) — interpolation, property binding, attribute binding, and class/style binding in depth.
- [Adding event listeners](https://angular.dev/guide/templates/event-listeners) — event binding and the `$event` object.
- [Two-way binding](https://angular.dev/guide/templates/two-way-binding) — `[(ngModel)]` for forms and `[(...)]` for components.
- [Accepting data with input properties](https://angular.dev/guide/components/inputs) — covers `input()` and `model()` (model inputs for two-way binding).
- [Signals](https://angular.dev/guide/signals) — the reactive primitive that should drive your bindings.
- [Expression syntax](https://angular.dev/guide/templates/expression-syntax) — exactly what is and isn't allowed inside a template expression.

---
id: lesson-10
slug: event-binding-and-user-interactions
title: "Event Binding & User Interactions"
level: beginner
order: 7
duration: 40
tags:
  - event-binding
  - user-interaction
  - templates
  - signals
  - components
---


# Learning Objectives

After completing this lesson, you will be able to:

- Bind native DOM events (like `click`, `input`, and `keyup`) to component methods using Angular's `(event)` syntax.
- Access event data through the `$event` variable and read values from the DOM safely.
- Use keyboard event modifiers such as `(keyup.enter)` to respond to specific keys.
- Define and emit your own custom events from a component using the modern `output()` function.
- Apply best practices for handling user interactions with signals, and recognize the legacy patterns you'll still encounter in older code.

# Why This Concept Exists

A web application is only useful if it can respond to the user. People click buttons, type into fields, hover over menus, and press keys. Without a way to react to these actions, your component would just render static HTML.

In plain JavaScript, you wire up interactions with `element.addEventListener('click', handler)`. This works, but it forces you to manually query DOM elements, attach listeners, remember to remove them, and keep the DOM in sync with your data by hand. In a large app, that bookkeeping becomes a major source of bugs and memory leaks.

Angular's **event binding** solves this. You declare *what should happen* directly in the template, right next to the element it belongs to. Angular takes care of attaching the listener, passing you the event object, and cleaning up the listener when the element is destroyed. The result is code that is declarative, readable, and leak-free.

# Concept Explanation

Event binding connects an event emitted by an element (or a component) to a method in your component class. When the event fires, Angular runs the expression you provided.

The flow looks like this:

1. A user performs an action — for example, clicking a button.
2. The browser (or an Angular component) emits an event for that action.
3. Angular sees the event binding you declared in the template and runs the associated statement.
4. Your method updates state — typically a **signal** — and Angular re-renders the affected part of the view.

There are two sources of events you can bind to:

- **Native DOM events** — events that any HTML element emits, such as `click`, `input`, `submit`, `keydown`, `mouseover`, and so on. You can bind to any standard DOM event.
- **Custom component events (outputs)** — events that *you* define on your own components so a child can notify its parent that something happened.

Both use the exact same parentheses syntax in the template, which keeps the mental model simple.

A quick note on modern Angular: since standalone components are the default and the framework is moving toward a **signals-first** model, event handlers in current Angular typically update a signal (using `.set()` or `.update()`), and the template automatically reflects the new value. We'll use that approach throughout this lesson.

# Key Terminology

- **Event binding** — the mechanism that runs a template statement in response to an event, written with parentheses: `(click)="..."`.
- **Target event** — the name of the event you're listening for, e.g. `click`, `keyup`, or a custom output name.
- **Template statement** — the expression Angular runs when the event fires, usually a method call like `save()`.
- **`$event`** — a special template variable that holds the event payload. For native events, it's the DOM `Event` object; for custom outputs, it's whatever value the output emitted.
- **Output** — a custom event a component exposes so a parent can react to it. Created with the `output()` function.
- **Event modifier** — a suffix that filters *when* a handler runs, e.g. `(keyup.enter)` only fires when the Enter key is released.
- **Host element** — the element that a component or directive is attached to. You can bind events to it via the `host` property.

# Syntax Overview

The core syntax wraps the **event name in parentheses** on the left, and a **template statement in quotes** on the right:

```typescript
// (targetEvent)="templateStatement"
// <button (click)="onSave()">Save</button>
```

To receive the event object, pass the built-in `$event` variable into your method:

```typescript
// <input (input)="onInput($event)" />
```

To listen for a specific key, add a key modifier after a dot:

```typescript
// Fires only when Enter is released inside the input
// <input (keyup.enter)="submit()" />
```

To define a custom event on your own component, use the `output()` function:

```typescript
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-panel',
  template: `<button (click)="close.emit()">Close</button>`,
})
export class Panel {
  // 'close' is now a custom event other components can listen to
  close = output<void>();
}
```

A parent then listens to it with the same parentheses syntax:

```typescript
// <app-panel (close)="onPanelClosed()" />
```

# Real World Analogy

Think of event binding like setting up a **doorbell**.

Without Angular (raw JavaScript), you'd be the person standing by the door, watching for visitors, and manually deciding when to react — and if you walk away, no one answers. With Angular's event binding, you install a doorbell wired to a specific room: "When someone presses *this* button `(click)`, ring *this* bell `onVisitor()`." You declare the wiring once, and the system handles the watching and the cleanup. The `$event` is the intercom — it tells you *who* rang and any details about the visit. And a custom `output()` is like installing your own buzzer that the rest of the house can choose to listen for.

# Examples

## Example 1 — Basic example: a click counter

This is the simplest possible interaction: a button that increments a number each time it's clicked. Notice the state is held in a **signal**, and the handler updates it with `.update()`.

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  // Standalone components are the default in modern Angular,
  // so no NgModule is needed.
  template: `
    <p>Clicks: {{ count() }}</p>
    <button (click)="increment()">Click me</button>
  `,
})
export class Counter {
  // A signal holds reactive state. Reading it in the template
  // with count() automatically keeps the view in sync.
  count = signal(0);

  increment(): void {
    // .update() receives the current value and returns the new one.
    this.count.update((value) => value + 1);
  }
}
```

**Explanation:** The `(click)` binding tells Angular to call `increment()` whenever the button is clicked. `increment()` updates the `count` signal, and because the template reads `count()`, Angular re-renders the paragraph automatically. There are no manual `addEventListener` calls and no manual DOM updates.

## Example 2 — Real-world example: a search box with `$event` and a keyboard modifier

Most real forms need the value the user typed and a way to submit. Here we read the input value from `$event`, store it in a signal, and trigger a search when the user presses Enter.

```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-search',
  template: `
    <input
      type="text"
      placeholder="Search..."
      (input)="onInput($event)"
      (keyup.enter)="search()"
    />
    <button (click)="search()">Search</button>

    @if (lastSearch()) {
      <p>Searching for: {{ lastSearch() }}</p>
    }
  `,
})
export class Search {
  query = signal('');
  lastSearch = signal('');

  onInput(event: Event): void {
    // $event is a DOM Event. We cast its target to read the value.
    const input = event.target as HTMLInputElement;
    this.query.set(input.value);
  }

  search(): void {
    this.lastSearch.set(this.query());
    // In a real app you'd call a service here, e.g. this.api.search(this.query())
  }
}
```

**Explanation:** The `(input)` binding fires on every keystroke and passes `$event`. We cast `event.target` to `HTMLInputElement` so TypeScript knows it has a `value`. The `(keyup.enter)` modifier means `search()` only runs when Enter is released — Angular handles the key-matching for you, so you don't have to inspect `event.key` manually. The `@if` block (Angular's built-in control flow) shows the result only once a search has run.

## Example 3 — Best-practice example: a child component with a custom output

Components should communicate through clearly defined events rather than reaching into each other. Here a reusable `RatingComponent` emits a custom event with the chosen value, and the parent reacts to it. This uses the modern `output()` function.

```typescript
// rating.component.ts
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-rating',
  template: `
    @for (star of stars; track star) {
      <button (click)="select(star)">
        {{ star }} ⭐
      </button>
    }
  `,
})
export class Rating {
  stars = [1, 2, 3, 4, 5];

  // output() creates a custom event. The generic <number>
  // describes the payload this event emits.
  rated = output<number>();

  select(value: number): void {
    // emit() sends the value to whoever is listening.
    this.rated.emit(value);
  }
}
```

```typescript
// app.component.ts
import { Component, signal } from '@angular/core';
import { Rating } from './rating.component';

@Component({
  selector: 'app-root',
  // Import the child component to use it in this standalone component.
  imports: [Rating],
  template: `
    <h2>Rate this lesson</h2>

    <!-- Listen to the custom 'rated' event just like a native event.
         $event here is the number the child emitted. -->
    <app-rating (rated)="onRated($event)" />

    @if (rating()) {
      <p>You rated this {{ rating() }} out of 5.</p>
    }
  `,
})
export class App {
  rating = signal(0);

  onRated(value: number): void {
    this.rating.set(value);
  }
}
```

**Explanation:** The child owns its internal behavior and simply announces "I was rated with this value" through `rated.emit(value)`. The parent decides what to do with that information. This keeps components decoupled and reusable. Note that `output()` is the current recommended API — it replaces the older `@Output()` decorator paired with `EventEmitter`, which you'll still see in existing codebases.

# Common Mistakes

- **Forgetting the parentheses on the method call.** Writing `(click)="save"` binds the *reference* to the method instead of calling it — nothing useful happens. You almost always want `(click)="save()"`. (Passing a bare reference is only correct in rare cases like `(click)="someSignal.set(true)"` patterns, where you're writing a full statement.)
- **Confusing `()` with `[]`.** Square brackets `[prop]="value"` are *property binding* (data flowing **into** the element). Parentheses `(event)="handler()"` are *event binding* (events flowing **out**). Mixing them up is the most common early error.
- **Not typing `$event`.** Leaving the parameter as `any` loses type safety. Type it as `Event` (or a more specific type like `KeyboardEvent` / `MouseEvent`) and cast `event.target` when you need element-specific properties.
- **Putting heavy logic in the template statement.** Template statements should be short — usually a single method call. Don't write multi-step logic inline; move it into a method so it's testable and readable.
- **Manually matching keys when a modifier exists.** Writing `if (event.key === 'Enter')` inside a handler is unnecessary when you can use `(keyup.enter)`. Let Angular do the filtering.
- **Reusing legacy `@Output()` for new code without knowing why.** It still works, but `output()` is the modern, recommended approach. Reach for it in new components.

# Best Practices

- **Keep template statements minimal.** Bind to a named method (`(click)="addItem()"`), and keep the real work in the class where it can be tested.
- **Update signals in your handlers.** In modern Angular, handlers typically call `signal.set()` or `signal.update()`, and the template reflects the change automatically. This is cleaner than mutating plain properties.
- **Prefer `output()` over `@Output() + EventEmitter`** for custom component events. It's the current API, has better type inference, and produces less boilerplate.
- **Use event modifiers for keyboard interactions** (`(keyup.enter)`, `(keydown.escape)`) instead of inspecting `event.key` by hand.
- **Type `$event` precisely.** Use `MouseEvent`, `KeyboardEvent`, or `Event`, and cast `event.target` to the specific element type when reading values.
- **Bind host-element events with the `host` property.** When a component itself needs to listen to an event (e.g., a click anywhere on the component), prefer the `host` metadata property over the legacy `@HostListener` decorator, which exists mainly for backwards compatibility:

  ```typescript
  @Component({
    selector: 'app-dropdown',
    host: {
      // Closes the dropdown when the host element is clicked.
      '(click)': 'toggle()',
    },
    template: `...`,
  })
  export class Dropdown {
    toggle(): void { /* ... */ }
  }
  ```

- **Call `event.preventDefault()` deliberately**, for example to stop a form's default page reload before handling submission in your own code.

# Summary

- Event binding uses the `(event)="statement"` syntax to run a method when an event fires.
- Parentheses `()` mean events flowing *out*; square brackets `[]` mean data flowing *in*.
- The `$event` variable gives you the event payload — a DOM `Event` for native events, or the emitted value for custom outputs.
- Bind to any native DOM event: `click`, `input`, `keyup`, `mouseover`, `submit`, and more.
- Keyboard modifiers like `(keyup.enter)` let Angular filter for specific keys so you don't have to.
- Define custom component events with the modern `output()` function and emit them with `.emit()`.
- The legacy `@Output()` + `EventEmitter` pattern still works but is no longer the recommended approach for new code.
- Handlers in modern Angular usually update **signals**, which keeps the view in sync automatically.
- Keep template statements short — delegate real logic to component methods.
- Prefer the `host` property over `@HostListener` for listening to events on a component's own host element.

# Flash Cards

Q: What is the syntax for binding to an event in an Angular template?
A: Wrap the event name in parentheses and assign a quoted template statement, e.g. `(click)="onSave()"`.

Q: What does the `$event` variable contain?
A: The event payload. For native DOM events it's the DOM `Event` object (with `target`, `target.value`, etc.); for custom outputs it's the value the output emitted.

Q: How do you create a custom event on a component in modern Angular?
A: Assign a property to the `output()` function (e.g. `saved = output<string>();`) and call `this.saved.emit(value)` to fire it.

Q: How do you run a handler only when the user presses the Enter key?
A: Use a keyboard event modifier: `(keyup.enter)="submit()"`. Angular matches the key for you.

Q: What's the difference between `[value]="x"` and `(input)="y($event)"`?
A: `[value]` is property binding — data flows *into* the element. `(input)` is event binding — events flow *out* of the element to your handler.

# Exercises

## Easy

Create a standalone `ToggleComponent` with a button. Each time the button is clicked, it should switch a boolean signal between `true` and `false`, and the template should display either "ON" or "OFF". Use `(click)` and a signal's `.update()` method.

## Medium

Build a `LiveGreetingComponent` with a text input. As the user types their name (use the `(input)` event and `$event`), store it in a signal. Below the input, display "Hello, {name}!" — but only show the greeting when the input is not empty (use an `@if` block). Type `$event` as `Event` and cast `event.target` correctly.

## Challenging

Create a reusable `ConfirmButtonComponent` that shows a "Delete" button. The first click should change the button text to "Are you sure?" (tracked with a signal). The second click should emit a custom `confirmed` event using `output()`, then reset back to "Delete". In a parent component, listen for `(confirmed)` and add a message to an on-screen log. Bonus: add a keyboard `(keyup.escape)` handler on the button that cancels the confirmation state.

# Further Reading

- [Adding event listeners — angular.dev](https://angular.dev/guide/templates/event-listeners) — the official guide to native event binding, `$event`, and key modifiers.
- [Custom events with outputs — angular.dev](https://angular.dev/guide/components/outputs) — the modern `output()` function and the legacy `@Output()` pattern.
- [Host elements — angular.dev](https://angular.dev/guide/components/host-elements) — using the `host` property for host-element event listeners.
- [Two-way binding — angular.dev](https://angular.dev/guide/templates/two-way-binding) — combining property and event binding with `[()]` and `model()`.
- [Signals — angular.dev](https://angular.dev/guide/signals) — the reactive primitive your event handlers will typically update.
- [Event handling tutorial — angular.dev](https://angular.dev/tutorials/learn-angular/7-event-handling) — a short interactive lesson to practice in the browser.

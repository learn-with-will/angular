---
id: lesson-36
slug: custom-directives
title: "Custom Directives: Attribute, Structural & Host Directives"
level: intermediate
order: 12
duration: 50
tags:
  - directives
  - attribute-directives
  - structural-directives
  - host-directives
  - signals
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what a directive is and how attribute directives, structural directives, and components differ.
- Build an attribute directive that reads signal inputs and changes its host element through `host` bindings and listeners.
- Build a structural directive that creates and removes views with `TemplateRef` and `ViewContainerRef`.
- Export a directive with `exportAs` so templates can use it through a template reference variable.
- Compose reusable behavior into components with `hostDirectives`.

## Why This Concept Exists

Components bundle a template, styles, and behavior. But a lot of UI behavior doesn't need a template of its own. It needs to *attach* to an element that already exists:

- Highlight a row when the pointer is over it.
- Close a dropdown when the user clicks somewhere else on the page.
- Show a button only to users with a certain role.
- Add the same tooltip, focus ring, or permission check to buttons, links, and cards alike.

Wrapping every element in a component just to add one behavior leads to extra DOM nodes, awkward styling, and components that exist only to forward inputs. **Directives** solve this: they add behavior to an existing element (the *host element*) without changing what it is. Angular's own `ngModel`, `routerLink`, and `formControlName` are all directives.

## Concept Explanation

### Three kinds of directives

Every component is a directive *with a template*. Besides components, Angular has two kinds of directives you write yourself:

| Kind | What it does | Example usage |
|---|---|---|
| **Component** | Renders its own template inside its host element | `<app-user-card [user]="u" />` |
| **Attribute directive** | Changes the look or behavior of its host element | `<p appHighlight="lightblue">` |
| **Structural directive** | Adds or removes parts of the DOM by creating views from a template | `<button *appIfRole="'admin'">` |

A directive is a class with the `@Directive` decorator. Its `selector` is usually an **attribute selector** (`[appHighlight]`), so the directive applies to any element that has that attribute. Like components, directives are standalone by default: a component that uses one lists it in its `imports` array.

### Changing the host element: `host` bindings and listeners

The cleanest way for a directive to change its host element is the `host` property of the decorator. It works like a template for the host element itself:

```typescript
@Directive({
  selector: '[appHighlight]',
  host: {
    '[style.backgroundColor]': 'active() ? color() : null', // property/style/class binding
    '(mouseenter)': 'active.set(true)',                       // event listener on the host
    '(mouseleave)': 'active.set(false)',
    '(document:keydown.escape)': 'active.set(false)',         // global targets: window, document, body
  },
})
```

Older code (and older books, such as *Pro Angular 16*) uses the `@HostBinding()` and `@HostListener()` decorators for the same job. They still work, but the Angular style guide now recommends the `host` property.

When you really need the DOM element itself, for example to call `contains()` or `focus()`, inject it with `inject(ElementRef)`. Prefer host bindings whenever they can express what you want, because they work with server-side rendering and keep the directive declarative.

### Structural directives: creating views from a template

The leading `*` is shorthand. Angular rewrites

```html
<button *appIfRole="'admin'">Delete user</button>
```

into

```html
<ng-template [appIfRole]="'admin'">
  <button>Delete user</button>
</ng-template>
```

A structural directive therefore sits on an `<ng-template>`. It injects two things:

- **`TemplateRef`** — the template it sits on (the `<button>` and its contents), which isn't rendered by itself.
- **`ViewContainerRef`** — the place in the DOM where views created from that template appear.

The directive decides when to call `viewContainer.createEmbeddedView(template)` (render it) and `viewContainer.clear()` (remove it). With signal inputs, an `effect()` is a natural place to make that decision, because it re-runs whenever the inputs or other signals it reads change.

Since Angular 17, built-in control flow (`@if`, `@for`, `@switch`) covers the common cases that used to need `*ngIf` and `*ngFor`, so you'll write structural directives mainly for app-specific rules, such as permissions or feature flags.

### `exportAs`: using a directive from the template

`exportAs: 'name'` lets a template grab the directive instance with a template reference variable, the same way `#f="ngForm"` gives you the `NgForm` directive in a template-driven form:

```html
<div appCollapsible #panel="collapsible">…</div>
<button (click)="panel.toggle()">Toggle</button>
```

### Composing behavior: `hostDirectives`

A component (or another directive) can apply directives to its own host element with `hostDirectives`. Users of the component get the behavior without adding attributes themselves:

```typescript
@Component({
  selector: 'app-popover',
  hostDirectives: [
    { directive: ClickOutside, outputs: ['appClickOutside: dismissed'] },
  ],
  template: `<ng-content />`,
})
export class Popover {}
```

The host directive's inputs and outputs are **private by default**. List the ones you want to expose, optionally renaming them with `'original: alias'`. Host directives must be standalone, and the component can `inject()` its host directive instances if it needs to talk to them.

## Key Terminology

| Term | Meaning |
|---|---|
| **Directive** | A class with `@Directive` that adds behavior to an existing element. Components are directives with templates. |
| **Host element** | The element a directive or component is attached to. |
| **Attribute directive** | A directive that changes the appearance or behavior of its host element. |
| **Structural directive** | A directive (used with `*`) that adds and removes views from a template. |
| **`host` metadata** | The decorator property that declares bindings and event listeners on the host element. |
| **`TemplateRef`** | A reference to an `<ng-template>`'s contents, which a structural directive can render. |
| **`ViewContainerRef`** | The location where a structural directive inserts (and removes) views. |
| **`exportAs`** | A name that lets templates reference the directive instance with `#ref="name"`. |
| **`hostDirectives`** | A list of directives a component or directive applies to its own host element. |

## Syntax Overview

```typescript
import { Directive, EmbeddedViewRef, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

// Attribute directive
@Directive({
  selector: '[appHighlight]',
  host: { '[style.backgroundColor]': 'color()' },
})
export class Highlight {
  readonly color = input('yellow', { alias: 'appHighlight' });
}

// Structural directive
@Directive({ selector: '[appShowIf]' })
export class ShowIf {
  private readonly template = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private view: EmbeddedViewRef<unknown> | null = null;
  readonly appShowIf = input.required<boolean>();

  constructor() {
    effect(() => {
      if (this.appShowIf() && !this.view) {
        this.view = this.viewContainer.createEmbeddedView(this.template); // show once
      } else if (!this.appShowIf() && this.view) {
        this.viewContainer.clear(); // remove once
        this.view = null;
      }
    });
  }
}
```

```html
<!-- Using them (both listed in the component's imports) -->
<p appHighlight="lightblue">Highlighted paragraph</p>
<p *appShowIf="isVisible()">Shown only when isVisible() is true</p>
```

## Real World Analogy

Think of a building's rooms as elements and directives as **fittings you can install in any room**.

- An **attribute directive** is a dimmer switch: install it in the kitchen or the office and that room's lights become dimmable. The room is still a kitchen; it just gained a behavior.
- A **structural directive** is a folding partition wall. It decides whether a section of the room exists right now, unfolding it (creating the view) or folding it away (clearing the view).
- **`hostDirectives`** are a "smart room" package: the builder installs the dimmer, the motion sensor, and the thermostat as part of the room, so whoever moves in gets them without installing anything.

## Examples

### 1. Basic Example — A highlight attribute directive

A directive that highlights its host element while the pointer is over it. The color comes from the attribute value.

```typescript
// highlight.ts
import { Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  host: {
    '[style.backgroundColor]': 'active() ? color() : null',
    '(mouseenter)': 'active.set(true)',
    '(mouseleave)': 'active.set(false)',
  },
})
export class Highlight {
  // <p appHighlight="lightblue"> passes "lightblue"; <p appHighlight> falls back to yellow.
  readonly color = input('yellow', {
    alias: 'appHighlight',
    transform: (value: string) => value || 'yellow',
  });

  protected readonly active = signal(false);
}
```

```typescript
// product-list.ts
import { Component, signal } from '@angular/core';
import { Highlight } from './highlight';

@Component({
  selector: 'app-product-list',
  imports: [Highlight],
  template: `
    <ul>
      @for (product of products(); track product.id) {
        <li appHighlight="lightyellow">{{ product.name }}</li>
      }
    </ul>
  `,
})
export class ProductList {
  protected readonly products = signal([
    { id: 1, name: 'Kettlebell' },
    { id: 2, name: 'Jump rope' },
  ]);
}
```

**What's happening:**
- The selector `[appHighlight]` matches any element with that attribute, and the attribute's value becomes the `color` input thanks to `alias: 'appHighlight'`.
- The `host` bindings work like a template for the `<li>` itself: Angular sets `style.backgroundColor` and listens for `mouseenter`/`mouseleave`.
- `active` is a signal, so the binding updates in zoneless apps and under `OnPush` without extra work.

### 2. Real-World Example — A permission structural directive

Show parts of the page only to users with a given role. The directive re-evaluates whenever the user's roles change.

```typescript
// auth.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly roles = signal<string[]>([]);

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  setRoles(roles: string[]): void {
    this.roles.set(roles);
  }
}
```

```typescript
// if-role.ts
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({ selector: '[appIfRole]' })
export class IfRole {
  private readonly template = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly appIfRole = input.required<string>();

  private hasView = false;

  constructor() {
    // Re-runs when the required role (input) or the user's roles (signal in AuthService) change.
    effect(() => {
      const allowed = this.auth.hasRole(this.appIfRole());

      if (allowed && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.template);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
```

```html
<!-- admin-toolbar.html (IfRole listed in the component's imports) -->
<button type="button">View report</button>
<button type="button" *appIfRole="'admin'">Delete report</button>
```

**What's happening:**
- `*appIfRole="'admin'"` becomes an `<ng-template>` with the directive on it. The `<button>` is the template, and nothing renders until the directive creates a view.
- The `hasView` flag makes sure the view is created once and cleared once, instead of being rebuilt on every run. Rebuilding would destroy the button's state (focus, child components).
- Because `hasRole()` reads a signal, logging in as an admin later shows the button without any extra code.
- Like a route guard, this is a **UX** feature. The server must still refuse the delete request for users without the role.

### 3. Best-Practice Example — Reusable behavior with `exportAs` and `hostDirectives`

A `ClickOutside` directive reports clicks outside its host element. A `Popover` component composes it as a host directive, so every popover closes when the user clicks elsewhere, and its users simply listen for `(dismissed)`.

```typescript
// click-outside.ts
import { Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  exportAs: 'clickOutside',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class ClickOutside {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /** Emits when the user clicks anywhere outside the host element. */
  readonly appClickOutside = output<MouseEvent>();

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.appClickOutside.emit(event);
    }
  }
}
```

```typescript
// popover.ts
import { Component } from '@angular/core';
import { ClickOutside } from './click-outside';

@Component({
  selector: 'app-popover',
  hostDirectives: [
    // Apply ClickOutside to <app-popover> itself and expose its output as (dismissed).
    { directive: ClickOutside, outputs: ['appClickOutside: dismissed'] },
  ],
  host: { role: 'dialog', class: 'popover' },
  template: `<ng-content />`,
})
export class Popover {}
```

```typescript
// account-menu.ts
import { Component, signal } from '@angular/core';
import { Popover } from './popover';

@Component({
  selector: 'app-account-menu',
  imports: [Popover],
  template: `
    <button type="button" (click)="open.set(!open()); $event.stopPropagation()">Account</button>

    @if (open()) {
      <app-popover (dismissed)="open.set(false)">
        <a href="/profile">Profile</a>
        <a href="/logout">Sign out</a>
      </app-popover>
    }
  `,
})
export class AccountMenu {
  protected readonly open = signal(false);
}
```

**Why this is best practice:**
- `ClickOutside` does one job and knows nothing about popovers, so it can be reused on menus, date pickers, and search suggestions.
- `hostDirectives` gives every `<app-popover>` the behavior automatically. Users can't forget to add it, and only the output listed in `outputs` is part of the popover's public API, under the clearer name `dismissed`.
- `exportAs: 'clickOutside'` also lets a template use the directive directly when needed, as in `<div appClickOutside #outside="clickOutside">`.
- The toggle button calls `$event.stopPropagation()` so the same click that opens the popover doesn't immediately count as an "outside" click.

## Common Mistakes

1. **Forgetting to import the directive.** A directive is standalone, so the component that uses it must list it in `imports`. Without it, Angular treats `appHighlight` as an ordinary attribute and nothing happens, with no error.
2. **Writing the selector without brackets.** `selector: 'appHighlight'` matches an *element* named `<appHighlight>`, not an attribute. Use `selector: '[appHighlight]'`.
3. **Manipulating the DOM directly when a binding would do.** `this.el.nativeElement.style.color = 'red'` bypasses Angular, breaks with server-side rendering, and is easy to leave in an inconsistent state. Use `host` bindings instead.
4. **Recreating views on every change in a structural directive.** Calling `clear()` and `createEmbeddedView()` on every run destroys and rebuilds the content (losing focus and component state). Track whether the view exists, as `IfRole` does.
5. **Expecting a host directive's inputs and outputs to be public.** They're private unless you list them in `inputs`/`outputs`. If `(dismissed)` never fires, check the mapping.
6. **Using a structural directive where built-in control flow is enough.** For plain conditions and loops, `@if` and `@for` are simpler and need no directive.
7. **Skipping the prefix.** Unprefixed names like `[highlight]` or `[tooltip]` can collide with other libraries. Use your app's prefix (`app`).

## Best Practices

- Use an attribute selector with your app prefix (`[appSomething]`), and give the main input the same name (or an alias) so `<el appSomething="value">` reads naturally.
- Prefer the `host` property over `@HostBinding`/`@HostListener` in new code, and host bindings over direct DOM access.
- Store directive state in signals, so host bindings update correctly under `OnPush` and in zoneless apps.
- Keep each directive focused on one behavior, and combine behaviors with `hostDirectives` instead of building one large directive.
- In structural directives, create the view once and clear it once; don't rebuild it on every change.
- Add `exportAs` when templates need to call the directive's methods or read its state.
- Remember that permission directives only hide UI. Always enforce permissions on the server too.

## Summary

- A directive adds behavior to an existing element (its host). Components are directives with templates.
- Attribute directives change their host element; structural directives (`*appX`) create and remove views from an `<ng-template>`.
- The `host` metadata declares bindings and listeners on the host element; `@HostBinding`/`@HostListener` are the older equivalent.
- Structural directives inject `TemplateRef` and `ViewContainerRef` and call `createEmbeddedView()` and `clear()`, often from an `effect()` that reads signal inputs.
- `exportAs` exposes a directive to templates through `#ref="name"`.
- `hostDirectives` composes directives into a component's host element; their inputs and outputs are private unless you list them.

## Flash Cards

**Q: What's the difference between an attribute directive and a structural directive?**
A: An attribute directive changes the look or behavior of its host element. A structural directive (used with `*`) adds or removes parts of the DOM by creating views from a template.

**Q: How does a directive add a class or listen for an event on its host element in modern Angular?**
A: Through the `host` property of `@Directive`, e.g. `host: { '[class.active]': 'active()', '(click)': 'toggle()' }`.

**Q: What do `TemplateRef` and `ViewContainerRef` give a structural directive?**
A: `TemplateRef` is the template the directive sits on; `ViewContainerRef` is where views created from it are inserted. The directive calls `createEmbeddedView(template)` to show it and `clear()` to remove it.

**Q: What does `exportAs` do?**
A: It names the directive instance so a template can reference it with a template reference variable, e.g. `#panel="collapsible"`, and then call `panel.toggle()`.

**Q: Are a host directive's inputs and outputs available on the component that uses it?**
A: Only if you list them in the `hostDirectives` entry's `inputs`/`outputs` arrays (optionally with an alias). Otherwise they're private.

## Exercises

**Easy:** Build an `appAutofocus` attribute directive that focuses its host element after the view renders (use `inject(ElementRef)` and `afterNextRender()`). Use it on the first input of a login form.

**Medium:** Build an `appCopyToClipboard` attribute directive with a required input holding the text to copy. On host `click`, copy the text with `navigator.clipboard.writeText()`, then emit a `copied` output. Add `exportAs: 'copy'` and expose a `justCopied` signal, so the template can show "Copied!" for two seconds with `#copy="copy"`.

**Challenging:** Build a `*appFeature="'newCheckout'"` structural directive that shows its template only when a `FeatureFlagService` signal enables that flag. Support an else template, `*appFeature="'newCheckout'; else oldCheckout"` (hint: add an `appFeatureElse = input<TemplateRef<unknown>>()`), and make sure each view is created and cleared only when the flag actually changes. Then compose an `appHighlight` host directive into a `Card` component, exposing its input as `highlightColor`.

## Further Reading

- [Angular — Directives overview](https://angular.dev/guide/directives)
- [Angular — Attribute directives](https://angular.dev/guide/directives/attribute-directives)
- [Angular — Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Angular — Directive composition API (`hostDirectives`)](https://angular.dev/guide/directives/directive-composition-api)
- [Angular — Host elements and the `host` property](https://angular.dev/guide/components/host-elements)
- [Angular — Built-in control flow](https://angular.dev/guide/templates/control-flow)

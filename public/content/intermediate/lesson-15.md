---
id: lesson-15
slug: content-projection
title: "Content Projection in Angular"
level: intermediate
order: 11
duration: 45
tags:
  - content-projection
  - ng-content
  - components
  - composition
  - slots
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what content projection is and why Angular provides it.
- Use `<ng-content>` to project a single block of content into a component.
- Build components with **multiple projection slots** using the `select` attribute.
- Provide **fallback content** for slots and **alias elements** for projection with `ngProjectAs`.
- Query projected content from within a component using the modern `contentChild()` / `contentChildren()` signal APIs.

---

## Why This Concept Exists

Most of the time, components communicate through `@Input()` / `input()` — the parent passes **data**, and the child renders it however it likes. That works well when the child fully controls its own markup.

But sometimes the *parent* needs to control the markup, and the child only provides the **structure, styling, and behavior** around it. Think of a card, a modal dialog, a tooltip, an accordion, or a tab group: the container knows how to look and behave, but it has no idea what the caller wants to put inside it — plain text, an image, a form, or an entire other component.

You *could* try to solve this with inputs of type `string` (and `[innerHTML]`), but that breaks down immediately:

- You lose type checking, event bindings, and Angular directives.
- You risk XSS issues when injecting raw HTML strings.
- You can't project other Angular components this way.

**Content projection** solves this by letting a parent component pass a chunk of *live template* — with full data binding, directives, and even child components — into a placeholder defined by the child component. The child stays generic and reusable; the parent stays in control of the actual content.

This is the same underlying idea as the native HTML `<slot>` element used by Web Components — Angular's version is called `<ng-content>`.

---

## Concept Explanation

### View vs. Content

Angular draws a distinction between two things a component can render:

- **View** — the elements defined directly inside the component's own `template`.
- **Content** — the elements a *parent* places between the component's opening and closing tags, which get projected into the component.

```html
<!-- Parent template -->
<app-card>
  <p>This is content, supplied by the parent.</p>
</app-card>
```

Inside `CardComponent`'s own template, that `<p>` is **content**, not part of the card's **view**.

### How `<ng-content>` works

`<ng-content>` is a **placeholder**, not a real DOM element and not a component. Angular's compiler resolves every `<ng-content>` at **build time** — it decides which projected elements belong in which placeholder before the app ever runs. Because of this:

- You cannot add it, remove it, or swap it at runtime.
- You cannot put directives, `[class]`/`[style]` bindings, or arbitrary attributes on `<ng-content>` itself.
- You should **not** wrap `<ng-content>` in `@if`, `@for`, or `@switch` inside the *child's own template*. Angular still creates the projected DOM nodes regardless of the condition, so this doesn't give you the lazy/conditional behavior you might expect. If you need genuinely conditional rendering of a component's own template, use `@if`/`@for` around ordinary elements — for hiding/showing *projected* content, prefer a CSS-based toggle like `[hidden]`, or don't project it into that slot in the first place (see the fallback content example below).

### Binding context: content still belongs to the parent

This is the detail that trips up most learners: content that a parent projects into a child is **compiled against the parent's component class**, not the child's. Interpolations (`{{ ... }}`), event bindings, and property bindings inside projected content all resolve against the *parent's* fields and methods — even though the markup visually ends up rendered inside the child's DOM.

```html
<!-- Parent template -->
<app-card>
  <button (click)="onDelete()">Delete</button> <!-- onDelete() must exist on the PARENT -->
</app-card>
```

### Single-slot vs. multi-slot projection

- **Single-slot**: one `<ng-content />` with no `select` attribute. Everything the parent passes in gets projected there.
- **Multi-slot**: multiple `<ng-content>` elements, each with a `select` attribute (a CSS selector). Angular routes each top-level projected element to the first placeholder whose selector matches it.

If you mix a `select`-based placeholder with one plain `<ng-content>` (no `select`), the plain one acts as a catch-all for anything that didn't match another selector. **If there's no catch-all placeholder, unmatched elements are silently dropped from the DOM** — they are not rendered anywhere.

### Fallback content

Since Angular v18, `<ng-content>` supports **fallback content**: markup you place *inside* the `<ng-content>` tags that renders only when nothing was projected into that slot.

### Aliasing content with `ngProjectAs`

Sometimes the element a parent wants to project doesn't naturally match the `select` selector — for example, the selector expects a custom element tag, but the parent wants to project a plain `<h3>`, or the content is wrapped in an `<ng-container>` (commonly needed alongside `@if`/`*ngFor`). `ngProjectAs` lets you tell Angular "treat this element as if it matched selector X for projection purposes," without changing the actual element.

### Querying projected content

Sometimes a parent component needs to *do something* with the content it received — count the items, activate one of them, read a value off a projected child component. For that, Angular provides **content queries**:

- **Modern (recommended):** the `contentChild()` and `contentChildren()` signal-based functions (stable since Angular v19). They return a `Signal`, integrate naturally with `computed()`/`effect()`, and don't require lifecycle hooks to read a value.
- **Legacy but still supported:** the `@ContentChild()` and `@ContentChildren()` decorators, which populate a property once Angular has processed content, available in the `ngAfterContentInit()` lifecycle hook.

Content queries only see elements/components that were **projected in** (light DOM); they cannot see elements defined in the component's own view template — that's what `@ViewChild()` / `viewChild()` are for.

---

## Key Terminology

| Term | Meaning |
|---|---|
| **Content projection** | Passing markup/templates from a parent into a placeholder defined by a child component. |
| **`<ng-content>`** | The placeholder element that marks where projected content should render. |
| **Projection slot** | A single `<ng-content>` placeholder (with or without a `select` selector). |
| **`select` attribute** | A CSS selector on `<ng-content>` that determines which projected elements land in that slot. |
| **Fallback content** | Default markup shown by a slot when no matching content was projected (Angular v18+). |
| **`ngProjectAs`** | An attribute that aliases an element's selector identity for projection matching. |
| **Content** | Elements a parent passes into a component, as opposed to the component's own view. |
| **`contentChild()` / `contentChildren()`** | Signal-based functions for querying projected elements/components. |
| **`@ContentChild` / `@ContentChildren`** | Decorator-based (legacy) equivalents, resolved by `ngAfterContentInit()`. |

---

## Syntax Overview

**1. Single slot — project everything:**

```typescript
@Component({
  selector: 'custom-card',
  template: `<div class="card-shadow"><ng-content /></div>`,
})
export class CustomCard {}
```

**2. Multiple slots with `select`:**

```typescript
@Component({
  selector: 'custom-card',
  template: `
    <div class="card-shadow">
      <ng-content select="card-title"></ng-content>
      <div class="card-divider"></div>
      <!-- catch-all: anything that isn't <card-title> lands here -->
      <ng-content></ng-content>
    </div>
  `,
})
export class CustomCard {}
```

`select` accepts the same kinds of selectors as component selectors: an element name (`card-title`), an attribute (`[card-footer]`), a class (`.highlight`), or combinations of those.

**3. Fallback content:**

```html
<ng-content select="card-title">Default Title</ng-content>
```

**4. Aliasing with `ngProjectAs`:**

```html
<!-- Child template -->
<ng-content select="card-title"></ng-content>

<!-- Parent template: <h3> doesn't match "card-title", so alias it -->
<custom-card>
  <h3 ngProjectAs="card-title">Hello</h3>
</custom-card>
```

`ngProjectAs` only accepts a static string — it cannot be bound to an expression.

**5. Querying projected content (modern signal API):**

```typescript
import { Component, contentChildren } from '@angular/core';

@Component({ /* ... */ })
export class TabsComponent {
  tabs = contentChildren(TabComponent); // Signal<readonly TabComponent[]>
}
```

---

## Real World Analogy

Think of a component with `<ng-content>` like a **picture frame**.

- The frame (the component) provides the border, the matting, the glass, and the hook to hang it — consistent, reusable styling and structure.
- **You** decide what photo goes inside — the frame doesn't know or care whether it's a family photo or a diploma. That's content projection.
- Some frames have **multiple openings** for several photos arranged in a fixed layout — that's multi-slot projection with `select`.
- A display-model frame at the store often ships with a **sample photo already inside** so it doesn't look empty on the shelf — that's fallback content: it shows only until you supply your own photo.

---

## Examples

### 1. Basic Example — A Reusable Card with Fallback Content

A `CardComponent` that projects arbitrary content and shows a placeholder message when nothing is provided.

```typescript
// card.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content>
        <p class="empty-state">Nothing to show yet.</p>
      </ng-content>
    </div>
  `,
  styles: `
    .card {
      border: 1px solid #e2e2e2;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .empty-state {
      color: #888;
      font-style: italic;
      margin: 0;
    }
  `,
})
export class CardComponent {}
```

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { CardComponent } from './card.component';

@Component({
  selector: 'app-root',
  imports: [CardComponent],
  template: `
    <app-card>
      <h3>Welcome back, Maya!</h3>
      <p>You have 3 new messages.</p>
    </app-card>

    <!-- No content passed in: the fallback message renders instead -->
    <app-card></app-card>
  `,
})
export class AppComponent {}
```

**Why this works:** `CardComponent` never needs to know what a "welcome message" or a "message count" looks like. It just reserves a spot. The parent supplies real markup — headings, paragraphs, even other components — and Angular renders it inside the card's `<div>`. The second, empty `<app-card>` demonstrates fallback content: since nothing was projected, the "Nothing to show yet." message defined inside `<ng-content>` renders automatically.

---

### 2. Real-World Example — A Modal Dialog with Multiple Slots

A reusable `ModalComponent` with dedicated slots for a title, a body, and a footer, plus a fallback "Close" button and a demonstration of `ngProjectAs`.

```typescript
// modal.component.ts
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <header class="modal-header">
          <ng-content select="[modal-title]">Untitled dialog</ng-content>
          <button type="button" class="modal-close" (click)="closed.emit()" aria-label="Close">
            &times;
          </button>
        </header>

        <section class="modal-body">
          <ng-content></ng-content>
        </section>

        <footer class="modal-footer">
          <ng-content select="[modal-footer]">
            <button type="button" (click)="closed.emit()">Close</button>
          </ng-content>
        </footer>
      </div>
    </div>
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: grid;
      place-items: center;
    }
    .modal {
      background: #fff;
      border-radius: 8px;
      min-width: 320px;
      max-width: 480px;
      padding: 1.25rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-close {
      border: none;
      background: none;
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `,
})
export class ModalComponent {
  closed = output<void>();
}
```

```typescript
// delete-confirmation.component.ts
import { Component, input, output } from '@angular/core';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-delete-confirmation',
  imports: [ModalComponent],
  template: `
    <app-modal (closed)="cancel.emit()">
      <!-- ngProjectAs aliases this <ng-container> so it matches
           select="[modal-title]" even though <ng-container> itself
           renders no element and carries no such attribute in the DOM. -->
      <ng-container ngProjectAs="[modal-title]">
        <h2>Delete "{{ itemName() }}"?</h2>
      </ng-container>

      <!-- Falls into the catch-all <ng-content> (modal body) -->
      <p>This action cannot be undone.</p>

      <!-- Always project the footer; decide what goes inside it here. -->
      <div modal-footer>
        @if (canDelete()) {
          <button type="button" (click)="cancel.emit()">Cancel</button>
          <button type="button" class="danger" (click)="confirmDelete.emit()">Delete</button>
        } @else {
          <button type="button" (click)="cancel.emit()">Close</button>
        }
      </div>
    </app-modal>
  `,
})
export class DeleteConfirmationComponent {
  itemName = input.required<string>();
  canDelete = input(true);
  cancel = output<void>();
  confirmDelete = output<void>();
}
```

**Why this works:** `ModalComponent` knows nothing about "deleting items" — it only knows about a title slot, a body slot, and a footer slot. `DeleteConfirmationComponent` reuses it fully. The `select="[modal-title]"` and `select="[modal-footer]"` attribute selectors keep the projected markup semantic. `ngProjectAs` lets a renderless `<ng-container>` be routed to the `[modal-title]` slot without adding an extra DOM element.

Notice that the footer is *always* projected, and the `@if` lives inside it. Fallback content is decided once, when the slot is created: it appears only if *nothing at all* is projected into that slot. An `@if` block counts as projected content even while its condition is false, so wrapping the footer content itself in `@if` would leave the footer empty instead of showing the modal's fallback "Close" button. Use fallback content for "the caller didn't pass anything" (as in a plain `<app-modal>` with no footer), and put conditions inside the projected element.

---

### 3. Best-Practice Example — A Tabs Component Using Content Queries

A `TabsComponent` container that projects `TabComponent` children and uses the modern `contentChildren()` signal query to build a tab header and control which panel is active — a common real-world pattern for building UI libraries.

```typescript
// tab.component.ts
import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-tab',
  template: `
    <!-- Always present in the DOM; visibility is toggled with [hidden]
         rather than wrapping <ng-content> in @if. -->
    <div class="tab-panel" role="tabpanel" [hidden]="!active()">
      <ng-content />
    </div>
  `,
})
export class TabComponent {
  // Set by whoever uses <app-tab title="...">
  title = input.required<string>();

  // Controlled internally by the parent TabsComponent, not by the caller
  active = signal(false);
}
```

```typescript
// tabs.component.ts
import { AfterContentInit, Component, contentChildren } from '@angular/core';
import { TabComponent } from './tab.component';

@Component({
  selector: 'app-tabs',
  imports: [TabComponent],
  template: `
    <div class="tab-header" role="tablist">
      @for (tab of tabs(); track tab.title()) {
        <button
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="tab.active()"
          [attr.aria-selected]="tab.active()"
          (click)="select(tab)"
        >
          {{ tab.title() }}
        </button>
      }
    </div>

    <div class="tab-body">
      <!-- Only <app-tab> elements are projected here; each TabComponent
           decides its own visibility based on its `active` signal. -->
      <ng-content select="app-tab" />
    </div>
  `,
  styles: `
    .tab-header { display: flex; gap: 0.25rem; border-bottom: 1px solid #ddd; }
    .tab-btn { border: none; background: none; padding: 0.5rem 1rem; cursor: pointer; }
    .tab-btn.active { border-bottom: 2px solid #3f51b5; font-weight: 600; }
  `,
})
export class TabsComponent implements AfterContentInit {
  // Finds every projected <app-tab> instance as a reactive signal
  tabs = contentChildren(TabComponent);

  ngAfterContentInit(): void {
    // Activate the first tab once content has been resolved
    this.tabs()[0]?.active.set(true);
  }

  select(selected: TabComponent): void {
    for (const tab of this.tabs()) {
      tab.active.set(tab === selected);
    }
  }
}
```

```typescript
// settings-page.component.ts
import { Component } from '@angular/core';
import { TabsComponent } from './tabs.component';
import { TabComponent } from './tab.component';

@Component({
  selector: 'app-settings-page',
  imports: [TabsComponent, TabComponent],
  template: `
    <app-tabs>
      <app-tab title="Profile">
        <p>Update your name, email, and avatar.</p>
      </app-tab>
      <app-tab title="Security">
        <p>Change your password and enable two-factor authentication.</p>
      </app-tab>
      <app-tab title="Notifications">
        <p>Manage email and push notification preferences.</p>
      </app-tab>
    </app-tabs>
  `,
})
export class SettingsPageComponent {}
```

**Why this is best practice:**

- **Separation of concerns:** `TabComponent` only knows how to show/hide its own content; `TabsComponent` only knows how to coordinate which tab is active. Neither needs to know what's actually *inside* a tab.
- **`select="app-tab"` scopes projection**, so only `<app-tab>` elements are projected into the body — stray text nodes or whitespace won't interfere.
- **`contentChildren()` (signal-based, stable since v19)** is preferred over `@ContentChildren` + `QueryList` here because the result is a plain reactive `Signal`, so `tabs()` can be read directly inside the template's `@for` without subscribing to anything or relying on `ngAfterContentChecked`.
- **Visibility uses `[hidden]`, not `@if` around `<ng-content>`**, matching Angular's guidance that conditionally wrapping `<ng-content>` doesn't produce true lazy rendering and can behave unexpectedly.
- The internal `active` signal is deliberately **not** an `input()` — it's set imperatively by the parent through the query result, which is the standard way a container component drives state on its projected children.

---

## Common Mistakes

1. **Using `@Input()` when the parent needs to supply markup, not data.**
   If you find yourself passing a `string` and binding it with `[innerHTML]` just to render a heading or a button, that's a strong signal you should be using content projection instead.

2. **Assuming projected content's bindings run against the child component.**
   Interpolations and event handlers inside projected content still reference the *parent's* class members, even though the markup renders inside the child. Forgetting this leads to confusing "property does not exist" errors.

3. **Wrapping `<ng-content>` in `@if` / `*ngIf` inside the child's template.**
   This doesn't lazily create the projected content — Angular still instantiates the DOM nodes for what would be projected there. Use `[hidden]`, a CSS class, or simply don't project into a slot at all (letting fallback content take over) instead. Older material, such as *Pro Angular 16*, shows `<ng-content *ngIf="show">`. That hides the content, but the projected components are still created and keep running.

4. **Forgetting the catch-all `<ng-content>` when using `select`.**
   If every `<ng-content>` in a component has a `select` attribute and none is left "plain," any projected element that doesn't match a selector is silently **not rendered** — no error, it just disappears.

5. **Wrapping content in `<ng-container>` (or a structural directive) without `ngProjectAs`.**
   Wrapping content changes what the "top-level" projected element is. A `<div class="header">` inside an unlabeled `<ng-container>` won't match a `select="header"` slot — the outer `<ng-container>` is what gets matched (or fails to match), not the inner element. Use `ngProjectAs` to alias the wrapper.

6. **Confusing content queries with view queries.**
   `contentChild()` / `@ContentChild` only find elements the *parent* projected in; they cannot see elements declared in the component's own `template`. Use `viewChild()` / `@ViewChild` for that.

7. **Trying to bind `ngProjectAs` dynamically.**
   `ngProjectAs="[someClass]"` only accepts a static string. If you need conditional slot routing, decide which slot to project into from the parent's template logic (e.g., with `@if`) instead of trying to compute the selector at runtime.

8. **Expecting fallback content to appear when an `@if` inside the slot is false.**
   Fallback content shows only when nothing at all was projected into the slot. A projected `@if` block counts as content even when its condition is false. Put the condition *inside* an always-projected element, with an `@else` for the default.

9. **Expecting content queries to search nested elements.**
   `contentChildren(TabComponent)` only finds *direct* children of the projected content. Use `contentChildren(TabComponent, { descendants: true })` if tabs can be wrapped in other elements.

---

## Best Practices

- **Prefer content projection over string/HTML inputs** whenever the parent needs to supply real markup, event handlers, or other components.
- **Keep slot selectors semantic and stable** — attribute selectors like `[modal-title]` or element selectors for custom components (`<app-tab>`) read more clearly in a parent's template than generic class names.
- **Always provide a catch-all `<ng-content>`** (no `select`) if you want unmatched content to render somewhere rather than silently disappear — or intentionally omit it if you want strict validation of what callers pass in.
- **Use fallback content for sensible defaults** (Angular v18+) instead of manually checking whether content was provided with a content query.
- **Reach for `contentChild()` / `contentChildren()` (signal APIs)** in new code instead of the decorator-based `@ContentChild` / `@ContentChildren`, since they avoid lifecycle-hook boilerplate and compose naturally with `computed()` and `effect()`.
- **Don't wrap `<ng-content>` in structural control flow** inside the child; use CSS-based visibility toggles for show/hide behavior driven by internal state.
- **Document your component's slots** (in a comment or README) the same way you'd document its `@Input()`s — consumers can't easily discover `select` selectors just by looking at the rendered output.

---

## Summary

- Content projection lets a parent pass **live template markup** into a placeholder defined by a child component, using `<ng-content>`.
- It solves the problem `@Input()` can't: giving the parent control over structure and behavior, not just data.
- **Content** (what a parent projects) is distinct from a component's own **view** (its own template).
- Projected content's bindings resolve against the **parent** component, not the child.
- `select` enables **multiple projection slots**, matched using CSS-selector syntax; an unmatched, non-catch-all slot means content is dropped.
- **Fallback content** (Angular v18+) shows default markup when a slot receives nothing.
- **`ngProjectAs`** aliases an element's identity for slot matching — essential when wrapping content in `<ng-container>` or a structural directive.
- Never wrap `<ng-content>` itself in `@if`/`@for`/`@switch`; use `[hidden]` or omit the slot's content instead.
- Use the modern **`contentChild()` / `contentChildren()`** signal queries to read projected components/elements from within a container component.

---

## Flash Cards

**Q: What is the primary purpose of content projection in Angular?**
A: To let a parent component pass live template markup — not just data — into a placeholder defined by a child component, so the child controls structure/behavior while the parent controls content.

**Q: What element does Angular use as a content projection placeholder, and is it a real DOM element?**
A: `<ng-content>`. It is not a real DOM element or a component — it's a compile-time placeholder resolved when the template is compiled.

**Q: What happens to an element passed to a component if it doesn't match any `select` attribute and there's no catch-all `<ng-content>`?**
A: It is not rendered at all — Angular silently drops it from the DOM.

**Q: What is `ngProjectAs` used for?**
A: It aliases an element's selector identity for content-projection matching purposes, most commonly needed when content is wrapped in `<ng-container>` or a structural directive.

**Q: What's the modern, recommended way to query projected content from within a component's class, and since when has it been stable?**
A: The `contentChild()` / `contentChildren()` signal-based functions, stable since Angular v19 — preferred over the `@ContentChild` / `@ContentChildren` decorators.

---

## Exercises

### 🟢 Easy

Create a standalone `AlertComponent` with a single `<ng-content>` slot that wraps projected content in a styled `<div class="alert">`. Provide fallback content of `"No details provided."` for when nothing is projected. Use it once with a custom message and once with no content, and verify the fallback appears.

### 🟡 Medium

Build a `PanelComponent` with **two** projection slots: a header (`select="[panel-header]"`) and a body (the catch-all `<ng-content>`). Give the header slot fallback content of `"Untitled Panel"`. Then create a parent component that:
1. Renders one `<app-panel>` with a custom header and body.
2. Renders a second `<app-panel>` with only a body, relying on the fallback header.
3. Renders a third `<app-panel>` where the header content is wrapped in an `<ng-container>` (e.g., because it needs an `@if`), and use `ngProjectAs` so it still lands in the header slot.

### 🔴 Challenging

Build an `AccordionComponent` and an `AccordionItemComponent` (similar in spirit to the `Tabs`/`Tab` example in this lesson, but for a vertically stacked, expand/collapse UI):

- `AccordionItemComponent` accepts a `title` input, exposes an internal `expanded` signal, and projects its body content, showing/hiding it via `[hidden]` (not `@if` around `<ng-content>`).
- `AccordionComponent` uses `contentChildren()` to query all projected `AccordionItemComponent` instances, renders a clickable header for each (reading its `title`), and toggles the clicked item's `expanded` signal.
- Add a `multiple` boolean `input()` on `AccordionComponent`: when `false` (default), expanding one item collapses all others; when `true`, multiple items may be expanded at once.

---

## Further Reading

- [Content projection with ng-content — angular.dev](https://angular.dev/guide/components/content-projection)
- [Referencing component children with queries — angular.dev](https://angular.dev/guide/components/queries)
- [`contentChildren()` API reference — angular.dev](https://angular.dev/api/core/contentChildren)
- [`<ng-container>` — angular.dev](https://angular.dev/api/core/ng-container)
- [Anatomy of components — angular.dev](https://angular.dev/guide/components)
- [MDN: `<slot>` element](https://developer.mozilla.org/docs/Web/HTML/Element/slot) (the native Web Components concept `<ng-content>` is inspired by)

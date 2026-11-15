---
slug: ng-project-as
title: "ngProjectAs"
topic: components
kind: api
summary: "Make a wrapper or mismatched element match a slot's select selector."
tags: [components, projection, ng-container, select]
related: [multi-slot-projection, content-projection, projection-fallback-content]
---
> **In one line:** `ngProjectAs="selector"` tells Angular to treat an element as if it matched that selector, for projection only, without changing the element itself.

## The idea

Projection matches the **top-level** elements a parent places inside a component. Usually that is exactly what you want, but two situations leave a slot empty even though the right markup is there:

- the slot selects a custom element, such as `card-title`, and you want to project a plain `<h3>`;
- you wrap the content in `<ng-container>`, often to hold an `@if` or `*ngFor`, and the wrapper, not the element inside, is what gets matched.

`ngProjectAs` fixes both. It sets the selector Angular should match, and it works on any element, including the renderless `<ng-container>`, which adds no extra DOM node.

```html
<!-- Child template -->
<ng-content select="[modal-title]" />
```

## See it

```html
<!-- Before: the <ng-container> is matched, it has no [modal-title], so the slot stays empty -->
<app-modal>
  <ng-container>
    <h2>Delete "{{ itemName() }}"?</h2>
  </ng-container>
</app-modal>

<!-- After: the container is treated as [modal-title] and lands in the title slot -->
<app-modal>
  <ng-container ngProjectAs="[modal-title]">
    <h2>Delete "{{ itemName() }}"?</h2>
  </ng-container>
</app-modal>
```

No wrapper element appears in the page, because `<ng-container>` renders nothing. It only carries the alias.

## Go deeper

The same trick lets you project an element that does not naturally match the slot's tag. If a child selects `card-title`, a parent that wants a real heading writes `<h3 ngProjectAs="card-title">Hello</h3>`, and the `<h3>` goes into the `card-title` slot.

`ngProjectAs` accepts only a **static string**. It cannot be bound to an expression, because projection is resolved at build time. If you need to choose between slots depending on state, decide in the parent's template, for example with an `@if` around two differently marked elements.

## Watch out

- Wrapping projected content in `<ng-container>` and forgetting the alias. The slot stays empty, and nothing reports an error.
- Trying to bind it: `[ngProjectAs]="slot()"` does nothing, because the value must be a literal.
- Using it to work around a slot you could simply give an attribute to. Putting `modal-title` directly on the `<h2>` is simpler when there is no wrapper.

## Remember

- `ngProjectAs` makes an element match a given `select` for projection.
- It is the fix for wrappers such as `<ng-container>` around projected content.
- Its value is a static string, not an expression.

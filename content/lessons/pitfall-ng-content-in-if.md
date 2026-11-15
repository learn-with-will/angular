---
slug: pitfall-ng-content-in-if
title: "Pitfall: ng-content inside @if"
topic: components
kind: pitfall
summary: "Wrapping <ng-content> in @if hides projected content but does not stop it from being created."
tags: [components, projection, lazy, ng-content]
related: [content-projection, projection-fallback-content, content-child]
---
> **In one line:** Projected content is created by the **parent**, whether or not the child shows it. An `@if` around `<ng-content>` hides it; it does not make it lazy.

## The idea

It looks reasonable: a collapsible panel that renders its body only when open, by wrapping `<ng-content />` in an `@if (open())` block.

Developers expect the body not to exist until `open()` is true. It does exist. Angular builds projected nodes when it builds the *parent's* template, before the child decides what to show. The condition only controls whether those already-built nodes are attached to the page.

The consequences are easy to miss: a projected component still runs its constructor and `ngOnInit`, still makes its HTTP request, and keeps running while hidden. Older material shows `<ng-content *ngIf="show">` and treats it as lazy rendering, which is the same misunderstanding.

## See it

```html
<!-- Before: looks lazy, but the projected content is already created -->
@if (open()) {
  <ng-content />
}

<!-- After: say what you mean, hide it with CSS -->
<div [hidden]="!open()">
  <ng-content />
</div>
```

The second version is honest about it: the content always exists, and `[hidden]` toggles visibility. It also keeps the content's state, such as text typed into a form, when the panel closes.

## Go deeper

When content truly must not be created until needed, change what the parent passes. Instead of live markup, the parent gives an `<ng-template>`, a recipe, and the child draws it only when it wants to:

```typescript
@Component({
  selector: 'app-panel',
  imports: [NgTemplateOutlet],
  template: `
    @if (open()) {
      <ng-container [ngTemplateOutlet]="body()" />
    }
  `,
})
export class Panel {
  readonly open = input(false);
  protected readonly body = contentChild.required(TemplateRef);
}
```

```html
<app-panel [open]="show()">
  <ng-template><app-expensive-chart /></ng-template>
</app-panel>
```

An `<ng-template>` is not created until something renders it, so the chart is built only when the panel is open.

## Watch out

- Treating `@if` around `<ng-content>` as lazy loading. The projected components are still created and keep running.
- Switching to `[hidden]` and then being surprised that hidden content still makes requests. It still exists; use a template for true laziness.
- Putting `@if` on the projected content in the parent to fix it. That interacts with fallback content in a different way, covered in its own lesson.

## Remember

- Projected content is created by the parent, whatever the child's `@if` says.
- Use `[hidden]` or a class to toggle visibility, and know the content is still alive.
- For genuinely lazy content, pass an `<ng-template>` and render it conditionally.

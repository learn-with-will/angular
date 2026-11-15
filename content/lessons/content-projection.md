---
slug: content-projection
title: "Content projection: ng-content"
topic: components
kind: api
summary: "Let a parent pass real markup into a reusable component's frame."
tags: [components, projection, ng-content, composition]
related: [multi-slot-projection, projected-content-scope, projection-fallback-content, input]
---
> **In one line:** `<ng-content />` marks a spot in a component's template where whatever the parent places between its tags is rendered.

## The idea

Inputs pass **data**, and the child decides how to render it. That works until the *parent* needs to control the markup and the child only provides the structure around it. A card, a dialog, a tooltip or an accordion knows how to look and behave, but has no idea whether the caller wants plain text, a form or another component.

You could pass a string and use `[innerHTML]`, but then you lose type checking, event bindings and directives, you risk injecting unsafe HTML, and you cannot project components. **Content projection** passes live template instead, with full bindings and child components. It is Angular's version of the HTML `<slot>`.

Angular separates two things a component can render:

| | What it is | Defined by |
|---|---|---|
| **View** | the elements in the component's own `template` | the child |
| **Content** | the elements placed between its tags in a parent | the parent |

Think of a picture frame. The frame gives you the border and the glass, you decide what photo goes inside.

## See it

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content />
    </div>
  `,
  styles: `.card { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }`,
})
export class Card {}
```

```html
<app-card>
  <h3>Welcome back, Maya!</h3>
  <p>You have 3 new messages.</p>
</app-card>
```

The card never needs to know what a welcome message is. It reserves a spot, and the parent supplies the markup, which can include other components.

## Go deeper

`<ng-content>` is a **placeholder**, not a real element. Angular resolves it at build time, deciding which projected nodes belong in which placeholder before the app runs. So you cannot add it, remove it or swap it at runtime, and you cannot put directives or `[class]` bindings on it.

Projection is the right choice whenever the caller supplies markup. Reach for an `input()` instead when the caller supplies *data* and the component owns the markup.

## Watch out

- Passing HTML strings through an input and using `[innerHTML]` when the parent should supply markup. Use projection.
- Forgetting to import a component that you project. The parent's template uses it, so the parent's `imports` must list it.
- Putting a directive or binding on `<ng-content>` itself. It is only a placeholder, so wrap it in a real element for styling.

## Remember

- `<ng-content />` reserves a spot for markup the parent provides.
- Use projection for markup, and `input()` for data.
- It is resolved at build time, so it cannot be conditional or dynamic itself.

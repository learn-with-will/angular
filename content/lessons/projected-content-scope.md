---
slug: projected-content-scope
title: "Projected content belongs to the parent"
topic: components
kind: concept
summary: "Bindings inside projected content run against the parent's class, not the component that displays it."
tags: [components, projection, binding, scope]
related: [content-projection, multi-slot-projection, content-child]
---
> **In one line:** Markup a parent projects into a child is compiled against the **parent's** class. Its `{{ }}` and `(click)` use the parent's fields and methods, even though it appears inside the child's DOM.

## The idea

This is the detail that trips up most learners. When a parent writes content between a component's tags, that content *looks* as if it lives inside the child, since it is drawn there. But where a template is **compiled** and where it is **rendered** are two different things.

The projected markup belongs to the template that wrote it. So every binding in it resolves against that template's component class, the parent, no matter which element on screen ends up holding it.

```flow
cls: Parent class | owns `onDelete()` @primary
markup: Projected button | `(click)="onDelete()"` @blue
dom: Card's DOM | where it is drawn @green
cls -> markup: compiled against
markup -> dom: rendered inside
```

The child's own template, in contrast, is compiled against the child's class. So the same binding syntax resolves differently depending on which template it is written in:

| Written in | Resolves against |
|---|---|
| a component's own `template` | that component's class |
| content projected into another component | the class of the template that wrote it |

## See it

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content />
      <button type="button" (click)="collapse()">Collapse</button>   <!-- Card's own method -->
    </div>
  `,
})
export class Card {
  collapse(): void { /* ... */ }
}
```

```html
<!-- Parent template: onDelete() must exist on the PARENT, not on Card -->
<app-card>
  <p>{{ item().name }}</p>
  <button type="button" (click)="onDelete()">Delete</button>
</app-card>
```

`item()` and `onDelete()` are looked up on the parent. The card's `collapse()` is invisible to that content.

## Go deeper

This is what makes projection so flexible. The child never needs to import the parent's types, know what `item` is, or be recompiled for a new use. It only reserves a spot, and the parent keeps full control of the logic.

It also explains a common surprise: the parent's data stays in the parent's change detection. If the child is `OnPush` but the projected content binds to the parent's signals, those parts update when the parent's signals change, because they belong to the parent's template.

When the child wants to *give* something to the projected content, such as the current item in a list it renders, projection alone is not enough. That calls for passing a template with context, which is a different technique.

## Watch out

- Writing `(click)="collapse()"` in projected content and expecting the card's method. The parent's class is searched, so it fails with a "property does not exist" error.
- Importing the child's types into the parent just to call into it from projected markup. If the parent needs the child, use a template reference or a query.
- Assuming projected styles come from the child. Styles follow the same rule: the parent's scoped styles apply to the parent's markup.

## Remember

- Projected markup is compiled against the parent's class, and rendered inside the child.
- The child's own template uses the child's class.
- To hand data from the child to projected content, use a template with context, not plain projection.

---
slug: multi-slot-projection
title: "Multi-slot projection: select"
topic: components
kind: technique
summary: "Route different parts of the projected content to different places with select."
tags: [components, projection, ng-content, slots]
related: [content-projection, projection-fallback-content, ng-project-as, projected-content-scope]
---
> **In one line:** Give each `<ng-content>` a `select` and Angular sends each top-level projected element to the first slot whose selector matches it.

## The idea

A modal has a title, a body and a footer. One `<ng-content>` would put everything in one place, so you add several, each with a `select` attribute holding a CSS selector. It accepts an element name (`card-title`), an attribute (`[modal-footer]`), a class (`.highlight`) or a combination.

Angular looks at each top-level element the parent projected and sends it to the first matching slot. A plain `<ng-content>` with no `select` acts as a **catch-all** for anything that matched nothing else.

That catch-all is the easy thing to forget. With only `select`ed slots and no plain one, an element that matches none of them is not an error: it simply never appears.

```tree
Where does a projected element go?
  It matches a select
    [slot] The first matching slot | `select="[modal-title]"` @green
  It matches none
    [rest] The catch-all | a plain `<ng-content>` @blue
  It matches none, no catch-all
    [!] Dropped | rendered nowhere @red
```

## See it

```typescript
@Component({
  selector: 'app-modal',
  template: `
    <header><ng-content select="[modal-title]" /></header>
    <section><ng-content /></section>
    <footer><ng-content select="[modal-footer]" /></footer>
  `,
})
export class Modal {}
```

```html
<app-modal>
  <h2 modal-title>Delete "Report.pdf"?</h2>
  <p>This action cannot be undone.</p>
  <div modal-footer>
    <button type="button">Cancel</button>
    <button type="button">Delete</button>
  </div>
</app-modal>
```

The heading and the footer go to their slots, and the paragraph, matching no selector, falls into the plain `<ng-content />` in the body.

## Go deeper

Keep selectors semantic and stable. An attribute such as `modal-title`, or the tag of a component such as `<app-tab>`, reads better in a parent's template than a generic class name does, and it documents itself.

Treat slots as part of the component's public API, like its inputs. Consumers cannot discover a `select` selector by looking at the rendered page, so note the slots in a comment or the docs.

Omitting the catch-all is also a choice: it makes the component strict about what callers may pass in, at the cost of silently ignoring a mistake. Most components include one.

## Watch out

- Using only `select`ed slots, then wondering why an element vanished. Add a plain `<ng-content />` to catch the rest.
- Wrapping projected content in `<ng-container>` or a structural directive. The wrapper is what gets matched, not the element inside it. See `ngProjectAs`.
- Selecting on something the projected element does not have. Check the attribute or tag really is on the top-level element.

## Remember

- `select` takes a CSS selector and routes each top-level element to the first matching slot.
- A plain `<ng-content />` is the catch-all; without one, unmatched elements are dropped silently.
- Document your slots like inputs: callers cannot see them.

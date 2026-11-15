---
slug: class-and-style-binding
title: "Class and style binding"
topic: templates
kind: technique
summary: "Switch CSS classes and inline styles from component state, singly or in groups."
tags: [templates, binding, css]
related: [property-binding, attribute-binding, event-binding]
---
> **In one line:** `[class.name]="flag"` toggles one class, `[class]="{…}"` toggles several, and `[style.prop]="value"` sets an inline style, all driven by state.

## The idea

Rather than adding and removing classes by hand in event handlers, you bind them to state and let the view follow. Change the signal and the right classes appear. Static classes you wrote in the markup stay untouched; bound ones are added and removed around them.

| Goal | Syntax |
|---|---|
| Toggle one class | `[class.active]="isActive()"` |
| Toggle several classes | `[class]="{ active: isActive(), disabled: isDisabled() }"` |
| Set one style | `[style.color]="color()"` |
| Set a style with a unit | `[style.width.px]="width()"` |

The object form is easier to read and less error-prone than building a class string by concatenation: each class sits next to the condition that controls it.

Styles follow the same pattern. The `.px` suffix after the property name supplies the unit, so the signal can hold a plain number.

## See it

```typescript
@Component({
  selector: 'app-task-item',
  template: `
    <div class="task" [class.completed]="done()" [style.opacity]="done() ? 0.5 : 1">
      <span>{{ title() }}</span>
      <button (click)="done.update(d => !d)">Toggle</button>
    </div>
  `,
  styles: `.completed span { text-decoration: line-through; }`,
})
export class TaskItem {
  protected readonly title = signal('Write the lesson');
  protected readonly done = signal(false);
}
```

The object form groups several states on one element:

```html
<button
  class="btn"
  [class]="{ active: isActive(), disabled: isBusy() }"
  [style.width.px]="width()"
>
  Save
</button>
```

## Go deeper

You can bind a whole `[class]` to a string or an array as well, but the object form wins on clarity. The class names are literal keys, so a search for `disabled` finds this line.

A bound style needs no CSS file at all, which makes it the right tool for values that come from data (a progress bar's width, a user-chosen colour). For anything that is a fixed look, define a class and toggle it.

Class names with hyphens work as they are: `[class.is-active]="active()"`. And because bound and static classes are merged rather than replaced, a component can safely add a state class to an element that already carries its base styling, with no risk of wiping the base classes out.

## Watch out

- Do not assemble class names with string concatenation. Use the object form so each class has its own condition.
- A bound class replaces nothing: your static `class="task"` stays, and `completed` is added only while `done()` is true.
- Prefer a class for fixed visual states, and an inline style only for values that come from data.

## Remember

- `[class.x]` toggles one class; `[class]="{…}"` toggles many.
- `[style.prop]` and `[style.prop.unit]` set inline styles.
- Bind classes and styles to signals so appearance follows state.

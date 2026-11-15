---
slug: content-child
title: "contentChild() and contentChildren()"
topic: components
kind: api
summary: "Let a container component find and control the components projected into it."
tags: [components, projection, queries, signals]
related: [view-child, content-projection, multi-slot-projection, ng-project-as]
since: "19"
---
> **In one line:** `contentChild()` and `contentChildren()` return signals for the components and elements a parent *projected into* your component, the way `viewChild()` does for your own template.

## The idea

A container such as a tab group receives its tabs from the parent through projection. To build a header with one button per tab, or to switch which tab is visible, the container needs to *find* those projected tabs. A **content query** does that.

It helps to keep the two kinds of query apart, because they search different places:

| | `viewChild()` | `contentChild()` |
|---|---|---|
| Searches | the component's own template | content projected in by a parent |
| Used by | the component that owns the template | the container that receives content |
| Returns | a signal, `undefined` until rendered | a signal, `undefined` until content is ready |

A content query cannot see elements in the component's own template, and a view query cannot see projected content. `contentChildren()` returns a signal holding a readonly array of every match.

## See it

```typescript
@Component({
  selector: 'app-tab',
  template: `<div [hidden]="!active()"><ng-content /></div>`,
})
export class Tab {
  readonly title = input.required<string>();
  readonly active = signal(false);
}
```

```typescript
@Component({
  selector: 'app-tabs',
  template: `
    @for (tab of tabs(); track tab.title()) {
      <button type="button" [class.active]="tab.active()" (click)="select(tab)">
        {{ tab.title() }}
      </button>
    }
    <ng-content select="app-tab" />
  `,
})
export class Tabs implements AfterContentInit {
  readonly tabs = contentChildren(Tab);

  ngAfterContentInit(): void {
    this.tabs()[0]?.active.set(true);
  }

  select(selected: Tab): void {
    for (const tab of this.tabs()) tab.active.set(tab === selected);
  }
}
```

The tabs never know about each other; the container reads them as a signal and drives the one piece of state each exposes.

## Go deeper

The result is a plain signal, so the template can loop over `tabs()` directly with no subscription, and a `computed()` can derive things like the count. That is why it replaces the older `@ContentChildren` decorator and its `QueryList`, which needed a lifecycle hook to read safely.

By default a content query finds only **direct** children of the projected content. If the tabs may sit inside other elements, ask for them all with `contentChildren(Tab, { descendants: true })`.

Notice that visibility uses `[hidden]` rather than wrapping `<ng-content>` in an `@if`, for the reasons in the lesson on that pitfall.

## Watch out

- Using `contentChild()` to find something in your own template. It will find nothing; that is `viewChild()`.
- Expecting it to find nested components. Add `{ descendants: true }`.
- Reading it in the constructor. Content is not resolved yet; read it in a template, a `computed()` or `ngAfterContentInit`.

## Remember

- Content queries search what a parent projected in, view queries search your own template.
- `contentChildren()` returns a signal of all matches, direct children only unless `descendants` is set.
- Container components use them to coordinate state across the pieces they receive.

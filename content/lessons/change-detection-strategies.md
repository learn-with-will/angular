---
slug: change-detection-strategies
title: "Eager and OnPush change detection"
topic: performance
kind: concept
summary: "Angular checks bindings after every async event. OnPush lets whole branches of the tree be skipped."
tags: [performance, change-detection, onpush, eager]
related: [onpush-triggers, pitfall-onpush-mutation, zoneless-and-signals, mark-for-check]
---
> **In one line:** Change detection walks the component tree and updates the DOM where bindings changed. `OnPush` tells Angular to skip a component unless it has a specific reason to check it.

## The idea

Each time something asynchronous happens (a click, an HTTP response, a timer), Angular must find out what changed on screen. With the old strategy, every component is checked on every pass, even ones that cannot possibly have changed. A keystroke in a search box can trigger thousands of needless binding checks elsewhere.

`OnPush` turns that around: "skip this component and everything under it unless I give you a reason." The work shrinks from the whole tree to the parts that actually changed.

| Strategy | Checks the component | Name in Angular 22+ |
|---|---|---|
| default, check always | on every pass | `ChangeDetectionStrategy.Eager` (`Default` still works, deprecated) |
| check on a reason | only when triggered | `ChangeDetectionStrategy.OnPush`, **the default for new components** |

On Angular 20 and 21 you opt in with `changeDetection: ChangeDetectionStrategy.OnPush` on each component. From Angular 22, components are `OnPush` unless they say `Eager`, and `ng update` adds `Eager` to existing components that set no strategy, so upgrading changes nothing about how they behave.

## See it

```typescript
@Component({
  selector: 'app-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,   // opt in (default from Angular 22)
  template: `<p>{{ title() }}</p>`,
})
export class Widget {
  readonly title = input.required<string>();
}
```

Nothing else changes in the component. The strategy only decides *when* Angular looks at it again.

## Go deeper

When a view is skipped, Angular does not even descend into its children, whatever strategy they use. That is why the saving compounds: skipping one branch near the top skips everything below it.

The mechanism *how* a component earns a check is the same in every version, and it is the subject of the next lesson. Learn those five triggers once and you can predict every OnPush behaviour.

Do not enable it as a magic speed switch. It pays when trees are large, lists are long or updates are frequent. For a small app the difference is invisible, which is exactly why the guidance is to measure first: Angular DevTools' profiler shows which components are checked and how long it takes, so you optimise what actually costs something.

OnPush also forces a good habit. It works properly only with immutable data, so adopting it nudges the whole codebase toward signals and replacement instead of in-place mutation.

## Watch out

- Treating OnPush as "never re-renders". It only skips checks that have no reason.
- Adding it to a few leaf components while the rest of the app mutates shared state.
- Optimising before measuring.

## Remember

- Eager checks everything on every pass; OnPush checks on a reason.
- OnPush is the default for components since Angular 22.
- It prunes whole branches, so the saving compounds.

---
slug: lifecycle-overview
title: "Component lifecycle"
topic: components
kind: concept
summary: "The order in which Angular calls a component's hooks, from creation to destruction."
tags: [components, lifecycle, hooks, change-detection]
related: [ng-on-init, ng-on-changes, ng-on-destroy, ng-after-view-init]
---
> **In one line:** Angular creates a component, sets its inputs, renders it, re-checks it, and finally destroys it, and **lifecycle hooks** are named methods it calls at each step.

## The idea

You never call `new MyComponent()` and you never destroy one yourself. Angular owns the component's life, so you need a way to step in at the right moments without fighting the framework. That is what lifecycle hooks are: plain methods named `ngSomething` that Angular calls if you define them.

Without them you would have no reliable moment to fetch data, to know that a view query is ready, or to tidy up timers and subscriptions. Here is the order for a component that has inputs:

| Order | Hook | Runs |
|---|---|---|
| 1 | `constructor()` | when the class is created, before inputs are set |
| 2 | `ngOnChanges()` | before `ngOnInit`, and whenever a bound input gets a new value |
| 3 | `ngOnInit()` | once, after the first `ngOnChanges` |
| 4 | `ngDoCheck()` | after `ngOnInit`, then on every change detection run |
| 5 | `ngAfterContentInit()` | once, after projected content is ready |
| 6 | `ngAfterContentChecked()` | after that, on every run |
| 7 | `ngAfterViewInit()` | once, after the component's view is ready |
| 8 | `ngAfterViewChecked()` | after that, on every run |
| 9 | `ngOnDestroy()` | just before Angular removes the component |

Two patterns make the list easy to hold. The **init** hooks run once; the **checked** hooks run again and again, so keep them light.

## See it

In day-to-day work you will use only four of them:

```typescript
export class Example implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  ngOnChanges(changes: SimpleChanges): void { /* an input changed */ }
  ngOnInit(): void { /* once: set up */ }
  ngAfterViewInit(): void { /* once: the view and its queries exist */ }
  ngOnDestroy(): void { /* once: clean up */ }
}
```

Each of these has its own lesson. The rest (`ngDoCheck` and the content and view *Checked* hooks) are for advanced cases such as custom change detection, and are rarely needed.

## Go deeper

Hooks are about **time**, not about data. If a component's state is built from `signal()` and `computed()`, you often do not need `ngOnChanges` or `ngDoCheck` at all, because updates happen wherever a signal is read. Hooks stay essential for once-only setup, view readiness and teardown.

Think of a hotel stay. `constructor` is the room being built, `ngOnInit` is check-in, `ngAfterViewInit` is the room fully set up, and `ngOnDestroy` is check-out, where anything left unsettled becomes someone else's problem. In an app, that is a memory leak.

## Watch out

- Hook names are matched by spelling. A typo such as `ngOnInt` fails silently, so implement the interface (`OnInit`) to turn it into a compile error.
- Heavy work in `ngDoCheck` or `ngAfterViewChecked`. They run on every change detection, which can be many times per click.
- Changing state that the current view already rendered, from `ngAfterViewInit` or a checked hook. That can raise `ExpressionChangedAfterItHasBeenCheckedError`.

## Remember

- Angular calls hooks in a fixed order; init hooks run once, checked hooks run repeatedly.
- The four you will use are `ngOnChanges`, `ngOnInit`, `ngAfterViewInit` and `ngOnDestroy`.
- Implement the interfaces, and keep the hooks thin by delegating to services.

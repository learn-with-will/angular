---
slug: ng-after-view-init
title: "ngAfterViewInit"
topic: components
kind: api
summary: "Run code once the component's own view has been created, when view queries are ready."
tags: [components, lifecycle, view, dom]
related: [lifecycle-overview, view-child, after-next-render, ng-on-init]
---
> **In one line:** `ngAfterViewInit()` runs once, after the component's view and its child views have been initialized, so it is the earliest safe place to use a view query.

## The idea

When a component is created, its class runs first and its template is rendered afterwards. Anything you want from the rendered template, such as a reference to a `<canvas>`, an input's size or a child component, does not exist yet while `ngOnInit` runs.

`ngAfterViewInit` is Angular's signal that the view is built. It fires one time, and it is the traditional moment to read a `@ViewChild` reference or start a library that needs a real DOM element. The same logic explains the three places you might try to read an element:

| Where | Is the element there? |
|---|---|
| constructor | no |
| `ngOnInit` | no (except a static query not inside `@if` or `@for`) |
| `ngAfterViewInit` | yes |

## See it

```typescript
@Component({
  selector: 'app-tick-canvas',
  template: `<canvas #tick width="400" height="120"></canvas>`,
})
export class TickCanvas implements AfterViewInit {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('tick');

  ngAfterViewInit(): void {
    const ctx = this.canvas().nativeElement.getContext('2d');
    ctx?.fillText('Ready', 10, 60);
  }
}
```

Reading `this.canvas()` earlier, in the constructor or `ngOnInit`, would fail, because the canvas does not exist until Angular has rendered the view.

## Go deeper

A signal query (`viewChild()`) is simply `undefined` until the element exists, so you can often skip the hook and react with an `effect()` or `computed()` instead. For one-off DOM work that must run in the browser only, `afterNextRender()` is usually a better fit, because it also stays out of server-side rendering.

If you meet the older decorator form, `@ViewChild('tick') canvasRef!: ElementRef<HTMLCanvasElement>`, the rule is the same: it is only safe to read from `ngAfterViewInit` onwards, because the field is filled in after the view is created. Its twin for projected content is `ngAfterContentInit`, which fires once the content a parent passed in has been initialized.

Be careful about *what* you change in this hook. The view has just been checked, so writing to state that the template already displayed can raise `ExpressionChangedAfterItHasBeenCheckedError` in development. If a value must update after render, trigger it from an event, or restructure so the first value is correct.

## Watch out

- Reading a view reference in `ngOnInit` or the constructor. It is `undefined` there, or throws for a required query.
- Changing displayed state inside the hook, which triggers the "expression changed" error.
- Assuming the element exists when it is inside `@if`. Guard against `undefined` unless the condition is certain.

## Remember

- `ngAfterViewInit` runs once, after the view is ready.
- It is the first safe place to touch a view query or a real DOM element.
- Prefer `afterNextRender()` for browser-only DOM work.

---
slug: after-next-render
title: "afterNextRender()"
topic: components
kind: api
summary: "Run browser-only DOM code once Angular has finished rendering."
tags: [components, rendering, dom, ssr]
related: [ng-after-view-init, view-child, lifecycle-overview, effect]
since: "20"
---
> **In one line:** `afterNextRender(callback)` runs your callback once, after the next render, and only in the browser. It is the safe home for measuring, focusing and starting widgets.

## The idea

Some work must wait until Angular has put real elements on the page: measuring a box, moving focus into an input, starting a chart library that needs a DOM node. Doing it earlier finds nothing there. Doing it with plain browser APIs like `document` also breaks when the app is rendered on a server, where there is no DOM at all.

Two functions solve both problems. You call them from an **injection context**, usually the constructor, and Angular runs the callback after rendering, in the browser only.

| Function | Runs | Use it for |
|---|---|---|
| `afterNextRender()` | once, after the next render | one-time setup: focus, measure, start a widget |
| `afterEveryRender()` | after every render | work that must track the DOM as it changes |
| `ngAfterViewInit()` | once, after the view is ready | the older hook; also runs on the server |

`afterEveryRender()` was called `afterRender()` before Angular 20.

## See it

```typescript
@Component({
  selector: 'app-search-field',
  template: `<input #box placeholder="Search" />`,
})
export class SearchField {
  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  constructor() {
    // Runs once, after the first render, in the browser only
    afterNextRender(() => this.box().nativeElement.focus());
  }
}
```

The element is guaranteed to exist by the time the callback runs, so the required query is safe to read.

## Go deeper

Because these callbacks never run during server-side rendering, they are where code that touches `window`, `document` or measured sizes belongs. A hook such as `ngAfterViewInit` still runs on the server, where such code would crash.

`afterEveryRender()` runs a lot, so keep it fast, and avoid writing state inside it on every pass: a change there can trigger another render, which runs it again.

The signal-aware sibling is `afterRenderEffect()`. Like `effect()`, it re-runs when the signals it reads change, but only after rendering, which makes it the right tool for writing to the DOM in response to state.

## Watch out

- Calling `afterNextRender()` from a plain method. It needs an injection context, so call it in the constructor or a field initializer, or pass an `injector`.
- Reaching for `window` or `document` in `ngOnInit`. It breaks under server-side rendering; move that code here.
- Updating state inside `afterEveryRender()` on every run, which can cause a render loop.

## Remember

- `afterNextRender()` runs once, after rendering, only in the browser.
- `afterEveryRender()` runs after every render, so keep it light.
- Call them in an injection context, usually the constructor.

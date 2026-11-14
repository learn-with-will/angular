---
slug: pitfall-silent-directive
title: "Pitfall: a directive that does nothing"
topic: directives-pipes
kind: pitfall
summary: "A missing import or a selector without brackets makes a directive silently do nothing."
tags: [directives, imports, selector, debugging]
related: [attribute-directive, directives-overview, host-bindings, using-components]
---
> **In one line:** When a directive seems to be ignored, Angular rarely complains. The attribute is just treated as plain HTML. Check the import, then the selector, then whether you edited the DOM directly.

## The idea

Directives fail quietly. An unknown *element* such as `<app-widget>` is an error, but an unknown *attribute* like `appHighlight` is valid HTML, so Angular assumes you meant it as ordinary markup and moves on. The page loads, the console is clean, and nothing happens.

That makes the symptom ("nothing happens") match several different causes. Work through them in order of how often they occur:

| What you see | Likely cause | Fix |
|---|---|---|
| nothing happens, no error | the directive is not in the component's `imports` | add the directive class to `imports` |
| nothing applies anywhere | selector written without brackets, `'appHighlight'` | use `'[appHighlight]'` |
| it works, then breaks under server rendering | writes to `nativeElement` directly | use a `host` binding |
| structural content flickers or loses state | the view is rebuilt on every run | track the view and create it once |
| `(dismissed)` never fires | host directive output not exposed | list it in `outputs` |

## See it

```typescript
// Before: the directive exists but this component never imported it
@Component({
  selector: 'app-product-list',
  template: `<li appHighlight="lightyellow">{{ name }}</li>`,   // silently ignored
})
export class ProductList {}

// After: import it, and the attribute starts to work
@Component({
  selector: 'app-product-list',
  imports: [Highlight],
  template: `<li appHighlight="lightyellow">{{ name }}</li>`,
})
export class ProductList {}
```

## Go deeper

A quick way to tell "not imported" from "imported but not matching": add a deliberate unknown *binding*, such as `[appHighlight]="'red'"`. If the directive is not imported, Angular reports that it cannot bind to `appHighlight` because it is not a known property, which turns the silent failure into a loud one.

The selector is the other usual suspect. `selector: 'appHighlight'` without brackets matches an element called `<appHighlight>`, which nobody writes, so it never applies. Include the prefix too, because unprefixed names like `[highlight]` or `[tooltip]` can collide with other libraries.

## Watch out

- Assuming silence means success. For attributes it often means "ignored".
- Fixing the symptom by writing to `nativeElement`. It hides a missing binding and breaks under server-side rendering.
- Adding the directive to a different component's `imports`. Each template needs its own import.

## Remember

- An unimported directive attribute is silently ignored.
- Check the `imports` array first, then the selector brackets and prefix.
- Use host bindings, not direct DOM writes, for the host element's look.

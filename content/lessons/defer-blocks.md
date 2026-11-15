---
slug: defer-blocks
title: "@defer: lazy boundaries in a template"
topic: architecture
kind: api
summary: "Load a heavy component only when a trigger fires, with a placeholder, a loading state and prefetching."
tags: [architecture, defer, lazy-loading, performance]
related: [lazy-boundaries, hydration, lazy-routes, feature-folders]
---
> **In one line:** `@defer` splits a component into its own chunk and loads it when a trigger fires, such as entering the viewport, with optional prefetching and placeholders.

## The idea

Routes are one lazy boundary. `@defer` is another, **inside a template**: a heavy chart below the fold, a comments section, a rarely opened panel. The component and its dependencies move into a separate chunk that loads on demand.

You choose when with a **trigger**, and optionally when to *prefetch* the code earlier:

| Trigger | Loads when |
|---|---|
| `on viewport` | the placeholder scrolls into view |
| `on interaction` | the user clicks or focuses the placeholder |
| `on hover` | the pointer moves over it |
| `on idle` | the browser is idle (the default) |
| `on timer(2s)` | after a delay |
| `when condition` | an expression becomes true |

`prefetch on idle` downloads the code early but shows it only when the main trigger fires, so by the time the user scrolls, it is already there.

## See it

```html
@defer (on viewport; prefetch on idle) {
  <app-sales-chart [data]="data()" />
} @placeholder {
  <div class="chart-placeholder" style="height: 320px">Chart</div>
} @loading (minimum 300ms) {
  <p>Loading chart…</p>
} @error {
  <p role="alert">The chart could not be loaded.</p>
}
```

## Go deeper

Always give the `@placeholder` the **same size** as the final content. A placeholder with no height collapses, and when the chart appears the page jumps, which is exactly the layout shift you were trying to avoid. `minimum` on `@loading` stops a brief flash of a spinner when the chunk loads quickly.

Only **standalone** components, directives and pipes used *only* inside the deferred block are split off. If the same component is used elsewhere in the template outside the block, or imported statically elsewhere, it stays in the main bundle, and the block defers only the rendering. The same rule as route boundaries applies.

Do not defer what is above the fold. The main content people came for should render immediately, and deferring it delays the largest contentful paint. Defer secondary regions.

With server rendering, `@defer (hydrate on viewport)` also defers *hydration*, so the block stays static HTML without JavaScript until needed. That is a separate, server-only use of the same syntax.

## Watch out

- A placeholder without a fixed size, causing layout shift.
- Deferring above-the-fold content.
- Using the component elsewhere, so it is never split into its own chunk.

## Remember

- `@defer` is a lazy boundary in a template, loaded by a trigger.
- Pair it with `prefetch`, `@placeholder`, `@loading` and `@error`.
- Defer secondary content only, and size the placeholder.

---
slug: hydration
title: "Hydration"
topic: performance
kind: concept
summary: "The browser reuses the server's DOM instead of rebuilding it. Know what breaks it and how to defer parts of it."
tags: [performance, ssr, hydration, defer]
related: [ssr-render-modes, ssr-browser-only-code, http-transfer-cache, ng-optimized-image]
---
> **In one line:** With `provideClientHydration()`, Angular adopts the server-rendered DOM and attaches listeners instead of throwing it away and rebuilding it.

## The idea

Without hydration, the browser would show the server's HTML and then Angular would start, destroy that DOM and create it again, causing a flicker and wasting the work. Hydration walks the existing DOM and **adopts** it, so the page stays put and just becomes interactive.

For that to work, the DOM the server produced must match what the browser-side app expects. Hydration breaks when code changes the DOM behind Angular's back:

| Breaks hydration | Why |
|---|---|
| setting `innerHTML` directly | Angular's view of the nodes no longer matches |
| moving nodes with `appendChild` | the structure differs from what was rendered |
| a library that rewrites markup | the DOM is not what the server produced |

Angular reports a hydration mismatch error (NG0500 series) and falls back to re-rendering that part.

## See it

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
  ],
};
```

```html
<!-- Stays dehydrated static HTML until it scrolls into view -->
@defer (hydrate on viewport) {
  <app-reviews [productId]="id()" />
}
```

## Go deeper

Three tools refine it. `withEventReplay()` records clicks and key presses that happen before the JavaScript has loaded, then replays them when the app is ready, so early clicks are not lost; new projects include it. `withIncrementalHydration()` lets parts of the page remain **dehydrated** (static HTML, no JavaScript downloaded) until a trigger fires, marked with `@defer` and a `hydrate` trigger. It is stable since Angular 20 and enabled by default since Angular 22.

As a last resort, a component that cannot hydrate, typically one wrapping a DOM-rewriting library, can carry the `ngSkipHydration` attribute on its host. Angular then renders it from scratch in the browser. Treat it as a workaround, and replace the offending library when you can, since every skipped component loses the benefit.

Mismatches often come from content that differs between server and browser: a date formatted with the server's timezone, a random id, or a value read from `localStorage`. Render the same thing in both, and apply the browser-specific value in `afterNextRender`.

## Watch out

- Changing the DOM directly with `innerHTML` or `appendChild`.
- Rendering different content on server and browser, such as timestamps.
- Reaching for `ngSkipHydration` instead of fixing the cause.

## Remember

- Hydration reuses the server DOM and adds listeners.
- Direct DOM changes cause mismatches.
- `@defer (hydrate on ...)` defers JavaScript for parts of the page.

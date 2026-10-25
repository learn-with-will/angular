---
title: "Server-Side Rendering, Hydration & Prerendering"
level: "advanced"
estimatedTime: 55
tags:
  - ssr
  - hydration
  - prerendering
  - performance
  - seo
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain client-side rendering, server-side rendering, and prerendering, and when each one is worth it.
- Add SSR to a project and find your way around the files the CLI generates.
- Choose a render mode per route (server, prerender, or client) with server routes.
- Write components that run safely on the server, keeping browser-only code in `afterNextRender()`.
- Explain hydration, avoid the mistakes that break it, and use incremental hydration with `@defer`.
- Avoid fetching the same data twice with the HTTP transfer cache.

## Why This Concept Exists

A plain Angular app is **client-side rendered (CSR)**. The server sends an almost empty `index.html`, the browser downloads the JavaScript, and only then does Angular build the page. That has costs:

- **Slow first paint** on slow phones and networks: users stare at a blank page while JavaScript downloads and runs.
- **Weaker SEO and link previews**: some crawlers and most social-media preview bots don't run JavaScript, so they see an empty page.
- **Layout shifts** as content pops in after the first render.

**Server-side rendering (SSR)** runs the same Angular app on a Node.js server to produce real HTML for each request. The browser shows that HTML immediately, then Angular starts in the browser and **hydrates** it: instead of throwing the server's DOM away and rebuilding it, Angular reuses it and attaches event listeners. **Prerendering** (also called static site generation) does the same rendering once at build time, producing static HTML files for pages that are the same for everyone.

## Concept Explanation

### Three ways to render a route

| Mode | When HTML is produced | Good for | Watch out for |
|---|---|---|---|
| **Client (CSR)** | In the browser, after JavaScript loads | Logged-in dashboards, admin tools | Blank first paint, poor link previews |
| **Server (SSR)** | On the server, for every request | Pages with per-request or frequently changing data (product pages, search results) | Needs a Node.js server; server must be fast |
| **Prerender (SSG)** | Once, at build time | Pages that are the same for everyone (home, docs, blog posts) | Content is only as fresh as the last build |

Angular lets you mix them: each route can have its own render mode.

### Adding SSR

Create a project with SSR, or add it to an existing one:

```bash
ng new my-app --ssr
# or, in an existing project:
ng add @angular/ssr
```

The CLI adds a few files next to the usual ones:

| File | Purpose |
|---|---|
| `src/main.server.ts` | Bootstraps the app on the server. |
| `src/server.ts` | A small Node.js (Express) server that renders pages and serves static files. |
| `src/app/app.config.server.ts` | Server-only providers, merged with `app.config.ts`. |
| `src/app/app.routes.server.ts` | The render mode for each route. |

It also adds `provideClientHydration()` to `app.config.ts`, which turns on hydration in the browser.

### Server routes and render modes

`app.routes.server.ts` maps paths to render modes. It sits alongside your normal routes; it doesn't replace them:

```typescript
// app.routes.server.ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },             // home: static HTML at build time
  { path: 'products/:id', renderMode: RenderMode.Server },    // rendered per request
  { path: 'account/**', renderMode: RenderMode.Client },      // browser only
  { path: '**', renderMode: RenderMode.Server },
];
```

```typescript
// app.config.server.ts
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

### Code that runs on the server

During SSR your components run in Node.js, where there is no real `window`, no `localStorage`, and no layout. Angular provides a server-side `document`, but browser APIs that measure or store things don't exist. Two rules keep components safe:

1. **Put browser-only work in `afterNextRender()` (once) or `afterEveryRender()` (each render).** These callbacks run only in the browser, after Angular has rendered:

   ```typescript
   constructor() {
     afterNextRender(() => {
       this.theme.set(localStorage.getItem('theme') ?? 'light');
     });
   }
   ```

2. **Don't touch `window`, `document.body`, or `localStorage` in constructors, field initializers, or `ngOnInit`.** Those run on the server too. When you need a branch, inject `PLATFORM_ID` and check `isPlatformBrowser(platformId)`.

### Hydration

With `provideClientHydration()`, Angular in the browser walks the server-rendered DOM and *adopts* it instead of re-creating it. For that to work, the DOM the server produced must match what the browser-side app expects. Hydration breaks when code changes the DOM behind Angular's back, for example by setting `innerHTML` directly, moving nodes with `appendChild`, or using a library that rewrites markup. Angular then reports a hydration mismatch error (NG0500-series) and falls back to re-rendering that part.

- `withEventReplay()` records clicks and key presses that happen before the JavaScript has loaded, and replays them once the app is ready, so early clicks aren't lost. New projects include it.
- `withIncrementalHydration()` lets parts of the page stay *dehydrated* (static HTML, no JavaScript loaded) until a trigger fires. You mark those parts with `@defer` and a `hydrate` trigger, such as `@defer (hydrate on viewport)`. It's stable since Angular 20 and enabled by default since Angular 22.
- As a last resort for a component that can't hydrate (typically one wrapping a DOM-rewriting library), add the `ngSkipHydration` attribute to its host element. Angular then renders that component from scratch in the browser.

### Not fetching data twice: the HTTP transfer cache

Without help, a page rendered on the server fetches its data on the server, and then the browser fetches the *same* data again during hydration. `provideClientHydration()` includes an **HTTP transfer cache**: responses to `GET` and `HEAD` requests made during SSR are embedded in the HTML, and `HttpClient` in the browser reuses them instead of calling the API again. Requests with an `Authorization` header aren't cached by default. Tune the behavior with `withHttpTransferCacheOptions(...)`.

### Building and deploying

`ng build` produces two folders:

- `dist/my-app/browser/` — static files, including the prerendered HTML pages.
- `dist/my-app/server/` — the Node.js server. Run it with `node dist/my-app/server/server.mjs`.

If every route is prerendered or client-rendered, you can deploy the `browser` folder to any static host. As soon as one route uses `RenderMode.Server`, you need somewhere to run the Node.js server.

## Key Terminology

| Term | Meaning |
|---|---|
| **CSR** | Client-side rendering: the browser builds the page from JavaScript. |
| **SSR** | Server-side rendering: the server renders HTML for each request. |
| **Prerendering (SSG)** | Rendering routes to static HTML at build time. |
| **Hydration** | The browser-side app reusing the server-rendered DOM instead of rebuilding it. |
| **Event replay** | Recording user events that happen before hydration and replaying them afterwards. |
| **Incremental hydration** | Keeping parts of the page dehydrated until a `@defer` `hydrate` trigger fires. |
| **HTTP transfer cache** | Embedding server-side HTTP responses in the HTML so the browser doesn't re-fetch them. |
| **Server routes** | The `ServerRoute[]` list that sets a `RenderMode` per path. |
| **`afterNextRender()`** | Registers code that runs once in the browser after the next render; never on the server. |

## Syntax Overview

```typescript
// app.config.ts (browser + server)
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()), // Fetch works on the server and in the browser
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
  ],
};
```

```typescript
// A prerendered route with parameters: list the ids to render at build time
{
  path: 'blog/:slug',
  renderMode: RenderMode.Prerender,
  async getPrerenderParams() {
    const posts = inject(PostsApi);           // inject() works here
    const slugs = await posts.allSlugs();     // e.g. ['hello-world', 'signals-101']
    return slugs.map((slug) => ({ slug }));   // one HTML file per slug
  },
}
```

```html
<!-- Keep a heavy, below-the-fold widget dehydrated until it scrolls into view -->
@defer (hydrate on viewport) {
  <app-reviews [productId]="id()" />
}
```

## Real World Analogy

Think of a furniture shop.

- **CSR** is flat-pack furniture: the customer gets a box and has to assemble everything at home before they can sit down.
- **SSR** is furniture assembled in the shop for each order: it arrives ready to use, but the shop needs workers on duty for every order.
- **Prerendering** is the showroom stock assembled once in the morning: instant, but identical for everyone and only as new as that morning.
- **Hydration** is plugging in the assembled lamp you received: you don't take it apart and rebuild it, you just connect the power.
- **Incremental hydration** is plugging in the guest-room lamp only when someone actually walks into the guest room.

## Examples

### 1. Basic Example — A component that is safe on the server

A theme toggle that remembers the user's choice in `localStorage`. Reading `localStorage` in a field initializer would crash during SSR, so the read moves into `afterNextRender()`.

```typescript
// theme-toggle.ts
import { Component, afterNextRender, effect, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button type="button" (click)="toggle()">Switch to {{ theme() === 'light' ? 'dark' : 'light' }} mode</button>
  `,
})
export class ThemeToggle {
  // A server-safe default; the stored value is applied once we're in the browser.
  protected readonly theme = signal<Theme>('light');
  private readonly inBrowser = signal(false);

  constructor() {
    afterNextRender(() => {
      this.theme.set((localStorage.getItem('theme') as Theme | null) ?? 'light');
      this.inBrowser.set(true);
    });

    effect(() => {
      const theme = this.theme();
      if (!this.inBrowser()) return; // don't touch localStorage/document before we're in the browser
      localStorage.setItem('theme', theme);
      document.documentElement.dataset['theme'] = theme;
    });
  }

  protected toggle(): void {
    this.theme.update((theme) => (theme === 'light' ? 'dark' : 'light'));
  }
}
```

**What's happening:**
- On the server, the component renders with the default `'light'`, so the HTML is valid and matches what the browser will hydrate.
- `afterNextRender()` never runs on the server. In the browser it reads the saved theme after the first render.
- The `effect()` also runs on the server, so it checks the `inBrowser` signal before touching browser APIs. Because `inBrowser` is a signal, the effect runs again as soon as `afterNextRender()` flips it to `true`.
- If the stored theme is `'dark'`, the button label changes after hydration. That's expected; for no flash at all you'd store the theme in a cookie the server can read.

### 2. Real-World Example — Mixing render modes in a shop

The home page and category pages are prerendered, product pages are rendered per request (prices and stock change), and the account area stays client-only.

```typescript
// app.routes.server.ts
import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { CatalogApi } from './catalog/catalog-api';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  {
    path: 'category/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const catalog = inject(CatalogApi);
      const slugs = await catalog.categorySlugs(); // a Promise<string[]> from the API
      return slugs.map((slug) => ({ slug }));
    },
  },
  { path: 'products/:id', renderMode: RenderMode.Server },
  { path: 'account/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
```

```typescript
// product-page.ts
import { Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

@Component({
  selector: 'app-product-page',
  imports: [CurrencyPipe],
  template: `
    @if (product.value(); as p) {
      <h1>{{ p.name }}</h1>
      <p>{{ p.price | currency }} · {{ p.inStock ? 'In stock' : 'Sold out' }}</p>
    } @else if (product.error()) {
      <p role="alert">This product is unavailable.</p>
    }
  `,
})
export class ProductPage {
  readonly id = input.required<string>(); // from :id via withComponentInputBinding()
  protected readonly product = httpResource<Product>(() => `/api/products/${this.id()}`);
}
```

**What's happening:**
- At build time, Angular renders `/` and one HTML file per category slug returned by `getPrerenderParams()`.
- A request for `/products/42` is rendered on the server. Angular waits for the product request to finish before sending the HTML, so the page arrives complete.
- The product request made on the server is stored by the HTTP transfer cache. During hydration, the browser reuses it, so the API is called once, not twice.
- `/account/...` pages are rendered in the browser only, which suits pages that depend on the signed-in user and don't need SEO.

### 3. Best-Practice Example — Incremental hydration for a heavy page

A long product page has an interactive reviews widget far down the page. With incremental hydration it's rendered on the server (good for SEO), but its JavaScript isn't loaded or run until the user scrolls to it.

```typescript
// app.config.ts (excerpt)
provideClientHydration(withEventReplay(), withIncrementalHydration()),
```

```html
<!-- product-page.html (excerpt) -->
<app-product-summary [product]="product.value()" />

@defer (hydrate on viewport) {
  <!-- Server-rendered HTML is shown immediately; JS loads when it scrolls into view -->
  <app-reviews [productId]="id()" />
} @placeholder {
  <p>Loading reviews…</p>
}

@defer (hydrate on interaction) {
  <!-- Becomes interactive the first time the user clicks or focuses it -->
  <app-size-guide />
}
```

**Why this is best practice:**
- With incremental hydration, the server still renders the content inside `@defer`, so crawlers and users see it right away. Only the hydration (downloading and running its code) is deferred.
- `hydrate on viewport` and `hydrate on interaction` work like the regular `@defer` triggers. With event replay, a click on the dehydrated size guide is replayed once it hydrates, so it isn't lost.
- The `@placeholder` is used only when the block renders on the client (for example after client-side navigation); with SSR the real content is already in the HTML.
- Deferring hydration cuts the JavaScript needed for the first interaction, which improves metrics like Interaction to Next Paint.

## Common Mistakes

1. **Using browser APIs during server rendering.** `localStorage`, `window.innerWidth`, or `document.body` in a constructor, field initializer, or `ngOnInit` crash or misbehave on the server. Move that code into `afterNextRender()`, or guard it with `isPlatformBrowser(inject(PLATFORM_ID))`.
2. **Changing the DOM behind Angular's back.** Setting `innerHTML` directly or moving elements with DOM APIs makes the browser's DOM differ from the server's and breaks hydration. Use bindings, `@if`/`@for`, or `[innerHTML]` with trusted content.
3. **Rendering different content on the server and in the browser.** Using `Math.random()`, `new Date()`, or the browser's time zone in templates produces mismatches. Compute such values once and pass them through the HTTP transfer cache, or set them after hydration.
4. **Fetching the same data twice.** Without `provideClientHydration()`, the browser repeats every request the server already made. Keep hydration enabled, and remember that requests with an `Authorization` header aren't cached by default.
5. **Prerendering pages that change per user.** A prerendered page is the same HTML for everyone. Use `RenderMode.Server` (or `Client`) for anything personal or frequently changing.
6. **Deploying an SSR app to a static host.** As soon as one route uses `RenderMode.Server`, you need a running Node.js server. A static host can serve only prerendered and client-rendered routes.
7. **Reaching for `ngSkipHydration` first.** It makes that component re-render from scratch in the browser, losing the benefit of SSR there. Fix the DOM manipulation instead, and use it only for components you can't change.

## Best Practices

- Decide per route: prerender what's the same for everyone, server-render what's dynamic but public, and client-render what's private.
- Keep `provideClientHydration(withEventReplay())` on, and add `withIncrementalHydration()` with `@defer (hydrate on …)` for heavy, below-the-fold parts.
- Put browser-only code in `afterNextRender()`/`afterEveryRender()`; never touch `window`, `localStorage`, or layout APIs while rendering.
- Use `HttpClient` (or `httpResource()`) for data, so the transfer cache can reuse server responses, and keep server-side API calls fast because they delay the first byte.
- Make templates deterministic: the server and the browser must produce the same DOM.
- Use `getPrerenderParams()` to prerender parameterized routes such as blog posts or categories.
- Check the browser console during development for hydration warnings and fix them early.

## Summary

- CSR renders in the browser, SSR on the server for each request, and prerendering once at build time; Angular can mix them per route.
- `ng new --ssr` or `ng add @angular/ssr` adds `server.ts`, `main.server.ts`, `app.config.server.ts`, and `app.routes.server.ts`.
- `ServerRoute` entries set `RenderMode.Server`, `RenderMode.Prerender`, or `RenderMode.Client`; `getPrerenderParams()` lists parameter values to prerender.
- Hydration reuses the server-rendered DOM; direct DOM manipulation and non-deterministic templates break it.
- `withEventReplay()` replays early user events, and `withIncrementalHydration()` with `@defer (hydrate on …)` defers hydrating parts of the page (enabled by default since Angular 22).
- The HTTP transfer cache stops the browser from repeating `GET` requests the server already made.
- Browser-only code belongs in `afterNextRender()`/`afterEveryRender()`.

## Flash Cards

**Q: What is hydration?**
A: The browser-side Angular app reusing the DOM rendered on the server — attaching listeners and state to it — instead of throwing it away and rendering again.

**Q: Which render mode suits a blog post that is the same for every visitor?**
A: `RenderMode.Prerender`, so it's rendered once at build time and served as a static HTML file. Use `getPrerenderParams()` to list the posts to render.

**Q: Why does reading `localStorage` in a component's field initializer break SSR, and where should it go?**
A: Field initializers run on the server too, where `localStorage` doesn't exist. Put browser-only code in `afterNextRender()`, which runs only in the browser.

**Q: How does Angular avoid fetching the same data on the server and again in the browser?**
A: `provideClientHydration()` enables the HTTP transfer cache: `GET`/`HEAD` responses made during SSR are embedded in the page and reused by `HttpClient` during hydration.

**Q: What does `@defer (hydrate on viewport)` do with incremental hydration enabled?**
A: The block's content is rendered on the server and shown immediately, but its JavaScript is loaded and hydrated only when the block scrolls into view.

## Exercises

**Easy:** Add SSR to a small app with `ng add @angular/ssr`. Build it, start the server with `node dist/<app>/server/server.mjs`, and use "View page source" to confirm the HTML contains your page content. Then find and fix one component that reads `window` or `localStorage` outside `afterNextRender()`.

**Medium:** Configure server routes so that `/` and `/about` are prerendered, `/products/:id` is server-rendered, and `/account/**` is client-rendered. Use `getPrerenderParams()` to prerender `/docs/:page` for three pages, and check `dist/<app>/browser` for the generated HTML files.

**Challenging:** Take a product page with a heavy reviews component. Enable `withIncrementalHydration()`, wrap the reviews in `@defer (hydrate on viewport)`, and use the browser's network panel to confirm its JavaScript loads only when you scroll down. Then deliberately break hydration (set `innerHTML` on an element in `ngOnInit`), read the error in the console, and fix it with a binding.

## Further Reading

- [Angular — Server-side and hybrid rendering](https://angular.dev/guide/ssr)
- [Angular — Hydration](https://angular.dev/guide/hydration)
- [Angular — Incremental hydration](https://angular.dev/guide/incremental-hydration)
- [Angular — Prerendering (SSG)](https://angular.dev/guide/prerendering)
- [Angular — `afterNextRender` and `afterEveryRender`](https://angular.dev/guide/components/lifecycle#aftereveryrender-and-afternextrender)
- [Angular — Deferrable views (`@defer`)](https://angular.dev/guide/templates/defer)

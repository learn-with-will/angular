---
slug: ssr-render-modes
title: "Client, server or prerender?"
topic: performance
kind: concept
summary: "Three ways to produce a route's HTML, chosen per route in app.routes.server.ts."
tags: [performance, ssr, prerender, render-mode]
related: [ssr-browser-only-code, hydration, ssr-build-deploy, http-transfer-cache]
---
> **In one line:** Client rendering builds the page in the browser, server rendering builds it per request, and prerendering builds it once at build time. Mix them route by route.

## The idea

A plain Angular app is **client-side rendered**: the server sends an almost empty `index.html`, the browser downloads JavaScript, and only then does Angular build the page. The costs are a blank first paint on slow devices, weaker SEO and link previews (many bots do not run JavaScript), and layout shifts as content pops in.

| Mode | HTML is produced | Good for | Watch out for |
|---|---|---|---|
| **Client** (CSR) | in the browser after JavaScript loads | logged-in dashboards, admin tools | blank first paint, poor link previews |
| **Server** (SSR) | on a Node.js server, per request | per-request or changing data: product pages, search | needs a running server; it must be fast |
| **Prerender** (SSG) | once, at build time | pages identical for everyone: home, docs, blog | content is only as fresh as the last build |

Each route can have its own mode, so a site can prerender its marketing pages, server-render product pages and leave the account area client-only.

## See it

```typescript
// app.routes.server.ts
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },            // static HTML at build time
  { path: 'products/:id', renderMode: RenderMode.Server },   // rendered per request
  { path: 'account/**', renderMode: RenderMode.Client },     // browser only
  { path: '**', renderMode: RenderMode.Server },
];
```

```typescript
// app.config.server.ts
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};
export const config = mergeApplicationConfig(appConfig, serverConfig);
```

## Go deeper

Server routes sit **alongside** your normal routes; they do not replace them. The normal routes say what component to show, and the server routes say how to render it.

Choose by two questions. Is the content the same for everyone? Then prerender. Does it depend on the request, such as the user, query or fast-changing data? Then render on the server. Is it private and behind a login with no SEO need? Then client rendering avoids server cost entirely.

Add SSR with `ng new my-app --ssr` or `ng add @angular/ssr`. The CLI creates `main.server.ts`, an Express `server.ts`, `app.config.server.ts` and `app.routes.server.ts`, and adds `provideClientHydration()` to `app.config.ts`.

Order matters in the server routes: the first matching path wins, as with the router, so keep the catch-all `**` last.

## Watch out

- Prerendering pages that depend on the user or on live data.
- Forgetting that SSR needs a server to run.
- Putting the catch-all route before specific ones.

## Remember

- Client: browser. Server: per request. Prerender: once at build.
- Choose per route with `RenderMode`.
- Server routes complement, not replace, normal routes.

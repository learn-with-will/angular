---
slug: ssr-build-deploy
title: "Building and deploying SSR"
topic: performance
kind: technique
summary: "ng build produces browser and server folders. Whether you need a Node server depends on your render modes."
tags: [performance, ssr, prerender, deployment]
related: [ssr-render-modes, hydration, http-transfer-cache, ng-serve-and-build]
---
> **In one line:** `ng build` produces a `browser` folder of static files and a `server` folder with a Node.js server. One server-rendered route means you need somewhere to run it.

## The idea

The output has two parts:

| Folder | Contents | Runs on |
|---|---|---|
| `dist/my-app/browser/` | static files, including prerendered HTML pages | any static host or CDN |
| `dist/my-app/server/` | the Node.js server | a Node host: `node dist/my-app/server/server.mjs` |

Your render modes decide what you must deploy. If **every** route is prerendered or client-rendered, deploy only the `browser` folder to a static host. As soon as one route uses `RenderMode.Server`, something has to run Node for each request.

That is the central trade-off: server rendering buys fresh, per-request HTML at the cost of running and scaling a server, while prerendering is cheap and fast but only as fresh as the last build.

## See it

```typescript
// A prerendered route with a parameter: list the ids to render at build time
{
  path: 'blog/:slug',
  renderMode: RenderMode.Prerender,
  async getPrerenderParams() {
    const posts = inject(PostsApi);          // inject() works here
    const slugs = await posts.allSlugs();    // ['hello-world', 'signals-101']
    return slugs.map((slug) => ({ slug }));  // one HTML file per slug
  },
}
```

```bash
ng build
node dist/my-app/server/server.mjs
```

## Go deeper

For parameterised prerender routes, Angular cannot guess the values, so `getPrerenderParams()` returns one object per page. Each produces its own static HTML file at build time. A new blog post then needs a rebuild to appear, which is the freshness cost of prerendering. If that is too slow for you, use `RenderMode.Server` for that route.

Test the production build locally before deploying: run the server output and view the page source. If the HTML contains your content, SSR works. If it contains only `<app-root></app-root>`, the route is being client-rendered, usually because of a missing server route or a crash that Angular caught and fell back from.

On a static host, check that unknown paths serve the right file. A prerendered route lives at a path like `blog/hello-world/index.html`, and hosts differ in how they serve directory paths and 404 pages.

Keep the server stateless and add caching in front of it, such as a CDN honouring `Cache-Control`, so a popular server-rendered page is not rendered again for every visitor.

## Watch out

- Deploying only `browser` when a route uses server rendering.
- Forgetting `getPrerenderParams()` for parameterised prerender routes.
- Not viewing the page source to confirm the HTML is actually rendered.

## Remember

- `browser` is static; `server` is the Node server.
- Prerender or client only means static hosting is enough.
- Parameterised prerender routes list their params at build time.

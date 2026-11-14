---
slug: lazy-routes
title: "Lazy loading routes"
topic: routing
kind: technique
summary: "Download a page's code only when the user first visits it, with loadComponent and loadChildren."
tags: [routing, lazy-loading, performance, code-splitting]
related: [route-basics, child-routes, can-match, route-params]
---
> **In one line:** `loadComponent` and `loadChildren` split your app into chunks that download on first visit, so the first load only carries the shell and the home page.

## The idea

If every page's code ships in the first download, the app starts slower with each feature you add, even though most visitors will never open most pages. **Lazy loading** defers a route's code until someone navigates to it. The bundler turns each `import()` into its own file, the router fetches it on demand, and the page appears.

There are two forms, depending on what you are loading:

| Property | Loads | Use it for |
|---|---|---|
| `component: Home` | nothing extra, it is in the main bundle | the shell and the home page |
| `loadComponent` | one standalone component | a single page |
| `loadChildren` | a whole file of child routes | a feature with several pages |

Only the home page and shared shell need to load up front. Everything else is a candidate.

## See it

```typescript
export const routes: Routes = [
  {
    path: 'products',
    loadComponent: () => import('./products-page').then(m => m.ProductsPage),
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./product-detail-page').then(m => m.ProductDetailPage),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '', redirectTo: 'products', pathMatch: 'full' },
];
```

The page's JavaScript is downloaded the first time the user visits that route, keeping the initial bundle small and the app fast.

## Go deeper

A feature file for `loadChildren` simply exports a `Routes` array, which can itself declare more lazy routes and route-level `providers`:

```typescript
// admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  { path: 'users', loadComponent: () => import('./users').then(m => m.AdminUsers) },
  { path: 'audit-log', loadComponent: () => import('./audit-log').then(m => m.AuditLog) },
];
```

The `.then(m => m.ProductsPage)` step picks the class out of the module. If the file uses a default export, `loadComponent: () => import('./products-page')` is enough.

After the first visit the chunk is cached, so going back is instant. You can also *preload* chunks in the background after the app starts with `withPreloading(PreloadAllModules)`, trading a little bandwidth for faster later navigation.

## Watch out

- Lazy loading tiny pages. Each chunk is a request; group small pages into one feature with `loadChildren`.
- Importing a lazy component statically elsewhere (`import { ProductsPage } from ...` in a shared file). That pulls it back into the main bundle.
- Forgetting the wildcard route when you lazy-load. Unknown URLs still need a fallback.

## Remember

- `loadComponent` lazy-loads one page and `loadChildren` lazy-loads a feature's routes.
- Keep only the shell and home page in the main bundle.
- A static import of a lazy component defeats the split.

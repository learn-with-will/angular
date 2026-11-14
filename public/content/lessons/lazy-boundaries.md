---
slug: lazy-boundaries
title: "Lazy boundaries and bundle size"
topic: architecture
kind: technique
summary: "A lazy route only splits the bundle if nothing else statically imports it. Check, and set budgets."
tags: [architecture, lazy-loading, bundles, budgets]
related: [lazy-routes, dependency-rules, defer-blocks, feature-folders]
---
> **In one line:** `loadComponent` and `loadChildren` create a boundary. A single static `import` of the same file from elsewhere erases it.

## The idea

Splitting the app into lazy chunks is easy to configure and easy to defeat. The router fetches a chunk on demand, but only if the bundler placed it in a separate file. If the main bundle also imports something from the feature, the bundler must include that file up front.

Typical accidents:

| Accident | Effect |
|---|---|
| `app.routes.ts` uses `loadComponent`, but a shared file imports the same component directly | the component lands in the **main bundle** |
| a "utils" barrel re-exports feature code | importing one function pulls the feature in |
| a root service imports a heavy feature class | every visitor downloads it |
| a large library imported at the top of the root component | it is never lazy |

So the boundary is a promise the *whole* dependency graph has to keep.

## See it

```typescript
// Lazy: split into its own chunk, loaded on first visit
{
  path: 'diary',
  loadComponent: () => import('./features/diary/diary-page').then((m) => m.DiaryPage),
}
```

```typescript
// Defeats the split: a static import elsewhere pulls it into the main bundle
import { DiaryPage } from './features/diary/diary-page';   // in a shared or root file
```

Tools to keep it honest as the app grows:

| Tool | What it does |
|---|---|
| `ng build` output | lists initial and lazy chunks with sizes |
| bundle budgets in `angular.json` | fail the build when the initial bundle grows past a limit |
| source-map-explorer or the esbuild analyzer | shows which modules make up each chunk |
| a lint boundary rule | stops features importing each other |

## Go deeper

Read the build output after adding a feature. A healthy build lists your feature as a separate lazy chunk. If its code shows up in the initial total instead, search for the static import. This takes a minute and prevents a slow regression nobody notices for months.

Budgets turn a silent drift into a visible failure. Set `maximumWarning` and `maximumError` for the initial bundle in `angular.json`, so a pull request that adds 200 kB fails CI, and the author has to justify it or split it.

Keep the **initial** route light: the shell, the home page and what they truly need. Everything else is a candidate for a boundary. Remember that each chunk costs a request, so group very small pages into one feature with `loadChildren`, rather than lazy-loading each one.

Heavy libraries (charts, editors, PDF viewers) deserve their own dynamic `import()` inside the code path that uses them, so only users who open that screen pay for them.

## Watch out

- Importing a lazy component statically somewhere else.
- No budgets, so growth is invisible.
- Lazy-loading tiny pages one chunk each.

## Remember

- A lazy boundary holds only if nothing imports across it statically.
- Read the build output and set budgets.
- Dynamic `import()` heavy libraries where they are used.

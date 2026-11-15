---
slug: pitfall-architecture-smells
title: "Pitfall: architecture smells"
topic: architecture
kind: pitfall
summary: "Flat folders, a dumping-ground shared folder, sideways imports and the standalone-era single-module app."
tags: [architecture, anti-patterns, structure, shared]
related: [feature-folders, dependency-rules, lazy-boundaries, route-providers]
---
> **In one line:** Architecture rots through small, reasonable-looking shortcuts. Each smell below has a recognisable symptom and a cheap fix.

## The idea

| Smell | Symptom | Fix |
|---|---|---|
| everything in `components/`, `services/`, `models/` | one change touches six folders | feature folders |
| `shared` imports from features | a cycle, or a shared component that needs a store | move the code up into its feature, or make the component dumb |
| feature imports another feature | changing one breaks the other, no independent lazy loading | move the common code down to `shared` or `core` |
| everything eagerly imported at the root | huge initial bundle, slow first load | lazy routes, `@defer`, dynamic `import()` |
| the standalone-era "single-module app" | one giant root component importing every component, and root providers for everything | feature routes and route-scoped providers |
| `core` services for per-feature state | state leaks across features and never resets | route or component providers |

The third-to-last is the modern version of an old anti-pattern. The `AppModule` that declared everything has become a root config that eagerly imports every page, so the whole app ships in one bundle, even though each page is a standalone component.

## See it

```typescript
// Before: every page is eagerly imported, so everything is in the main bundle
import { DiaryPage } from './features/diary/diary-page';
import { ExercisesPage } from './features/exercises/exercises-page';
import { ReportsPage } from './features/reports/reports-page';

export const routes: Routes = [
  { path: 'diary', component: DiaryPage },
  { path: 'exercises', component: ExercisesPage },
  { path: 'reports', component: ReportsPage },
];

// After: each feature is its own lazy boundary
export const routes: Routes = [
  { path: 'diary', loadChildren: () => import('./features/diary/diary.routes').then((m) => m.DIARY_ROUTES) },
  { path: 'exercises', loadChildren: () => import('./features/exercises/exercises.routes').then((m) => m.EXERCISES_ROUTES) },
  { path: 'reports', loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES) },
];
```

## Go deeper

None of these is a catastrophe on its own, which is why they accumulate. The signal to watch is *friction*: a one-line change needs edits in many places, a new teammate cannot find where a feature lives, or the initial bundle grows with every feature. Those are the smells showing up as cost.

Fix them as you pass through, not in a big rewrite. Move the next feature you touch into a feature folder, lift the next duplicated component into `shared` when a second consumer appears, and add a lint boundary rule so the fixed state stays fixed.

Resist designing the final architecture on day one. A structure invented before there is code to put in it is usually wrong, and a few well-chosen rules with enforcement serve better than an elaborate diagram nobody follows.

## Watch out

- Treating `shared` as the place for anything unplaced.
- Eager imports of every page in the root routes.
- Big-bang restructuring instead of incremental fixes.

## Remember

- Smells show up as friction: scattered changes and growing bundles.
- Lazy feature routes replace the single-module app.
- Fix incrementally and enforce with lint rules.

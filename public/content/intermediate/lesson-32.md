---
id: lesson-32
slug: feature-based-architecture-lazy-boundaries
title: "Feature-Based Architecture & Lazy Boundaries"
level: intermediate
order: 21
duration: 45
tags:
  - architecture
  - design-patterns
  - lazy-loading
  - folder-structure
  - standalone-components
---

## Learning Objectives

By the end of this lesson you will be able to:

- Organize an Angular app by **feature** instead of by file type, using `core/`, `shared/`, and `features/` folders.
- State the dependency rules between those folders, and explain why features shouldn't import from each other.
- Make every feature a **lazy boundary** with `loadChildren` and `loadComponent`, so users only download what they use.
- Scope a service to one feature with route-level `providers`.
- Avoid the two classic organization anti-patterns: the single-module app and its standalone-era twin, the giant shared imports list.
- Keep bundles small over time with preloading, `@defer`, and size budgets.

## Why This Concept Exists

Every Angular app starts small and tidy. Six months later, one of two things has usually happened:

- **Everything lives in one place.** In NgModule apps this was the *single-module app*: one `AppModule` declaring every component and importing every library. In standalone apps it looks like a flat `components/` folder with 80 files and a `services/` folder nobody dares to clean up.
- **Everything is downloaded up front.** The first page a user sees ships the code for the admin panel, the reports, and the settings screen, even if they never open them.

Both problems come from the same root cause: the code has no **boundaries**. Feature-based architecture draws those boundaries on purpose. Each feature gets a folder, a route, and a lazy-loaded bundle. That gives you a codebase where a new developer can find things, a team can own a feature, and the browser downloads code only when it's needed.

## Concept Explanation

### Organize by feature, not by file type

Folders like `components/`, `services/`, and `models/` answer the question "what kind of file is this?". That's rarely what you need to know. Feature folders answer "what part of the product is this?", which is how bugs are reported and how work is assigned.

A common layout:

```text
src/app/
├── core/                  # App-wide singletons and the shell
│   ├── layout/            # Navbar, sidebar, footer
│   ├── auth/              # AuthService, authGuard, authInterceptor
│   └── http/              # Other interceptors, error handler
├── shared/                # Reusable, feature-agnostic building blocks
│   ├── ui/                # Presentational components: Card, Badge, Spinner
│   ├── pipes/
│   └── utils/
├── features/
│   ├── diary/             # One folder per feature
│   │   ├── diary.routes.ts
│   │   ├── diary-page.ts
│   │   ├── entry-list.ts
│   │   ├── diary.store.ts
│   │   └── exercise-set.model.ts
│   └── exercises/
├── app.routes.ts
└── app.config.ts
```

### What belongs in each layer

- **`core/`**: things that exist **once** for the whole app. The layout shell, authentication, interceptors, global error handling, and `providedIn: 'root'` services that every feature relies on.
- **`shared/`**: reusable building blocks that don't know about any feature: presentational UI components, pipes, directives, and pure utility functions. Nothing in `shared/` holds app state or calls a feature's API.
- **`features/<name>/`**: everything for one part of the product: its pages, its own components, its state service, its models, and its `*.routes.ts` file.

### The dependency rules

The layers only work if imports point in the right direction:

| From \ To | `core/` | `shared/` | another feature |
|---|---|---|---|
| **feature** | ✅ | ✅ | ❌ |
| **shared** | ❌ | ✅ | ❌ |
| **core** | ✅ | ✅ | ❌ (only `app.routes.ts` references features, through lazy `import()`) |

Why can't features import each other? Because the moment `diary` imports a component from `exercises`, the two can't be loaded, changed, or owned separately. If two features need the same thing, either move it to `shared/` (if it's generic) or to `core/` (if it's an app-wide service). If one feature needs to *send the user* to another, use the router: a URL is the cleanest contract there is.

### Lazy boundaries

Each feature becomes its own JavaScript chunk, loaded the first time the user navigates to it:

- **`loadChildren`** loads a routes file for a feature with several pages.
- **`loadComponent`** loads a single standalone component for a one-page feature.

The `import()` inside them is plain JavaScript dynamic import. The Angular build sees it and splits that code into a separate file. Anything you import statically (`import { X } from '...'` at the top of `app.routes.ts`) ends up back in the main bundle, so keep feature imports dynamic.

### Feature-scoped services with route providers

A route can declare `providers`. Services listed there are created by an injector that belongs to that route and its children:

```typescript
{
  path: 'diary',
  providers: [DiaryStore], // one instance shared by every page in the diary feature
  loadChildren: () => import('./features/diary/diary.routes').then((m) => m.DIARY_ROUTES),
}
```

This keeps feature state out of the root injector and out of other features. Note that route injectors aren't destroyed when the user navigates away, so don't use them for state that must reset every time a page opens. Put that kind of state in a component's `providers`.

### The anti-patterns, then and now

- **Single-module app (NgModule era).** One module declares and imports everything. Builds can't split code well, and nobody knows what belongs where. The fix was feature modules.
- **Giant shared imports list (standalone era).** A `SHARED_IMPORTS = [CommonModule, ReactiveFormsModule, Card, Badge, ...]` array spread into every component recreates the old `SharedModule` problem. Each component now depends on everything, and you can't tell what it really uses. Import exactly what each component's template needs. Since Angular 19 the compiler even warns about unused standalone imports.

### Keeping bundles small over time

- **Preloading**: `withPreloading(PreloadAllModules)` downloads lazy chunks in the background after the first page is interactive. The first load stays small, and later navigations feel instant.
- **`@defer`**: for heavy parts *inside* a page, such as a chart or an editor, defer them until they're visible or needed.
- **Budgets**: `angular.json` budgets warn or fail the build when a bundle grows past a limit, so regressions are caught in CI instead of by users on slow connections.

### Lazy boundaries inside a template: `@defer`

Routes split code per page. `@defer` splits code *inside* a page: the deferred component's code is downloaded only when a trigger fires.

```html
@defer (on viewport; prefetch on idle) {
  <app-progress-chart [entries]="store.entries()" />
} @placeholder (minimum 300ms) {
  <div class="h-64 rounded-xl bg-ink-100"></div>
} @loading (after 100ms; minimum 500ms) {
  <p>Loading chart…</p>
} @error {
  <p>The chart couldn't be loaded.</p>
}
```

- **Triggers:** `on idle` (the default), `on viewport`, `on interaction`, `on hover`, `on immediate`, `on timer(2s)`, or `when someCondition()`. `prefetch on …` downloads the code early without rendering it.
- **`@placeholder`** shows until the trigger fires. `on viewport`, `on interaction`, and `on hover` watch the placeholder unless you point them at another element, as in `on interaction(deleteButton)` with `<button #deleteButton>`.
- **`@loading`** shows while the code downloads; `after` and `minimum` prevent a flicker on fast connections. **`@error`** shows if loading fails.
- Only **standalone** components, directives, and pipes are deferred. If the same component is also used outside the `@defer` block in that file, it ends up in the main bundle anyway.

## Key Terminology

- **Feature**: a slice of the product that a user would recognize, like "diary" or "settings", together with all the code it needs.
- **Core layer**: app-wide singletons and the application shell, created once.
- **Shared layer**: feature-agnostic, reusable building blocks with no app state.
- **Lazy boundary**: a point in the route tree where code is split into a separate chunk and loaded on demand.
- **Chunk**: a JavaScript file produced by the build that can be loaded separately from the main bundle.
- **Route-level providers**: services registered on a route, shared by that route and its children.
- **Preloading strategy**: a router setting that decides when lazy chunks are downloaded in the background.
- **Budget**: a size limit in `angular.json` that makes the build warn or fail when a bundle grows too large.

## Syntax Overview

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'diary' },
  {
    path: 'diary',
    loadChildren: () => import('./features/diary/diary.routes').then((m) => m.DIARY_ROUTES),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about-page').then((m) => m.AboutPage),
  },
  { path: '**', loadComponent: () => import('./core/layout/not-found').then((m) => m.NotFound) },
];
```

```typescript
// features/diary/diary.routes.ts
import { Routes } from '@angular/router';

export const DIARY_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./diary-page').then((m) => m.DiaryPage) },
  { path: ':id/edit', loadComponent: () => import('./entry-edit-page').then((m) => m.EntryEditPage) },
];
```

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withPreloading(PreloadAllModules))],
};
```

## Real World Analogy

Think of a shopping mall.

- **Core** is building management: security, electricity, elevators, the information desk. There's exactly one of each for the whole building.
- **Shared** is the common fixtures: benches, signage, and lighting that look the same on every floor and don't belong to any shop.
- **Features** are the shops. Each has its own staff, stock room, and cash register (its components, state, and services).
- Shops don't walk into each other's stock rooms. If a customer needs something from another shop, you point them to it (a link to another route).
- Shops that open their shutters only when a customer walks up are **lazy-loaded**. The mall opens faster because it doesn't light up every shop at 6 a.m.

## Examples

### 1. Basic Example: From a flat folder to feature folders with lazy routes

Before, everything is grouped by type and loaded eagerly:

```text
src/app/
├── components/   diary.ts, entry-list.ts, entry-item.ts, exercises.ts, login.ts, navbar.ts ...
├── services/     diary.service.ts, exercises.service.ts, auth.service.ts
└── app.routes.ts  (imports every page component at the top)
```

After, each feature has a folder and a lazy route:

```text
src/app/
├── core/layout/navbar.ts
├── core/auth/auth.service.ts
├── features/diary/      diary.routes.ts, diary-page.ts, entry-list.ts, entry-item.ts, diary.service.ts
├── features/exercises/  exercises-page.ts, exercises.service.ts
├── features/login/      login-page.ts
└── app.routes.ts
```

```typescript
// app.routes.ts: no static imports of feature code
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'diary' },
  {
    path: 'diary',
    loadChildren: () => import('./features/diary/diary.routes').then((m) => m.DIARY_ROUTES),
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./features/exercises/exercises-page').then((m) => m.ExercisesPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
];
```

**Why this works:** `ng build` now prints a small initial bundle plus one lazy chunk per feature. A user who only logs in and checks the diary never downloads the exercises code.

### 2. Real-World Example: A feature with its own store, guard, and shared UI

The diary feature has two pages that share state. The store is scoped to the feature with route providers, the whole feature is protected by one guard from `core/`, and the pages use a presentational `Card` from `shared/`.

```typescript
// shared/ui/card.ts: knows nothing about any feature
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-xl border p-4 shadow-sm">
      <h2 class="mb-2 font-bold">{{ heading() }}</h2>
      <ng-content />
    </section>
  `,
})
export class Card {
  readonly heading = input.required<string>();
}
```

```typescript
// features/diary/diary.store.ts: provided by the route, not providedIn: 'root'
import { Injectable, computed, inject, signal } from '@angular/core';
import { DiaryService } from './diary.service';
import { ExerciseSet } from './exercise-set.model';

@Injectable()
export class DiaryStore {
  private readonly api = inject(DiaryService);
  private readonly _entries = signal<ExerciseSet[]>([]);

  readonly entries = this._entries.asReadonly();
  readonly totalVolume = computed(() =>
    this._entries().reduce((sum, entry) => sum + entry.sets * entry.reps, 0),
  );

  load(): void {
    this.api.list().subscribe((list) => this._entries.set(list));
  }
}
```

```typescript
// features/diary/diary.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { DiaryStore } from './diary.store';

export const DIARY_ROUTES: Routes = [
  {
    path: '',
    canActivateChild: [authGuard], // one guard protects every diary page
    providers: [DiaryStore],       // one store shared by the pages below
    children: [
      { path: '', loadComponent: () => import('./diary-page').then((m) => m.DiaryPage) },
      {
        path: ':id/edit',
        loadComponent: () => import('./entry-edit-page').then((m) => m.EntryEditPage),
      },
    ],
  },
];
```

```typescript
// features/diary/diary-page.ts
import { Component, inject } from '@angular/core';
import { Card } from '../../shared/ui/card';
import { EntryList } from './entry-list';
import { DiaryStore } from './diary.store';

@Component({
  selector: 'app-diary-page',
  imports: [Card, EntryList], // only what this template uses
  template: `
    <app-card heading="This week">
      <p>Total volume: {{ store.totalVolume() }} reps</p>
    </app-card>
    <app-entry-list [entries]="store.entries()" />
  `,
})
export class DiaryPage {
  protected readonly store = inject(DiaryStore);

  constructor() {
    this.store.load();
  }
}
```

**Why this works:** every arrow points the right way. The feature imports from `core/` (the guard) and `shared/` (the card), and nothing outside the feature knows `DiaryStore` exists. Both diary pages inject the same store instance because it's provided on their shared parent route. The store's code ships in the diary chunk, not the main bundle.

### 3. Best-Practice Example: Keeping boundaries and bundle size honest

Good structure decays unless something checks it. Two cheap safety nets are size budgets and path aliases that make illegal imports obvious.

```json
// angular.json (excerpt from the production configuration)
"budgets": [
  { "type": "initial", "maximumWarning": "400kB", "maximumError": "800kB" },
  { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
]
```

```json
// tsconfig.json (excerpt): readable, greppable import paths
"compilerOptions": {
  "paths": {
    "@core/*": ["src/app/core/*"],
    "@shared/*": ["src/app/shared/*"]
  }
}
```

```typescript
// features/diary/diary-page.ts
import { Card } from '@shared/ui/card';      // ✅ feature → shared
import { authGuard } from '@core/auth/auth.guard'; // ✅ feature → core
// import { ExercisePicker } from '../exercises/exercise-picker'; ❌ feature → feature
```

```typescript
// app.config.ts: small first load, instant later navigations
import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from '@core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

```html
<!-- Inside a page: defer a heavy, below-the-fold widget -->
@defer (on viewport) {
  <app-progress-chart [entries]="store.entries()" />
} @placeholder {
  <div class="h-64 rounded-xl bg-ink-100"></div>
}
```

To see what's in each chunk, run `ng build --stats-json` and drop the generated `stats.json` into the [esbuild bundle analyzer](https://esbuild.github.io/analyze/). If a feature's code shows up in the initial bundle, look for a static import that should be a lazy `import()`.

**Why this is best practice:** budgets turn "the app feels slower" into a failing build with a number attached. Path aliases make cross-feature imports stand out in code review, and lint tools such as Sheriff, `eslint-plugin-boundaries`, or Nx's module boundary rule can enforce the table above automatically. Preloading and `@defer` keep the first load small without making later navigation feel slow.

## Common Mistakes

- **Statically importing a lazy feature.** One `import { DiaryPage } from './features/diary/diary-page'` at the top of `app.routes.ts` pulls the whole page back into the main bundle, even if a route below uses `loadComponent`.
- **Features importing from each other.** It couples their releases and their bundles. Move the shared piece to `shared/` or `core/`, or link between features with the router.
- **Putting stateful services in `shared/`.** `shared/` is for things that are safe to use anywhere. A service holding app data belongs in `core/` (app-wide) or in a feature.
- **One giant shared imports array.** Spreading `SHARED_IMPORTS` everywhere hides each component's real dependencies. Import what each template uses.
- **Over-splitting.** A feature folder with one tiny component and its own lazy route can add a network request without saving anything. Group pages that are used together.
- **Expecting route providers to reset on every visit.** Route injectors stay alive after you navigate away. Use component `providers` for state that must start fresh each time.
- **Ignoring budget warnings.** Warnings that everyone scrolls past turn into slow apps. Fix them or consciously raise the limit.

## Best Practices

- Group code by feature. Keep `core/` for app-wide singletons, `shared/` for feature-agnostic building blocks, and `features/` for everything else.
- Make imports flow in one direction: features use `core/` and `shared/`, and never each other.
- Give each feature a lazy route: `loadChildren` for multi-page features, `loadComponent` for single pages.
- Scope feature state with route `providers` instead of making everything `providedIn: 'root'`.
- Use `withPreloading(PreloadAllModules)` (or a custom strategy) so lazy chunks are ready before users click.
- Defer heavy, non-critical parts of a page with `@defer`.
- Set realistic budgets in `angular.json` and treat breaches as bugs.
- Automate boundary checks with a lint rule once the team grows beyond a few people.

## Summary

- Feature-based architecture organizes code by product area, with `core/`, `shared/`, and `features/` layers.
- Features may depend on `core/` and `shared/`, but not on each other. That keeps them independently loadable and ownable.
- Every feature is a lazy boundary. `loadChildren` and `loadComponent` use dynamic `import()` so the build splits each feature into its own chunk.
- Route-level `providers` scope a service to one feature and keep it out of the main bundle.
- The single-module app and the giant shared imports array are the same anti-pattern in two eras: no boundaries.
- Preloading, `@defer`, and budgets keep bundles small as the app grows.

## Flash Cards

**Q: What's the difference between `core/` and `shared/`?**
A: `core/` holds things that exist once for the whole app (shell, auth, interceptors, root services). `shared/` holds feature-agnostic, reusable building blocks (presentational UI, pipes, utilities) with no app state.

**Q: Why shouldn't one feature import a component from another feature?**
A: It couples them. They can no longer be loaded, changed, or owned independently. Move shared pieces to `shared/` or `core/`, and navigate between features with the router.

**Q: When do you use `loadChildren` vs. `loadComponent`?**
A: `loadChildren` lazy-loads a routes file for a feature with several pages. `loadComponent` lazy-loads one standalone component for a single-page feature.

**Q: How do you share one service instance across all pages of a feature, without putting it in the root injector?**
A: Register it in the `providers` array of the feature's parent route. Every child route's components get the same instance.

**Q: What does `withPreloading(PreloadAllModules)` change?**
A: After the first page is interactive, the router downloads lazy chunks in the background, so later navigations don't wait for the network.

## Exercises

**Easy**
Take a small app with `components/` and `services/` folders and reorganize it into `core/`, `shared/`, and `features/`. Convert every page route to `loadComponent` and confirm with `ng build` that you now get one chunk per page.

**Medium**
Create a `settings` feature with two pages (`profile` and `notifications`) that share a `SettingsStore`. Register the store in the parent route's `providers`, add a `canActivateChild` guard from `core/`, and verify that both pages see the same store instance by changing a value on one page and reading it on the other.

**Challenging**
Add budgets to `angular.json`, then deliberately break them by statically importing a lazy page into `app.routes.ts`. Use `ng build --stats-json` and the esbuild analyzer to find the culprit, fix it, and add a lint rule (with `no-restricted-imports`, Sheriff, or `eslint-plugin-boundaries`) that would have caught it.

## Further Reading

- [Angular: Route loading strategies (lazy loading)](https://angular.dev/guide/routing/loading-strategies)
- [Angular: Defining routes](https://angular.dev/guide/routing/define-routes)
- [Angular: Hierarchical dependency injection](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [Angular: Deferrable views with @defer](https://angular.dev/guide/templates/defer)
- [Angular: Configuring size budgets](https://angular.dev/tools/cli/build#configuring-size-budgets)
- [Angular coding style guide: project structure](https://angular.dev/style-guide)
- [esbuild bundle size analyzer](https://esbuild.github.io/analyze/)

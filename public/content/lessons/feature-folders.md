---
slug: feature-folders
title: "Organise by feature, not by file type"
topic: architecture
kind: pattern
summary: "Group the code that changes together: a feature folder, with core and shared kept small."
tags: [architecture, folders, features, structure]
related: [dependency-rules, lazy-boundaries, pitfall-architecture-smells, route-providers]
---
> **In one line:** Put everything for one capability in one folder. Folders like `components/`, `services/` and `models/` scatter a single change across the whole tree.

## The idea

A type-based layout (`components/`, `services/`, `pipes/`) looks tidy for a week. Then "add a field to the diary entry" touches six folders, and nobody can tell which services belong to which screen.

A **feature-based** layout groups by capability. Everything a feature needs lives together and can be understood, tested and lazy-loaded as a unit.

```tree
src/app | feature-based layout @primary
  core | app-wide singletons: auth, interceptors, layout shell @amber
  shared | reusable UI with no business logic: buttons, pipes @blue
  features | one folder per capability @green
    diary | page, store, API service, routes, models @green
    exercises | its own page, services and routes @green
```

| Layer | Contains | Rule |
|---|---|---|
| `core` | things created once: auth, HTTP interceptors, the shell | imported by the app, not by features |
| `shared` | dumb, reusable UI and utilities | no knowledge of any one feature |
| `features/x` | everything for capability `x` | may use `core` and `shared` |

## See it

```text
features/diary/
  diary.routes.ts
  diary-page.ts
  diary-store.ts
  diary-api.ts
  diary.models.ts
  components/
    set-row.ts
    set-form.ts
```

```typescript
// app.routes.ts: the feature is one lazy boundary
export const routes: Routes = [
  {
    path: 'diary',
    loadChildren: () => import('./features/diary/diary.routes').then((m) => m.DIARY_ROUTES),
  },
];
```

## Go deeper

The test for a good boundary is **deletion**: could you delete the `diary` folder, remove its route, and have the rest of the app still compile? If yes, the feature is cleanly isolated. If other features import its services or models, it is entangled, and the folder name is a lie.

Start small. A new feature can be one folder with a page and a service, and grow components, stores and models inside it as needed. Do not pre-create empty `models/` and `utils/` folders for structure's sake.

Keep `shared` honest. A component moves there only when a **second** feature needs it, and it must not import from any feature. A "shared" folder that imports feature code is a dependency cycle waiting to happen, and it becomes a dumping ground for anything nobody wants to place.

Name files by role and keep them short. The current style guide drops `.component` and `.service` suffixes, so `diary-page.ts` holds `DiaryPage`, and the folder already says the feature.

## Watch out

- A `shared` folder that imports from features.
- Pre-creating empty folders for structure.
- Components for one feature placed in a global `components/` folder.

## Remember

- One folder per feature, with its own page, store, API and routes.
- `core` for singletons, `shared` for dumb reusable UI.
- A feature should be deletable without breaking the rest.

---
slug: project-structure
title: "Project structure"
topic: getting-started
kind: concept
summary: "What each file in a new Angular app is for, and where the app starts."
tags: [workspace, bootstrap, configuration, files]
related: [ng-new, ng-serve-and-build, modern-defaults]
---
> **In one line:** A new app is a handful of files with clear jobs: `main.ts` starts it, `app.config.ts` configures it, and `app.ts` is the first component on screen.

## The idea

Opening a fresh project for the first time, the number of files is overwhelming. It helps to know that only a few matter at the start, and that each has one job.

```text
my-app/
├── src/
│   ├── app/
│   │   ├── app.ts           # root component (class App)
│   │   ├── app.html         # root template
│   │   ├── app.css          # root styles
│   │   ├── app.config.ts    # app-wide providers
│   │   ├── app.routes.ts    # route definitions
│   │   └── app.spec.ts      # root component test
│   ├── index.html           # the one HTML page that hosts the app
│   ├── main.ts              # the entry point
│   └── styles.css           # global styles
├── public/                  # static files: favicon, images
├── angular.json             # CLI workspace configuration
├── package.json             # dependencies and npm scripts
└── tsconfig.json            # TypeScript settings
```

| File | Its job |
|---|---|
| `index.html` | the single page the browser loads; it contains `<app-root>` |
| `main.ts` | starts the app by bootstrapping the root component |
| `app.config.ts` | registers application-wide providers (router, HTTP client) |
| `app.routes.ts` | maps URLs to components |
| `app.ts` | the root component that every other component hangs from |
| `angular.json` | tells the CLI how to build, serve and test each project |

## See it

The entry point is two lines of intent: start the app with this root component and this configuration.

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
```

## Go deeper

There is no root `NgModule` any more. The root component is itself standalone, and anything the whole app needs, such as the router or `HttpClient`, is registered as a **provider** in `app.config.ts`. When a lesson says "add `provideHttpClient()` to your app", this is the file it means.

New projects may also include a few extra providers, such as a global error listener or, since Angular 21, zoneless change detection. They all live in the same `providers` array, so the file doubles as a map of what the app does at startup.

## Watch out

- Putting app-wide setup in a feature component. Providers for the whole app belong in `app.config.ts`.
- Editing `angular.json` by hand when a CLI command exists. Use `ng add`, `ng update` or `ng config` where you can.
- Committing `node_modules/` or `dist/`. The generated `.gitignore` excludes them; keep those lines.

## Remember

- `main.ts` bootstraps the root component with the config from `app.config.ts`.
- App-wide providers (router, HTTP) go in `app.config.ts`; routes go in `app.routes.ts`.
- `angular.json` is how the CLI knows how to build, serve and test.

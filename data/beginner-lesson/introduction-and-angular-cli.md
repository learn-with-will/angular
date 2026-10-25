---
title: "Introduction to Angular & the Angular CLI"
level: "beginner"
estimatedTime: 35
tags:
  - angular
  - angular-cli
  - getting-started
  - frontend
  - typescript
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain what Angular is and what role the **Angular CLI** plays in a project.
- Install the Angular CLI and verify your environment (Node.js + CLI version).
- Scaffold a new application with `ng new` and run it locally with `ng serve`.
- Generate components and services with `ng generate` instead of writing boilerplate by hand.
- Produce a production build with `ng build` and keep a project up to date with `ng update`.

# Why This Concept Exists

A modern web application is more than a few `.ts` files. It needs a TypeScript
compiler, a bundler, a dev server with live reload, a test runner, production
optimization, and a sensible folder structure. Wiring all of that together by
hand is slow, error-prone, and different on every team.

The **Angular CLI** (Command Line Interface) exists to remove that burden. It is
the official tool that scaffolds projects, generates code that follows Angular
conventions, runs a dev server, builds optimized bundles, and upgrades your
dependencies safely. Instead of memorizing build configuration, you run short
commands like `ng new`, `ng serve`, and `ng generate`, and the CLI does the heavy
lifting using settings the Angular team maintains for you.

In short: the CLI lets you focus on *your* features instead of *tooling*.

# Concept Explanation

**Angular** is a TypeScript-based, open-source framework maintained by Google for
building single-page applications (SPAs). It gives you a complete platform:
components, routing, dependency injection, forms, and an HTTP client, all designed
to work together.

The **Angular CLI** is the command-line companion to the framework. It ships as an
npm package (`@angular/cli`) and exposes a single command, `ng`, with many
subcommands. The most important ones are:

- `ng new` — create a new workspace and starter application.
- `ng serve` — build the app and run a local dev server that reloads on every change.
- `ng generate` (alias `ng g`) — generate components, services, directives, pipes, and more.
- `ng build` — produce an optimized production build.
- `ng test` — run unit tests.
- `ng add` — install a library and run its setup automatically.
- `ng update` — upgrade Angular and related packages to a newer version.

A key idea is the **workspace**. When you run `ng new`, the CLI creates a workspace
folder that can hold one or more applications and libraries. Configuration lives in
a single `angular.json` file, so the CLI always knows how to build, serve, and test
each project.

## What modern Angular generates

This course is written for **Angular 20 and later**. Where a later version changed a
default, a short note tells you which version. New projects use modern defaults you
should know about from day one:

- **Standalone components.** New CLI projects have been standalone since Angular 17,
  and since Angular 19 `standalone: true` is implied, so you no longer write it.
  Components declare their own dependencies in an `imports` array, with no `NgModule`
  boilerplate.
- **A new file-naming convention.** Since Angular 20, generated files no longer add
  type suffixes like `.component` or `.service`. Running `ng generate component user`
  creates `user.ts` with a class named `User` (not `user.component.ts` /
  `UserComponent`).
- **Zoneless change detection.** Since Angular 21, new projects don't include
  `zone.js`. Angular schedules change detection from signals and template events
  instead.
- **Vitest as the default unit-test runner.** Since Angular 21, new projects run unit
  tests with Vitest instead of Karma/Jasmine. Existing Karma projects keep working.
- **`OnPush` by default.** Since Angular 22, components use `OnPush` change detection
  unless you choose otherwise.

These defaults matter because older tutorials show different file names and
`NgModule`-based setups. This lesson follows the current conventions.

# Key Terminology

| Term | Meaning |
| --- | --- |
| **Angular** | A TypeScript framework for building web applications. |
| **Angular CLI** | The official command-line tool (`@angular/cli`) for creating, developing, building, and maintaining Angular apps. |
| **`ng`** | The command you type in your terminal to use the CLI. |
| **Workspace** | The root folder created by `ng new`; can contain multiple apps and libraries, configured by `angular.json`. |
| **Scaffolding** | Automatically generating the starting files and folders for a project or feature. |
| **Schematic** | A reusable code generator/transformation that powers `ng generate` and `ng add`. |
| **Standalone component** | A component that declares its own template dependencies in `imports`, without an `NgModule`. |
| **`node_modules`** | Where npm installs your dependencies (never committed to version control). |
| **`dist`** | Where `ng build` writes the compiled, optimized output for deployment. |

# Syntax

The CLI follows a consistent shape:

```bash
ng <command> [name] [options]
```

The commands you will reach for first:

```bash
# Install the CLI globally (one time, on your machine)
npm install -g @angular/cli

# Check your environment and CLI version
ng version

# Create a new application named "my-app"
ng new my-app

# Move into the project, then run the dev server and open the browser
cd my-app
ng serve --open        # short form: ng s -o

# Generate code (component, service, etc.)
ng generate component greeting   # short form: ng g c greeting
ng generate service data         # short form: ng g s data

# Preview what a command will do without writing files
ng generate component greeting --dry-run   # short form: -d

# Build for production
ng build

# Run unit tests
ng test

# Upgrade Angular safely
ng update
```

> **Tip:** Almost every command supports `--help`, e.g. `ng generate --help`. Use it
> whenever you are unsure about the available options.

> **Tip:** `ng new my-app --defaults` skips the questions and accepts the defaults, and
> `--inline-template` and `--minimal` give you a lighter project for experiments. New
> projects don't include `environment.ts` files; run `ng generate environments` when you
> need per-environment settings such as API URLs.

# Real World Analogy

Think of the Angular CLI as a **general contractor building a house to code**.

- `ng new` is the contractor pouring the foundation and framing the house — you get a
  complete, standards-compliant structure instead of a pile of lumber.
- `ng generate` is ordering pre-fab rooms that already match the building code — drop
  in a kitchen or bathroom (a component or service) and it's wired correctly the first time.
- `ng serve` is the *model home* you can walk through while construction continues;
  change a wall color and you see it update instantly.
- `ng build` is the final, inspected, move-in-ready house, optimized and packaged for
  the real world.
- `ng update` is a licensed crew that renovates to the latest code without you tearing
  down walls yourself.

You *could* build everything by hand, but the contractor guarantees the result follows
the rules and saves you enormous time.

# Code Examples

## Example 1 — Create and run your first app

The "hello world" of Angular: create a workspace, start the dev server, and see the
app in the browser.

```bash
# 1. Make sure you have an active LTS version of Node.js installed
#    (Node 22 or 24 at the time of writing).
node -v

# 2. Install the Angular CLI globally (installs the latest stable version).
npm install -g @angular/cli

# 3. Create a new application. The CLI asks a few questions
#    (e.g. stylesheet format, and whether to enable server-side rendering).
ng new my-app

# 4. Enter the project and start the development server.
cd my-app
ng serve --open
```

**What happens:** `ng new` installs dependencies and scaffolds a complete app.
`ng serve` compiles it, starts a local server at `http://localhost:4200/`, and watches
your files — every save reloads the browser automatically. This instant feedback loop
is what makes day-to-day Angular development fast.

## Example 2 — Generate a feature with the CLI

In real projects you constantly add UI and logic. Instead of creating files by hand,
let the CLI scaffold them so they always follow conventions. Here we add a `greeting`
component and a `data` service.

```bash
# Generate a standalone component
ng generate component greeting

# Generate a service for shared logic / data access
ng generate service data
```

With the no-suffix naming of Angular 20+, the component command creates:

```text
src/app/greeting/
├── greeting.ts          # Component class: "Greeting"
├── greeting.html        # Template
├── greeting.css         # Styles
└── greeting.spec.ts     # Unit test
```

The generated component is **standalone** — no `standalone: true` (it's the default)
and no `NgModule`:

```typescript
// src/app/greeting/greeting.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-greeting',
  imports: [],                       // declare template dependencies here
  templateUrl: './greeting.html',
  styleUrl: './greeting.css',
})
export class Greeting {
  message = 'Hello from a generated component!';
}
```

```html
<!-- src/app/greeting/greeting.html -->
<p>{{ message }}</p>
```

To show it on the page, import the `Greeting` class into the root component's `imports`
array and use its selector in the template:

```typescript
// src/app/app.ts (the root component generated by ng new)
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Greeting } from './greeting/greeting';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Greeting],   // <-- add the generated component
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('my-app');
}
```

```html
<!-- src/app/app.html -->
<h1>{{ title() }}</h1>
<app-greeting></app-greeting>
```

**Why this beats hand-coding:** the CLI creates the class, template, styles, and a test
file in one step, all named and configured correctly. You write only the parts unique to
your feature.

## Example 3 — Preview, build, and understand the structure

A few habits make CLI usage safer and more professional.

**Preview before you generate.** Use `--dry-run` (`-d`) to see what a command will create
without touching your project:

```bash
ng generate component features/checkout --dry-run
```

**Build for production, not just serve.** `ng serve` is for development only. For
deployment, run a production build, which optimizes and minifies into `dist/`:

```bash
ng build
# Output is written to: dist/my-app/
```

**Understand the scaffolded structure.** A new standalone workspace (Angular 20+) looks like:

```text
my-app/
├── src/
│   ├── app/
│   │   ├── app.ts            # Root standalone component (class: App)
│   │   ├── app.html          # Root template
│   │   ├── app.css           # Root component styles
│   │   ├── app.config.ts     # Application-wide providers
│   │   ├── app.routes.ts     # Route definitions
│   │   └── app.spec.ts       # Root component test
│   ├── index.html            # The single HTML page that hosts the app
│   ├── main.ts               # Bootstrap entry point
│   └── styles.css            # Global styles
├── public/                   # Static assets (images, favicon, ...)
├── angular.json              # CLI workspace configuration
├── package.json              # Dependencies and npm scripts
└── tsconfig.json             # TypeScript configuration
```

The app boots in `main.ts` via `bootstrapApplication` (the modern, standalone
bootstrap — no root `NgModule`):

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),  // zone.js-free change detection (the default since Angular 21)
    provideRouter(routes),
    // The CLI may include additional providers (e.g. global error listeners).
  ],
};
```

**Why this matters:** knowing where the CLI puts things — and that `app.config.ts` is
where you register application-wide providers — lets you extend the app confidently
instead of guessing.

# Common Mistakes

- **Using the wrong Node.js version.** Angular requires an *active LTS* Node release.
  Old or odd-numbered versions cause cryptic install/build errors. Run `node -v` and use
  a version manager like `nvm` to switch.
- **Global vs. local CLI mismatch.** Your machine has a global CLI, but each project pins
  its own version in `package.json`. Prefer the project's local CLI via npm scripts
  (`npm start`) or `npx ng ...`, and check `ng version` inside the project.
- **Running commands in the wrong place.** `ng new` must run *outside* a workspace (it
  creates one). `ng generate`, `ng serve`, and `ng build` must run *inside* the workspace.
- **Expecting old file names.** Following an older tutorial, you may expect
  `greeting.component.ts` and a class `GreetingComponent`. Angular 20+ drops the suffix by
  default (`greeting.ts`, class `Greeting`). This is normal — not a bug.
- **Upgrading by hand.** Editing version numbers in `package.json` and reinstalling often
  breaks projects. Use `ng update`, which migrates your code with schematics.
- **Confusing `ng serve` with `ng build`.** `ng serve` is an in-memory dev server with no
  optimized output; never deploy it. Use `ng build` for production artifacts in `dist/`.
- **Committing generated folders.** `node_modules/` and `dist/` don't belong in version
  control. The generated `.gitignore` already excludes them — don't remove those entries.

# Best Practices

- **Let the CLI scaffold.** Use `ng generate` for components, services, directives, and
  pipes so files are named and structured consistently.
- **Use `--dry-run` first** to preview generation before running it for real.
- **Keep Node on an LTS release** and pin it per project (e.g. `.nvmrc` or `volta`) so the
  whole team uses the same runtime.
- **Upgrade with `ng update`,** not manual `package.json` edits. Run it one major version at
  a time and read the migration output.
- **Install libraries with `ng add`** when available (e.g. `ng add @angular/material`); it
  installs *and* configures via a schematic.
- **Run the local CLI** through npm scripts (`npm start`, `npm run build`) so everyone uses
  the project's pinned version.
- **Embrace standalone, zoneless conventions** for new apps rather than reintroducing
  `NgModule` boilerplate.
- **Learn `--help`.** Every command documents its options — use it instead of guessing flags.

# Summary

- Angular is a TypeScript framework for building single-page web applications.
- The Angular CLI (`@angular/cli`, invoked as `ng`) is the official tool for creating,
  developing, building, and maintaining Angular apps.
- Install it with `npm install -g @angular/cli` and verify with `ng version`; Angular
  requires an active LTS version of Node.js.
- `ng new` scaffolds a workspace and starter app; `ng serve` runs a live-reloading dev
  server at `http://localhost:4200/`.
- `ng generate` (alias `ng g`) creates components, services, and more so you avoid
  boilerplate.
- `ng build` produces an optimized bundle in `dist/`; never deploy `ng serve`.
- `ng update` upgrades Angular safely via migrations; `ng add` installs and configures
  libraries.
- Modern Angular defaults to **standalone components**, **no `.component`/`.service` file
  suffixes** (Angular 20+), **zoneless change detection** and **Vitest** as the test runner
  (Angular 21+), and **`OnPush`** change detection (Angular 22+).

# Flash Cards

- **Q:** What is the Angular CLI and how do you invoke it? **A:** The official command-line tool (`@angular/cli`) for creating, developing, building, and maintaining Angular apps, invoked with `ng`.
- **Q:** Which command creates a new workspace, and where must it run? **A:** `ng new <name>`, run *outside* an existing workspace (it creates one).
- **Q:** What does `ng serve` do, and what is the default URL? **A:** Builds and serves the app with auto-reload at `http://localhost:4200/`; add `--open` to open the browser.
- **Q:** As of Angular 20+, what does `ng generate component greeting` produce? **A:** `greeting.ts` (+ `.html`, `.css`, `.spec.ts`) with a class named `Greeting` — no `.component` suffix.
- **Q:** Why use `ng update` instead of editing `package.json` by hand? **A:** It runs migration schematics that adjust your code for breaking changes, avoiding a broken, inconsistent project.

# Exercises

1. **Easy.** Install the CLI globally and run `ng version`. Create an app with
   `ng new cli-practice`, move into it, and run `ng serve --open`. Confirm the welcome page
   loads at `http://localhost:4200/`.
2. **Medium.** Inside `cli-practice`, generate a `welcome-card` component with
   `ng generate component welcome-card`. Add a `title` property, display it with
   `{{ title }}`, then import the component into the root `App` and render its selector.
3. **Challenging.** Preview with `ng generate component features/profile --dry-run`, then run
   it for real. Generate a service with `ng generate service services/user`, inject it into
   the `profile` component (constructor or `inject()`), and display a hard-coded user object.
   Finally run `ng build` and inspect `dist/`; explain how its output differs from `ng serve`.

# Further Reading

- Angular — Local setup & installation: https://angular.dev/tools/cli/setup-local
- Angular CLI overview and command reference: https://angular.dev/tools/cli
- `ng generate` documentation: https://angular.dev/cli/generate
- Angular — Version compatibility (Node.js / TypeScript / RxJS): https://angular.dev/reference/versions
- Angular Style Guide (naming and structure conventions): https://angular.dev/style-guide
- Components essentials (standalone components): https://angular.dev/guide/components

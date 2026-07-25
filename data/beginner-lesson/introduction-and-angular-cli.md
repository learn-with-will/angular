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

After completing this lesson, you will be able to:

- Explain what Angular is and what role the **Angular CLI** plays in a project.
- Install the Angular CLI and verify your environment (Node.js + CLI version).
- Scaffold a new Angular application with `ng new` and run it locally with `ng serve`.
- Generate components and services using `ng generate` instead of writing boilerplate by hand.
- Produce a production build with `ng build` and keep a project up to date with `ng update`.

# Why This Concept Exists

A modern web application is more than a few `.ts` files. It needs a TypeScript compiler, a bundler, a dev server with live reload, a test runner, optimization for production, and a sensible folder structure. Wiring all of that together by hand is slow, error-prone, and different on every team.

The **Angular CLI** (Command Line Interface) exists to remove that burden. It is the official tool that scaffolds projects, generates code that follows Angular conventions, runs a development server, builds optimized bundles, and upgrades your dependencies safely. Instead of memorizing build configuration, you run short commands like `ng new`, `ng serve`, and `ng generate`, and the CLI does the heavy lifting using settings the Angular team maintains for you.

In short: the CLI lets you focus on *your* features instead of *tooling*.

# Concept Explanation

**Angular** is a TypeScript-based, open-source framework maintained by Google for building single-page applications (SPAs). It gives you a complete platform: components, routing, dependency injection, forms, and an HTTP client, all designed to work together.

The **Angular CLI** is the command-line companion to the framework. It is installed as an npm package (`@angular/cli`) and exposes a single command, `ng`, with many subcommands. The most important ones are:

- `ng new` — create a new workspace and starter application.
- `ng serve` — build the app and run a local dev server that reloads on every change.
- `ng generate` (alias `ng g`) — generate components, services, directives, pipes, and more.
- `ng build` — produce an optimized production build.
- `ng test` — run unit tests.
- `ng add` — install a library and run its setup automatically.
- `ng update` — upgrade Angular and related packages to a newer version.

A key idea is the **workspace**. When you run `ng new`, the CLI creates a workspace folder that can hold one or more applications and libraries. Configuration for everything lives in a single `angular.json` file, so the CLI always knows how to build, serve, and test each project.

### What modern Angular generates

As of **Angular 22** (the current stable release as of June 2026), new projects use modern defaults that you should know about from day one:

- **Standalone components by default.** You no longer need `NgModule` boilerplate to organize most apps. Components declare their own dependencies in an `imports` array. (Standalone became the default in Angular 19.)
- **Zoneless change detection by default** in new projects, which removes the `zone.js` dependency and relies on Angular's modern reactivity (signals) for better performance.
- **A new file-naming convention.** Since Angular 20, generated files no longer add type suffixes like `.component` or `.service`. Running `ng generate component user` now creates `user.ts` with a class named `User` (not `user.component.ts` / `UserComponent`).
- **Vitest as the default unit test runner** for new projects (it replaced Karma/Jasmine as the default in Angular 22).

These defaults matter because tutorials written for older Angular versions will show different file names and `NgModule`-based setups. This lesson follows the current conventions.

# Key Terminology

- **Angular**: A TypeScript framework for building web applications.
- **Angular CLI**: The official command-line tool (`@angular/cli`) for creating, developing, building, and maintaining Angular apps.
- **`ng`**: The command you type in your terminal to use the CLI.
- **Workspace**: The root project folder created by `ng new`; it can contain multiple apps and libraries and is configured by `angular.json`.
- **Scaffolding**: Automatically generating the starting files and folders for a project or feature.
- **Schematic**: A reusable code generator/transformation that powers commands like `ng generate` and `ng add`.
- **Standalone component**: A component that declares its own template dependencies in `imports`, without needing an `NgModule`.
- **`node_modules`**: The folder where npm installs your project's dependencies (never committed to version control).
- **`dist`**: The folder where `ng build` writes the compiled, optimized output for deployment.

# Syntax Overview

The CLI follows a consistent shape:

```bash
ng <command> [name] [options]
```

The most important commands you will use early on:

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

> Tip: Almost every command supports `--help`, for example `ng generate --help`. Use it whenever you are unsure about available options.

# Real World Analogy

Think of the Angular CLI as a **general contractor building a house to code**.

- `ng new` is the contractor pouring the foundation and putting up the frame — you get a complete, standards-compliant structure instead of a pile of lumber.
- `ng generate` is ordering pre-fabricated rooms that already match the building code — drop in a kitchen or bathroom (a component or service) and it's wired correctly the first time.
- `ng serve` is the *model home* you can walk through while construction continues; change a wall color and you see it update instantly.
- `ng build` is the final, inspected, move-in-ready house, optimized and packaged for the real world.
- `ng update` is a licensed crew that renovates your house to the latest code without you having to tear down walls yourself.

You *could* build everything by hand, but the contractor guarantees the result follows the rules and saves you enormous time.

# Examples

## Example 1 — Basic: Create and run your first app

This is the "hello world" of Angular. We create a workspace, start the dev server, and see the app in the browser.

```bash
# 1. Make sure you have an active LTS version of Node.js installed.
#    Angular requires an active LTS Node release (Node 22 or 24 at the time of writing).
node -v

# 2. Install the Angular CLI globally (installs the latest stable version).
npm install -g @angular/cli

# 3. Create a new application. The CLI will ask a few questions
#    (e.g. stylesheet format, and whether to enable server-side rendering).
ng new my-app

# 4. Enter the project and start the development server.
cd my-app
ng serve --open
```

**What happens:** `ng new` installs dependencies and scaffolds a complete app. `ng serve` compiles it, starts a local server at `http://localhost:4200/`, and watches your files — every time you save, the browser reloads automatically. This instant feedback loop is what makes day-to-day Angular development fast.

## Example 2 — Real-world: Generate a feature with the CLI

In real projects you constantly add new pieces of UI and logic. Instead of creating files by hand, you let the CLI scaffold them so they always follow conventions. Here we add a `greeting` component and a `data` service.

```bash
# Generate a standalone component
ng generate component greeting

# Generate a service for shared logic / data access
ng generate service data
```

The component command (using Angular 22's no-suffix naming) creates a folder like this:

```text
src/app/greeting/
├── greeting.ts          # Component class: "Greeting"
├── greeting.html        # Template
├── greeting.css         # Styles
└── greeting.spec.ts     # Unit test
```

The generated component is a **standalone** component — notice there is no `standalone: true` (it is the default) and no `NgModule` involved:

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
  // Component logic goes here.
  message = 'Hello from a generated component!';
}
```

```html
<!-- src/app/greeting/greeting.html -->
<p>{{ message }}</p>
```

To show it on the page, import the `Greeting` class into the root component's `imports` array and use its selector in the template:

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

**Why this is better than hand-coding:** the CLI creates the class, template, styles, and a test file in one step, all named and configured correctly. You only write the parts that are unique to your feature.

## Example 3 — Best practice: Preview, build, and understand the structure

A few habits make CLI usage safer and more professional.

**Preview before you generate.** Use `--dry-run` (`-d`) to see what files a command will create without touching your project:

```bash
ng generate component features/checkout --dry-run
```

**Build for production, not just serve.** `ng serve` is for development only. For deployment, run a production build, which optimizes and minifies your code into the `dist/` folder:

```bash
ng build
# Output is written to: dist/my-app/
```

**Understand the scaffolded structure.** A new standalone Angular 22 workspace looks like this:

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

The app is started in `main.ts` using `bootstrapApplication` (the modern, standalone bootstrap — no root `NgModule`):

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
    provideZonelessChangeDetection(),  // modern, zone.js-free change detection
    provideRouter(routes),
    // The CLI may include additional providers (e.g. global error listeners).
  ],
};
```

**Why this matters:** knowing where the CLI puts things — and that `app.config.ts` is where you register application-wide providers — means you can extend the app confidently instead of guessing.

# Common Mistakes

- **Using the wrong Node.js version.** Angular requires an *active LTS* version of Node. Old or odd-numbered Node versions cause cryptic install/build errors. Run `node -v` and use a version manager like `nvm` to switch.
- **Global vs. local CLI mismatch.** Your machine has a global CLI, but each project pins its own CLI version in `package.json`. If they differ a lot, commands behave unexpectedly. Prefer running the project's local CLI via npm scripts (e.g. `npm start`) or `npx ng ...`, and check `ng version` inside the project.
- **Running commands in the wrong place.** `ng new` must be run *outside* a workspace (it creates one). Commands like `ng generate`, `ng serve`, and `ng build` must be run *inside* the workspace folder.
- **Expecting old file names.** If you follow an older tutorial, you may expect `greeting.component.ts` and a class called `GreetingComponent`. Angular 20+ drops the suffix by default (`greeting.ts`, class `Greeting`). This is normal — not a bug.
- **Upgrading by hand.** Editing version numbers in `package.json` and reinstalling often breaks projects. Use `ng update`, which migrates your code with schematics.
- **Confusing `ng serve` with `ng build`.** `ng serve` is an in-memory dev server with no optimized output; never deploy it. Use `ng build` for production artifacts in `dist/`.
- **Committing generated folders.** `node_modules/` and `dist/` should not be in version control. The CLI's generated `.gitignore` already excludes them — don't remove those entries.

# Best Practices

- **Let the CLI scaffold.** Use `ng generate` for components, services, directives, and pipes so files are named and structured consistently.
- **Use `--dry-run` first.** Preview generation and other destructive commands before running them for real.
- **Keep Node on an LTS release** and pin it per project (e.g. with `.nvmrc` or `volta`) so your whole team uses the same runtime.
- **Upgrade with `ng update`,** not manual `package.json` edits. Run it one major version at a time and read the migration output.
- **Install libraries with `ng add`** when available (e.g. `ng add @angular/material`); it installs *and* configures the package via a schematic.
- **Run the local CLI** through npm scripts (`npm start`, `npm run build`) so everyone uses the project's pinned version.
- **Embrace standalone components.** For new apps, follow the default standalone, zoneless conventions rather than reintroducing `NgModule` boilerplate.
- **Learn `--help`.** Every command documents its options; use it instead of guessing flags.

# Summary

- Angular is a TypeScript framework for building single-page web applications.
- The Angular CLI (`@angular/cli`, invoked as `ng`) is the official tool for creating, developing, building, and maintaining Angular apps.
- Install it with `npm install -g @angular/cli` and verify with `ng version`; Angular requires an active LTS version of Node.js.
- `ng new` scaffolds a workspace and starter app; `ng serve` runs a live-reloading dev server at `http://localhost:4200/`.
- `ng generate` (alias `ng g`) creates components, services, and more so you avoid writing boilerplate by hand.
- `ng build` produces an optimized production bundle in `dist/`; never deploy `ng serve`.
- `ng update` upgrades Angular safely using migrations; `ng add` installs and configures libraries.
- Modern Angular (22) defaults to **standalone components**, **zoneless change detection**, **no `.component`/`.service` file suffixes**, and **Vitest** as the test runner.
- The workspace is configured by a single `angular.json` file, and the app boots from `main.ts` via `bootstrapApplication`.
- Use `--dry-run` to preview commands and `--help` to discover options.

# Flash Cards

Q: What is the Angular CLI and how do you invoke it?
A: It is the official command-line tool (`@angular/cli`) for creating, developing, building, and maintaining Angular apps. You invoke it with the `ng` command.

Q: Which command creates a new Angular workspace and starter app, and where must it be run?
A: `ng new <name>`. It must be run *outside* an existing workspace, because it creates a new one.

Q: What does `ng serve` do, and what is the default local URL?
A: It builds the app and runs a development server that auto-reloads on file changes, serving the app at `http://localhost:4200/`. Add `--open` (`-o`) to open the browser automatically.

Q: As of Angular 20+, what file and class does `ng generate component greeting` produce?
A: It creates `greeting.ts` (plus `.html`, `.css`, and `.spec.ts`) with a class named `Greeting` — no `.component` suffix and no `Component` suffix on the class.

Q: Why should you use `ng update` instead of editing version numbers in `package.json`?
A: `ng update` runs migration schematics that automatically adjust your code for breaking changes, whereas manual edits often leave the project in a broken, inconsistent state.

# Exercises

**Easy.** Install the Angular CLI globally, then run `ng version`. Create a new app called `cli-practice` with `ng new cli-practice`, move into it, and start it with `ng serve --open`. Confirm the welcome page loads in your browser at `http://localhost:4200/`.

**Medium.** Inside your `cli-practice` app, generate a standalone component named `welcome-card` using `ng generate component welcome-card`. Add a `title` property to its class, display it in the template with interpolation (`{{ title }}`), then import the component into the root `App` component and render its selector so the card appears on the page.

**Challenging.** Use `ng generate component features/profile --dry-run` to preview the output, then run it for real. Generate a `user` service with `ng generate service services/user`. Inject the service into the `profile` component's constructor (or with `inject()`), and have the service return a hard-coded user object that the component displays. Finally, run `ng build` and inspect the contents of the `dist/` folder. Explain in your own words how the `dist/` output differs from what `ng serve` provides.

# Further Reading

- Angular — Local setup & installation: https://angular.dev/tools/cli/setup-local
- Angular CLI overview and command reference: https://angular.dev/tools/cli
- `ng generate` documentation: https://angular.dev/cli/generate
- Angular — Version compatibility (Node.js / TypeScript / RxJS): https://angular.dev/reference/versions
- Angular — Versioning and releases: https://angular.dev/reference/releases
- Angular Style Guide (naming and structure conventions): https://angular.dev/style-guide
- Components essentials (standalone components): https://angular.dev/guide/components

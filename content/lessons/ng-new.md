---
slug: ng-new
title: "ng new"
topic: getting-started
kind: tool
summary: "Create a new Angular workspace and starter app with one command."
tags: [cli, setup, workspace, node]
related: [ng-serve-and-build, project-structure, modern-defaults, what-is-angular]
---
> **In one line:** `ng new my-app` scaffolds a complete, ready-to-run Angular project: dependencies installed, folders laid out, and sensible defaults chosen.

## The idea

A real web app needs a compiler, a bundler, a dev server with live reload, a test runner and a folder layout. Wiring that by hand is slow and comes out different on every team. The **Angular CLI** (command-line interface) removes the work: it ships as the npm package `@angular/cli` and gives you one command, `ng`, with subcommands for everything you do day to day.

`ng new` is the first one you use. It creates a **workspace**, a folder that can hold one or more applications and libraries, with all its configuration in a single `angular.json` file, so the CLI always knows how to build, serve and test each project. It asks a few questions (stylesheet format, whether to enable server-side rendering) and then installs the dependencies.

Think of a general contractor building to code: you get a complete, standards-compliant house instead of a pile of lumber.

| Flag | What it does |
|---|---|
| `--defaults` | skip the questions and accept the defaults |
| `--minimal` | a lighter project for experiments |
| `--inline-template` | put templates inside the component class |
| `--dry-run` (`-d`) | show what would be created, write nothing |

## See it

```bash
# 1. Install the CLI once, on your machine
npm install -g @angular/cli

# 2. Check your environment
ng version

# 3. Create the app (answer the prompts, or add --defaults)
ng new my-app

# 4. Run it
cd my-app
ng serve --open
```

`ng new` must run *outside* a workspace, because it creates one. Every other command (`ng serve`, `ng generate`, `ng build`) runs *inside* it.

## Go deeper

Angular needs an **active LTS** release of Node.js (Node 22 or 24 at the time of writing). Odd-numbered or very old versions cause cryptic install and build errors. A version manager such as `nvm`, or a pinned `.nvmrc` file, keeps the whole team on the same runtime.

The CLI you install globally and the CLI a project uses are separate. Each project pins its own version in `package.json`, so prefer the project's copy through npm scripts or `npx`:

```bash
npm start              # runs the project's own ng serve
npx ng version         # shows the project's CLI version
```

## Watch out

- Running `ng new` inside an existing workspace creates a confusing nested project. Run it from a plain folder.
- New projects do not include `environment.ts` files. Run `ng generate environments` when you need per-environment settings such as API URLs.
- A wrong Node version is the most common reason a fresh install fails. Check `node -v` before anything else.

## Remember

- `ng new <name>` creates a workspace, installs dependencies and scaffolds a starter app.
- Use an active LTS Node.js, and run the project's own CLI through npm scripts.
- Preview with `--dry-run`, skip the prompts with `--defaults`.

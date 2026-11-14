---
slug: ng-serve-and-build
title: "ng serve and ng build"
topic: getting-started
kind: tool
summary: "Run a live-reloading dev server while you work, and build optimized files to deploy."
tags: [cli, dev-server, build, deploy]
related: [ng-new, project-structure, ng-generate]
---
> **In one line:** `ng serve` is for working: it runs the app locally and reloads on every save. `ng build` is for shipping: it writes optimized files to `dist/`.

## The idea

Two commands cover almost all of your daily CLI use, and they do very different jobs. Mixing them up is a classic beginner mistake, so it is worth seeing them side by side.

`ng serve` compiles the app, starts a local server at `http://localhost:4200/`, and watches your files. Every time you save, the browser reloads with the change, which makes the feedback loop fast. The result lives in memory: nothing useful is written to disk, and the code is not optimized.

`ng build` compiles the app once, optimizes and minifies it, and writes the result to `dist/<project>/`. Those static files are what you upload to a host.

| | `ng serve` | `ng build` |
|---|---|---|
| Purpose | develop | deploy |
| Output | in memory | files in `dist/` |
| Optimized and minified | no | yes (production by default) |
| Reloads on save | yes | no |
| Deploy it? | never | yes |

## See it

```bash
# While you work
ng serve --open        # short form: ng s -o
ng serve --port 4300   # use another port if 4200 is busy

# When you are ready to ship
ng build
# -> dist/my-app/browser/  (upload this folder)
```

A build also checks sizes. The default budgets warn you when the initial bundle grows past a limit, which is an early nudge to keep the first load light.

## Go deeper

`ng build` defaults to the **production** configuration. When you need to inspect what the build produced, ask for the development configuration, which skips minification and keeps source maps so stack traces point at your code:

```bash
ng build --configuration development
```

The production build also enforces **budgets** from `angular.json`: a warning when the initial bundle passes a size, an error when it passes a higher one. They are cheap insurance against a page that quietly gets slower with every dependency you add.

Static hosts such as GitHub Pages have no server-side URL rewriting, so a direct visit to `/lesson/signal` would return a 404. A common fix is to copy `index.html` to `404.html` after the build, so the Angular router takes over and renders the route:

If the site also lives under a sub-path (for example `https://user.github.io/my-repo/`), build with a matching base href so assets resolve:

```bash
ng build --base-href "/my-repo/"
cp dist/my-app/browser/index.html dist/my-app/browser/404.html
```

## Watch out

- Never deploy what `ng serve` shows. It is unoptimized and exists only in memory. Always run `ng build`.
- The production build is stricter than the dev server. A type error or exceeded budget can fail the build even though `ng serve` ran happily.
- `dist/` and `node_modules/` do not belong in version control. The generated `.gitignore` already excludes them.

## Remember

- `ng serve` is the dev loop: live reload, in memory, never deployed.
- `ng build` makes the optimized files in `dist/` that you actually ship.
- Single-page apps on static hosts need a `404.html` fallback and the right base href.

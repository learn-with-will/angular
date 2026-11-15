---
slug: ng-update-and-add
title: "ng update and ng add"
topic: getting-started
kind: tool
summary: "Upgrade Angular and install libraries with commands that also fix and configure your code."
tags: [cli, upgrade, schematics, dependencies]
related: [ng-new, ng-generate, modern-defaults]
---
> **In one line:** `ng update` upgrades Angular and migrates your code; `ng add` installs a library and runs its setup. Both do more than `npm install`.

## The idea

Two chores come up in every project's life: moving to a newer Angular, and adding a library such as a UI kit. You could do both with `npm install` and a lot of manual edits. The CLI has commands that do the edits for you, using **schematics**, small programs that change your files.

`ng update` raises the versions of Angular and related packages, then runs **migrations** that rewrite code affected by breaking changes. A renamed API gets renamed everywhere in your project, not just in `package.json`.

`ng add` installs a package and then runs that package's setup schematic. For a library such as Angular Material it adds the dependency, registers its providers, and wires up its styles, so you are ready to use it straight away.

| Task | Command | What you get |
|---|---|---|
| Upgrade Angular | `ng update @angular/core @angular/cli` | new versions plus code migrations |
| See what can be updated | `ng update` | a list, with no changes |
| Add a library | `ng add @angular/material` | installed and configured |
| Install without setup | `npm install some-lib` | the package only |

## See it

```bash
# Before: edit version numbers in package.json by hand, reinstall, and hope
npm install @angular/core@latest

# After: let the CLI upgrade and migrate your code
ng update @angular/core @angular/cli

# Add a library and its configuration in one step
ng add @angular/material
```

Commit your work first. A clean working tree means you can see exactly what the migrations changed, and undo it if you need to.

## Go deeper

Upgrade **one major version at a time**. Going from 18 straight to 21 skips the intermediate migrations that those versions rely on, which is how projects end up with subtle breakage.

A good rhythm for each step:

```bash
git status                      # start clean
ng update @angular/core@20 @angular/cli@20
npm test && npm run build       # check it still works
git commit -am "Update to Angular 20"
```

The official update guide at angular.dev lists any manual steps for each version, and `ng update` prints the same hints in the terminal. Read the output rather than skipping past it.

## Watch out

- Editing versions in `package.json` and reinstalling. It skips the code migrations and often breaks the build.
- Updating with uncommitted changes. You cannot tell your edits from the migration's.
- Jumping several major versions in one go. Take each major version in turn and test between them.

## Remember

- `ng update` upgrades packages and migrates your code; `ng add` installs and configures a library.
- Commit first, update one major version at a time, and test between steps.
- Read the command output: it lists any manual steps the migration could not do.

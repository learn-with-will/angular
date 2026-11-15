---
slug: modern-defaults
title: "Modern Angular defaults"
topic: getting-started
kind: concept
summary: "What a new project gives you today, and which version changed each default."
tags: [standalone, zoneless, vitest, onpush, versions]
related: [ng-new, ng-generate, project-structure]
---
> **In one line:** New Angular projects start with standalone components, no file suffixes, zoneless change detection, Vitest and `OnPush`, so older tutorials may look different from what you generate.

## The idea

Angular's defaults have moved a long way in a few releases. A guide written in 2022 shows `NgModule`s, `zone.js` and Karma, and if you follow it in a new project, nothing quite matches. Knowing what changed, and since which version, saves a lot of confusion.

| Default | Since | What it replaced |
|---|---|---|
| Standalone components | 17 for new projects; `standalone: true` implied since 19 | `NgModule` declarations |
| No type suffix in file names (`user.ts`, class `User`) | 20 | `user.component.ts`, `UserComponent` |
| Zoneless change detection, no `zone.js` | 21 | `zone.js` patching every async API |
| Vitest as the unit-test runner | 21 | Karma and Jasmine |
| `OnPush` change detection | 22 | `Default`, which re-checks the whole tree |

This course is written for Angular 20 and later and follows these conventions. Where a default is newer than 20, a note gives the version, so you know what applies to your project.

## See it

The same component under the old and the new conventions:

```typescript
// Before: user.component.ts, with an NgModule and zone-era habits
@Component({
  selector: 'app-user',
  standalone: true,
  templateUrl: './user.component.html',
})
export class UserComponent { }

// After: user.ts, standalone is implied
@Component({
  selector: 'app-user',
  templateUrl: './user.html',
})
export class User { }
```

Nothing about *what the component does* changed. The ceremony around it shrank.

## Go deeper

Each default is a bet on the same direction: less boilerplate and finer-grained updates.

- **Standalone** means a component lists its own dependencies in `imports`, so you can read one file and see everything it uses.
- **Zoneless** works because signals tell Angular exactly what changed. Without `zone.js`, a plain field assigned in a `setTimeout` will not refresh the view, so state that the screen shows belongs in a signal.
- **Vitest** is fast, and the same `describe`, `it` and `expect` style carries over from Jasmine.

Existing projects keep working. A Karma-based project does not have to migrate, and upgrading is done with `ng update`, one major version at a time.

## Watch out

- Following an older tutorial verbatim. File names, `standalone: true` and `NgModule` examples are the usual mismatches, not bugs in your setup.
- Assuming your project has a default just because the current docs mention it. Check the version in `package.json` against the table above.

## Remember

- Standalone, suffix-free names, zoneless, Vitest and `OnPush` are today's defaults, each added in a specific version.
- Existing projects keep their old setup until you migrate them.
- When a guide disagrees with what the CLI generated, check the version before suspecting your project.

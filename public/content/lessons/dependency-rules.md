---
slug: dependency-rules
title: "Dependency rules between layers"
topic: architecture
kind: concept
summary: "Features may use core and shared. Features must not import each other. Move shared code down, never sideways."
tags: [architecture, dependencies, boundaries, imports]
related: [feature-folders, lazy-boundaries, pitfall-architecture-smells, facade-pattern]
---
> **In one line:** Dependencies point one way: features depend on `shared` and `core`, never on each other. If two features need the same code, move it down a layer.

## The idea

Folders do not enforce anything. The rules do, and they are what keep a growing codebase from becoming a web where every change risks everything.

| From | May import | Must not import |
|---|---|---|
| `features/diary` | `shared`, `core` | `features/exercises` |
| `shared` | other `shared` code, libraries | any feature, `core` services |
| `core` | libraries, its own files | any feature |

Why forbid feature-to-feature imports? They make **hidden coupling**. If `diary` imports a component from `exercises`, then changing `exercises` can break `diary`, the two cannot be lazy-loaded independently, and a static import pulls one feature's code into the other's bundle.

## See it

The situation: the diary needs the exercise picker, which lives in `features/exercises`.

| Option | Verdict |
|---|---|
| import `ExercisePicker` from `features/exercises` inside diary | breaks the rule; couples the features |
| copy the component into diary | duplicates; the two copies drift |
| **move the picker into `shared`**, used by both | correct: shared code moves down |
| expose a small public API from `exercises` and import only that | acceptable when it is genuinely that feature's business |

```typescript
// Before: sideways import
import { ExercisePicker } from '../exercises/exercise-picker';

// After: the picker is dumb UI, so it lives in shared
import { ExercisePicker } from '../../shared/exercise-picker/exercise-picker';
```

## Go deeper

Make the rules enforceable, not aspirational. An ESLint rule such as `@nx/enforce-module-boundaries` or `eslint-plugin-boundaries` fails the build when a feature imports another feature. A convention that depends on code review being thorough will be broken within a month.

Features can still *cooperate*, just not through imports of internals. Use a **facade or shared service in `core`** for cross-feature state (the current user, the cart), routes and navigation to link between them, and events or signals owned by a lower layer. The dependency stays pointing downwards.

If a "shared" component needs to know about a feature, it was never shared. Pass what it needs through inputs and outputs, so it stays dumb. The moment it injects a feature store, it has become part of that feature.

Barrel files (`index.ts`) help define a feature's public surface, but a barrel that re-exports everything hides the cost: importing one symbol from a large barrel can pull the whole feature into the bundle.

Here is a boundary rule written as configuration, so the build enforces it:

```json
{
  "rules": {
    "@nx/enforce-module-boundaries": ["error", {
      "depConstraints": [
        { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:shared", "type:core"] },
        { "sourceTag": "type:shared", "onlyDependOnLibsWithTags": ["type:shared"] }
      ]
    }]
  }
}
```

Without Nx, `eslint-plugin-boundaries` or a plain `no-restricted-imports` pattern on `**/features/*/**` achieves the same thing. Start with the strictest rule that passes today, and tighten it as you clean up, so the codebase can only get better.

## Watch out

- Importing another feature's internals "just this once".
- A shared component that injects a feature store.
- Large barrels that re-export everything.

## Remember

- Features use `shared` and `core`, never each other.
- Shared code moves down a layer, not sideways.
- Enforce the rules with a lint rule, not with hope.

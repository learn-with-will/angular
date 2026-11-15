---
slug: mfe-integration-contract
title: "The integration contract and versioned deploys"
topic: architecture
kind: pattern
summary: "A small typed contract between host and piece, isolated styles, and immutable versioned URLs keep releases independent."
tags: [architecture, micro-frontends, versioning, contract]
related: [angular-elements, micro-frontends-when, dependency-rules, http-transfer-cache]
---
> **In one line:** Independence depends on a small, explicit contract and on deploying each release to a versioned URL, so hosts and pieces can change without breaking each other.

## The idea

A host loads a piece at runtime, so neither is compiled against the other. Without discipline, a change in one silently breaks the other in production. Three habits prevent that:

| Habit | Why |
|---|---|
| a **typed contract** of inputs and events, shared as a types package | both sides agree on names and shapes at build time |
| **style isolation** with Shadow DOM | the host's CSS cannot restyle the piece, and vice versa |
| **versioned, immutable URLs** | `/mfe/exercise-form/1.4.0/main.js` never changes after release |

The versioned URL is the one people skip. If every release overwrites `/mfe/exercise-form/main.js`, browsers and CDNs may cache the old file, a bad release hits every host instantly, and there is nothing to roll back *to*.

```sequence
actor host: Host app
actor reg: Version manifest
actor cdn: CDN
host -> reg: which version of `exercise-form`?
reg --> host: `1.4.0`
host -> cdn: load `/mfe/exercise-form/1.4.0/main.js`
note cdn: Immutable, cached for a year @green
```

## See it

```typescript
// contract.ts: published as a small types-only package
export interface ExerciseFormInputs {
  exercise: string;
  maxReps: number;
}
export interface ExerciseSavedDetail {
  exercise: string;
  reps: number;
}
export const EXERCISE_SAVED = 'saved';
```

```typescript
// host: load the pinned version at runtime
const manifest = await fetch('/mfe/manifest.json').then((r) => r.json() as Promise<Record<string, string>>);
await import(/* @vite-ignore */ `/mfe/exercise-form/${manifest['exercise-form']}/main.js`);

form.addEventListener(EXERCISE_SAVED, (e) => {
  const detail = (e as CustomEvent<ExerciseSavedDetail>).detail;
  diary.add(detail);
});
```

## Go deeper

Treat the contract like a public API. Adding an optional input is safe; renaming or removing one is a breaking change that needs a new **major** version, and the host should upgrade deliberately. A contract test, run in each pipeline against the other side's current version, catches a mismatch before users do.

Pinning in a manifest lets the host roll forward or **back** by editing one file. Because every version stays online at its own URL, rollback is instant and needs no rebuild, and `Cache-Control: immutable` on the versioned files makes loading fast.

Avoid sharing runtime state through globals such as `window`. Communicate through the contract (inputs, events) or a tiny shared service with a documented interface. The less pieces know about each other, the more genuinely independent they stay.

Shipping a separate Angular per piece costs bundle size. If versions can be kept aligned, share Angular with the host (for example with native federation) to save the duplicate download, and accept the coupling that comes with it.

## Watch out

- Overwriting a fixed file path on each release.
- Passing data through `window` globals.
- Changing a contract without a version bump.

## Remember

- A small typed contract, shared as a package.
- Shadow DOM isolates styles; versioned URLs enable rollback.
- Treat the contract as a public API with semantic versioning.

---
slug: micro-frontends-when
title: "When micro frontends are worth it"
topic: architecture
kind: concept
summary: "Splitting a frontend by team and business capability solves an organisational problem. For one team, it adds cost."
tags: [architecture, micro-frontends, teams, trade-offs]
related: [angular-elements, mfe-integration-contract, feature-folders, dependency-rules]
---
> **In one line:** Micro frontends let independent teams build and deploy parts of one UI separately. That is an organisational benefit, and it carries real technical cost.

## The idea

A **micro frontend** is a part of a user interface that a team builds, tests and deploys on its own, then composes with others into one product. The reason is people, not technology: when several teams must release independently without coordinating every deploy, a single frontend becomes the bottleneck.

| Good reasons | Bad reasons |
|---|---|
| several teams that must release independently | "it is modern" or "it scales" |
| a large product with clear business areas | one team of five developers |
| gradually replacing a legacy application | avoiding the work of a good folder structure |
| different parts with genuinely different release cadences | wanting to mix frameworks for fun |

Slice **vertically, by business capability**: "exercise logging" or "checkout", each owning its UI, logic and data access. Slicing horizontally (one team owns all buttons, another all forms) recreates the coordination problem, since every feature needs every team.

## See it

```tree
Host shell | routing, header, auth, loads the pieces @primary
  Exercise form | team A, own repo and deploy @green
  Diary history | team B, own repo and deploy @green
  Reports | team C, own repo and deploy @green
```

Compare the costs honestly:

| Cost | What it looks like |
|---|---|
| duplicated dependencies | each piece may ship its own Angular, unless shared |
| inconsistent UX | different spacing, patterns, error handling |
| integration complexity | contracts, versioning, shared state, routing |
| operational overhead | several pipelines, versions and failure modes |

## Go deeper

Try the cheaper options first. A **modular monolith**, with feature folders, enforced dependency rules and lazy boundaries, gives most of the code-isolation benefit with none of the runtime integration cost. Many teams that reach for micro frontends actually needed that.

Micro frontends make sense when the *deployment* independence is the goal. If every release still needs all teams to test together, you have the cost without the benefit.

Plan the shared surface early: authentication, design system, routing ownership and cross-piece communication. Keep the contract between pieces small and explicit. The more state and behaviour they share, the less independent they are, and the more a "micro" frontend is a distributed monolith.

Be honest about reversibility. Splitting is far easier than merging back, and each additional seam is permanent operational work.

In code, the host's job is small: route to a piece and load it when needed, then leave everything else to the team that owns it.

```typescript
// host: app.routes.ts. The host knows a path and a loader, nothing about the piece's internals
export const routes: Routes = [
  {
    path: 'exercises',
    loadComponent: () => import('./remotes/exercise-host').then((m) => m.ExerciseHost),
  },
];
```

A useful check before committing: list the teams, the products they own, and how often each wants to release. If two teams always release together, they are one team for this purpose.

## Watch out

- Adopting it for a single small team.
- Slicing by technical layer instead of business capability.
- Sharing so much state that the pieces cannot release independently.

## Remember

- It is an organisational solution: independent teams, independent deploys.
- Slice vertically by business capability.
- Try a modular monolith before you pay the integration cost.

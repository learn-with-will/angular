# Writing a lesson bite

Every lesson is one file in `public/content/lessons/<slug>.md`, teaches **one** idea, and takes
**3–5 minutes** to read. `npm run validate` enforces the rules below; `npm run manifest` rebuilds
`course-manifest.json` (it also runs before `npm start` and `npm run build`).

## Shape

```markdown
---
slug: computed
title: "computed()"
topic: signals
kind: api            # concept | api | technique | pattern | pitfall | tool
summary: "One sentence, ends with a full stop, max 160 characters."
tags: [signals, derived-state]
related: [signal, effect, linked-signal]    # 2–4 slugs that exist
since: "17"          # optional: first stable Angular version
---
> **In one line:** the whole idea in a sentence.

## The idea          why it exists and how it works (required)
## See it            a minimal, working example (required)
## Go deeper         optional: one or two details beyond the basics
## Watch out         optional: 1–3 mistakes people actually make
## Remember          exactly 3 takeaways (required)
```

| Rule | Limit |
|---|---|
| Reading time | 3–5 minutes (computed: 180 words/min + 20 code lines/min, rounded). Never typed by hand |
| Words | at most 700 (diagram labels count) |
| Code | at most 3 blocks, each at most 25 lines, always with a language |
| Diagrams | at most 1 |
| Headings | only the five sections above; no `#` heading (the title comes from front-matter) |

Simpler topics usually land at 3 minutes, topics with more moving parts at 4–5. Do not pad to
reach a number, and split a bite that will not fit in 5.

## Choose the visual from the shape of the information

Every bite needs **at least one** visual, but which one depends on what the information *is*.
A diagram is one option among several, not the default, and never worth adding just to have one.

| The information is... | Use | How |
|---|---|---|
| several things compared on the same properties | **table** | a Markdown table |
| a rule, caveat or tip | **callout** | `> **Tip:** …`, `> **Note:** …`, `> **Watch out:** …` |
| the usual mistakes | **Watch out section** | bullets; drawn as warning cards automatically |
| the takeaways | **Remember section** | bullets; drawn as numbered cards automatically |
| wrong code next to right code | **Before / After** | one code block with `// Before` and `// After` comments |
| things happening in order between parties, or a lifecycle that repeats | **sequence** | a ```` ```sequence ```` block |
| "which one do I use?" | **tree** | a ```` ```tree ```` block |
| what depends on what, or data flowing one way (no loops) | **flow** | a ```` ```flow ```` block |
| one fact or a definition | plain prose | the *In one line* callout |

If a table says it, do not also draw it. A loop cannot be a `flow` (flows are acyclic): show it as a
sequence over time.

## One look for all of them

Tables, callouts, the Watch out and Remember cards and diagrams share one style: rounded panels,
a tinted fill with a coloured border, a small badge, light and dark themes from the same palette.
Where a visual takes a colour (a diagram box, `@tone`), it means:

| Tone | Use it for |
|---|---|
| `primary` | the main subject of the picture |
| `blue` | supporting or derived things |
| `green` | the good outcome, the safe path |
| `amber` | take care, the risky option |
| `red` | forbidden, will not work |
| `neutral` | everything else (the default) |

## Diagram syntax

One statement per line. `Title | subtitle` gives a bold title and a muted line, a trailing `@tone`
colours the box, and `` `code` `` renders as inline code. Keep text short: boxes do not scroll,
and a tree that gets too wide scrolls sideways.

````markdown
```sequence
actor user: User | admin
actor app: App | runs the page @blue
user -> app: Opens the page | shows a button      (solid arrow)
app --> user: Replies                             (dashed arrow)
note app: Keep a state | single use @amber        (box on one actor)
note user..app: Both agree                        (box across actors)
```

```tree
Where does it start?
  In the browser
    [W1] Desktop QR | scan and confirm @blue       ([badge] or a subtitle makes a card)
  In the app
    [A1] App to app | hand over @green
```

```flow
price: `price` | signal @primary
total: `total` | computed @blue
view: Template | shows the total @green
price -> total
total -> view: re-renders                         (optional edge label)
```
````

Limits: sequence 2–6 actors and up to 12 steps; tree up to 30 nodes, 5 levels, one root; flow up to
12 nodes, no cycles. Badges are at most 8 characters and cannot contain brackets. The grammar lives
in `src/app/shared/diagram/diagram-parser.ts`, and `npm run validate` reports a broken diagram with
its line number.

## Quiz questions

Questions live in `public/quiz/questions.json`, tagged with a `topic` and, usually, the `lesson`
to link back to. Each topic that has lessons needs at least 8 questions. See the validator for the
five question types and their fields.

## Before you publish

```bash
npm run validate           # warnings for topics not migrated yet
npm run validate -- --strict   # what the deploy workflow runs: those warnings become errors
```

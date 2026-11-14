# Angular Learning Portal

A **frontend-only** Angular course made of short lessons ("bites"). Each bite teaches one
idea in **3–5 minutes**, so you can read in any order, jump to a random one, or follow a
topic from start to finish. Quizzes, progress and bookmarks all live in the browser; there is
no backend.

Built with Angular 20+ standalone components, signals, Tailwind CSS v4 and ngx-markdown.

## What is in it

- **Home** with a continue-learning card, topic overview and a "surprise me" button.
- **Lessons A–Z** with search, filters by topic and kind, and random browsing. There are no
  levels: every lesson stands on its own and links to related ones.
- **Lesson reader** with Markdown, syntax highlighting, tables, warning and takeaway cards,
  and optional diagrams (sequence, tree, flow) drawn by the app itself.
- **Quiz bank** with questions grouped by topic, in five types: single-choice,
  multiple-choice, fill-blank, ordering and match-pair, with explanations and review.
- **Dashboard** and **bookmarks**, with light and dark themes.
- Old long-lesson URLs (`/lesson/<old-slug>`, `/roadmap`, `/search`) redirect to the new
  structure, and v1 progress is imported on first load.

The course currently has 14 topics, 212 lessons and 313 questions.

## Run it

```bash
npm install
npm start          # dev server at http://localhost:4200
npm run build      # production build into dist/
npm test           # unit tests
npm run validate   # check lessons, quiz bank and manifest
```

`npm start` and `npm run build` regenerate `public/content/course-manifest.json` first.
Node 22.18 or later is required, because the scripts import TypeScript directly.

## Project structure

```text
src/app/
├── core/
│   ├── guards/        # legacy URL and random-lesson redirects
│   ├── models/        # Lesson, Quiz, Progress interfaces
│   ├── services/      # Course, Lesson, Quiz, Progress, Search, Theme
│   └── util/
├── shared/
│   ├── diagram/       # parser and components for sequence, tree and flow diagrams
│   └── components/    # navbar, footer, lesson cards, quiz parts, related lessons
├── features/          # home, lessons, lesson, quiz-hub, quiz-play, dashboard, bookmarks
└── app.routes.ts      # lazy-loaded routes

public/
├── content/
│   ├── lessons/             # one <slug>.md per lesson
│   ├── topics.json          # the 14 topics
│   ├── legacy.json          # old lesson id → new lessons, for redirects and imported progress
│   └── course-manifest.json # generated; do not edit
└── quiz/questions.json      # the question bank

scripts/
├── generate-manifest.mjs    # builds the manifest and computes reading time
└── validate-course.mjs      # the release gate (--strict is used in CI)
```

## Adding a lesson

1. Create `public/content/lessons/<slug>.md` with front-matter (`slug`, `title`, `topic`,
   `kind`, `summary`, `tags`, `related`) and the five standard sections.
2. Add questions for it to `public/quiz/questions.json` with `"topic"` and `"lesson"`.
3. Run `npm run manifest && npm run validate`.

[CONTENT_GUIDE.md](CONTENT_GUIDE.md) has the rules: length limits, which visual fits which kind
of information, and the diagram syntax. The validator enforces them, so a lesson that is too
long, too short or missing a visual fails the build.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which validates the course in strict
mode, builds with the repository name as the base href, and publishes to GitHub Pages.

## Earlier version

The original 35 long lessons are preserved at the git tag `v1-long-lessons`.

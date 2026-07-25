# Angular Learning Portal

A **frontend-only** Angular learning platform: read Markdown lessons, take quizzes,
and track your progress — all in the browser, no backend required. Built with
Angular 20 standalone components, signals, Tailwind CSS, and ngx-markdown.

## Features

- **Roadmap** of lessons grouped by level (beginner / intermediate / advanced).
- **Lesson reader** with Markdown rendering, Prism syntax highlighting, a table of
  contents, previous/next navigation, mark-complete, and bookmarking.
- **Quizzes** supporting five question types: single-choice, multiple-choice,
  fill-blank, ordering, and match-pair — with grading, review mode, and explanations.
- **Dashboard** with completion stats, per-level progress, and quiz history.
- **Search** and **bookmarks** pages.
- **Dark mode** with persistence, and a responsive layout.
- All progress persists to `localStorage`.

## Run it

```bash
npm install
npm start          # dev server at http://localhost:4200
npm run build      # production build into dist/
npm test           # unit tests (Karma/Jasmine)
```

## Project structure

```text
src/app/
├── core/
│   ├── models/        # Lesson, Quiz, Progress interfaces
│   └── services/      # Course, Lesson, Quiz, Progress, Search, Theme
├── shared/components/ # Navbar, Sidebar, Footer, LessonCard, Toc,
│                      # LessonNavigation, QuizQuestion, QuizProgress, QuizResult
├── features/          # home, roadmap, lesson, quiz, dashboard, search, bookmarks
├── app.routes.ts      # lazy-loaded routes
└── app.config.ts      # providers (router, HttpClient, markdown)

public/
├── content/           # lesson Markdown + course-manifest.json
└── quizzes/           # one <lessonId>.json per quiz
```

## Adding content — no code changes required

### Add a lesson

1. Create a Markdown file under `public/content/<level>/`, e.g.
   `public/content/beginner/lesson-07.md`. Start it with YAML front-matter:

   ```md
   ---
   id: lesson-07
   slug: forms-and-validation
   title: Forms & Validation
   level: beginner
   order: 7
   duration: 20
   tags: [forms, validation]
   ---

   # Learning Objectives
   ...
   ```

2. Add a matching entry to `public/content/course-manifest.json`:

   ```json
   {
     "id": "lesson-07",
     "slug": "forms-and-validation",
     "title": "Forms & Validation",
     "level": "beginner",
     "order": 7,
     "duration": 20,
     "file": "beginner/lesson-07.md",
     "summary": "Build and validate reactive forms.",
     "tags": ["forms", "validation"]
   }
   ```

The lesson now appears in the roadmap, sidebar, search, and home — automatically.

### Add a quiz

Create `public/quizzes/<lessonId>.json` (e.g. `public/quizzes/lesson-07.json`):

```json
{
  "id": "quiz-07",
  "lessonId": "lesson-07",
  "title": "Forms & Validation",
  "passingScore": 70,
  "questions": [
    { "id": "q1", "type": "single-choice", "prompt": "…",
      "options": [{ "id": "a", "text": "…" }], "answer": "a",
      "explanation": "…" }
  ]
}
```

Supported question `type` values: `single-choice`, `multiple-choice`,
`fill-blank`, `ordering`, `match-pair`. See `public/quizzes/lesson-03.json` for an
example using all of them.

## Tech stack

Angular 20 · Standalone components · Signals · Tailwind CSS v4 · ngx-markdown +
marked · PrismJS · localStorage.

## Deploying

The output in `dist/learning-portal/browser` is a static site — deploy it to
GitHub Pages, Netlify, Vercel, or any static host. For hosts without SPA URL
rewriting, configure a fallback to `index.html` so deep links work.

### GitHub Pages (automated)

This repo ships a workflow at `.github/workflows/deploy.yml` that builds and
publishes the site on every push to `main`:

- Builds with `--base-href "/<repo>/"` so assets resolve under the project
  subpath (`https://<user>.github.io/<repo>/`).
- Copies `index.html` to `404.html` so deep links (e.g. `/lesson/:slug`) work
  without server-side rewriting.

One-time setup: in the repo, go to **Settings → Pages → Build and deployment →
Source** and select **GitHub Actions**. The next push to `main` deploys, and the
live URL appears in the workflow run's summary and under Settings → Pages.
```

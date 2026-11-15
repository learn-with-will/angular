# Angular Learn

The content of the Angular course at <https://learn-with-will.github.io/angular/>: 212 short
lessons ("bites") in 14 topics, each teaching one idea in 3–5 minutes, plus a bank of 313 quiz
questions.

This repository holds **content only**. The site itself (lesson reader, quizzes, progress,
optional sign-in) is the shared [course shell](https://github.com/learn-with-will/course-shell),
which every course uses.

```text
course.json              name, brand colours, home page copy, code languages
content/topics.json      the 14 topics
content/lessons/*.md     one bite per file
content/legacy.json      old long-lesson URLs → the bites that replaced them
quiz/questions.json      the question bank
assets/favicon.ico
```

## Working on the course

Clone the shell next to this folder, then run its commands with this folder as the argument:

```bash
git clone https://github.com/learn-with-will/course-shell.git ../course-shell
cd ../course-shell
npm ci
npm run dev -- ../angular                 # live preview at http://localhost:4200
npm run validate -- ../angular --strict   # the check the deploy runs
```

Node 22.18 or later is required.

## Adding a lesson

1. Create `content/lessons/<slug>.md` with front-matter (`slug`, `title`, `topic`, `kind`,
   `summary`, `tags`, `related`) and the standard sections.
2. Add questions for it to `quiz/questions.json` with `"topic"` and `"lesson"`.
3. Run `npm run validate -- ../angular --strict` from the shell folder.

The rules (length limits, which visual fits which kind of information, the diagram syntax) are
in the shell's [CONTENT_GUIDE.md](https://github.com/learn-with-will/course-shell/blob/main/CONTENT_GUIDE.md).

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which calls the shell's reusable
workflow: it validates this course in strict mode, builds it with the latest shell and
publishes it to GitHub Pages. To pick up a shell change without a content change, run the
workflow by hand from the Actions tab.

## Earlier versions

The original 35 long lessons are preserved at the git tag `v1-long-lessons`. Up to the commit
"Redesign the UI as Bites" this repository also contained the Angular app that is now the
course shell.

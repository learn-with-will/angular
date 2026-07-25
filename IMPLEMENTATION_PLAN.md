# Angular Learning Platform - Implementation Plan

## Overview

A frontend-only Angular learning platform that teaches Angular concepts through lessons, quizzes, and progress tracking.

### Goals

- No backend required.
- All content loaded from static files.
- Easily extensible by adding Markdown and JSON files.
- Deployable to GitHub Pages, Netlify, or Vercel.

---

## Tech Stack

- Angular (latest stable)
- Standalone Components
- Angular Signals
- Angular Material + TailwindCSS
- ngx-markdown / marked
- PrismJS
- LocalStorage

---

## Folder Structure

```text
src/
├── app/
│   ├── core/
│   ├── shared/
│   ├── features/
│   │   ├── home/
│   │   ├── roadmap/
│   │   ├── lesson/
│   │   ├── quiz/
│   │   ├── dashboard/
│   │   ├── search/
│   │   └── bookmarks/
│   └── app.routes.ts
│
├── assets/
│   ├── content/
│   ├── quizzes/
│   └── images/
```

---

## Main Features

### Learning Features

- Course roadmap
- Lesson reader
- Search lessons
- Bookmark lessons
- Reading progress
- Dark mode
- Responsive layout

### Quiz Features

- Lesson quizzes
- Level assessments
- Review mode
- Explanations for answers
- Quiz history

---

## Pages

### Home (`/`)

- Hero section
- Continue learning
- Statistics
- Roadmap overview

### Roadmap (`/roadmap`)

- Beginner
- Intermediate
- Advanced

### Lesson (`/lesson/:slug`)

Layout:

```text
Sidebar | Lesson Content
```

Features:

- Markdown rendering
- Table of contents
- Previous / Next navigation
- Mark complete
- Bookmark

### Quiz (`/lesson/:slug/quiz`)

- Answer questions
- Track progress
- Submit
- Review answers

### Dashboard (`/dashboard`)

- Completed lessons
- Average score
- Learning statistics

---

## Lesson Storage

Store lessons as Markdown files.

```text
assets/content/
├── beginner/
├── intermediate/
└── advanced/
```

Example:

```md
---
id: lesson-01
slug: introduction-angular-cli
title: Introduction & Angular CLI
level: beginner
order: 1
duration: 20
tags:
  - angular
  - cli
---

# Learning Objectives

# Why This Concept Exists

# Concept Explanation

# Syntax

# Real World Analogy

# Code Examples

# Common Mistakes

# Best Practices

# Summary

# Flash Cards

# Exercises
```

---

## Course Manifest

File:

```text
assets/content/course-manifest.json
```

Example:

```json
[
  {
    "id": "lesson-01",
    "slug": "introduction-angular-cli",
    "title": "Introduction & Angular CLI",
    "level": "beginner",
    "order": 1,
    "duration": 20,
    "file": "beginner/lesson-01.md"
  }
]
```

---

## Quiz Structure

Location:

```text
assets/quizzes/
```

Example:

```json
{
  "id": "quiz-01",
  "lessonId": "lesson-01",
  "passingScore": 70,
  "questions": []
}
```

Supported question types:

- single-choice
- multiple-choice
- fill-blank
- ordering
- match-pair

---

## Local Storage

```ts
interface UserProgress {
  completedLessons: string[];
  bookmarkedLessons: string[];
  lastOpenedLesson?: string;

  quizResults: {
    [lessonId: string]: {
      score: number;
      completedAt: string;
    };
  };
}
```

Storage key:

```text
angular-learning-progress
```

---

## Services

### CourseService

- Load course manifest
- Get lesson metadata

### LessonService

- Fetch markdown files
- Parse content
- Generate table of contents

### QuizService

- Load quiz data
- Evaluate answers

### ProgressService

- Save progress
- Bookmark lessons

### SearchService

- Search lessons

### ThemeService

- Dark mode

---

## Shared Components

### Layout

- NavbarComponent
- SidebarComponent
- FooterComponent

### Lesson

- LessonCardComponent
- TableOfContentsComponent
- LessonNavigationComponent

### Quiz

- QuizQuestionComponent
- QuizProgressComponent
- QuizResultComponent

---

## Routing

```text
/
/roadmap
/dashboard
/bookmarks
/search
/lesson/:slug
/lesson/:slug/quiz
```

---

## MVP Phases

### Phase 1

- Layout
- Routing
- Markdown lessons
- Sidebar
- Progress tracking
- Dark mode

### Phase 2

- Quiz system
- Search
- Dashboard
- Bookmarks

### Phase 3

- Advanced quiz types
- Statistics

### Phase 4

- Playground
- PWA
- Gamification

---

## Success Criteria

- Works without backend
- Lessons loaded from files
- Quiz works
- Progress persists
- New lessons added without code changes

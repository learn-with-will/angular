import { Routes } from '@angular/router';
import { legacyLessonGuard, legacyQuizGuard, randomGuard } from './core/guards/course.guards';

const SITE = 'Angular Learn';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: `${SITE} · Angular in 5-minute bites`,
  },
  {
    path: 'lessons',
    loadComponent: () => import('./features/lessons/lessons').then((m) => m.LessonsPage),
    title: `Lessons A–Z · ${SITE}`,
  },
  {
    path: 'lesson/:slug',
    canActivate: [legacyLessonGuard],
    loadComponent: () => import('./features/lesson/lesson').then((m) => m.LessonPage),
    title: `Lesson · ${SITE}`,
  },
  // Old per-lesson quiz URL: the guard always redirects into /quiz.
  { path: 'lesson/:slug/quiz', canActivate: [legacyQuizGuard], children: [] },
  // Surprise me: the guard always redirects to a random lesson.
  { path: 'random', canActivate: [randomGuard], children: [] },
  {
    path: 'quiz',
    loadComponent: () => import('./features/quiz-hub/quiz-hub').then((m) => m.QuizHub),
    title: `Quiz · ${SITE}`,
  },
  {
    path: 'quiz/play',
    loadComponent: () => import('./features/quiz-play/quiz-play').then((m) => m.QuizPlay),
    title: `Quiz · ${SITE}`,
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: `Progress · ${SITE}`,
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./features/bookmarks/bookmarks').then((m) => m.Bookmarks),
    title: `Saved · ${SITE}`,
  },
  // Old pages that no longer exist as such.
  { path: 'roadmap', redirectTo: 'lessons' },
  { path: 'search', redirectTo: 'lessons' },
  { path: '**', redirectTo: '' },
];

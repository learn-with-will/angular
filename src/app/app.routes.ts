import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Angular Learning Portal',
  },
  {
    path: 'roadmap',
    loadComponent: () => import('./features/roadmap/roadmap').then((m) => m.Roadmap),
    title: 'Roadmap · Angular Learning Portal',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard · Angular Learning Portal',
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./features/bookmarks/bookmarks').then((m) => m.Bookmarks),
    title: 'Bookmarks · Angular Learning Portal',
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchPage),
    title: 'Search · Angular Learning Portal',
  },
  {
    path: 'lesson/:slug',
    loadComponent: () => import('./features/lesson/lesson').then((m) => m.LessonPage),
    title: 'Lesson · Angular Learning Portal',
  },
  {
    path: 'lesson/:slug/quiz',
    loadComponent: () => import('./features/quiz/quiz').then((m) => m.QuizPage),
    title: 'Quiz · Angular Learning Portal',
  },
  { path: '**', redirectTo: '' },
];

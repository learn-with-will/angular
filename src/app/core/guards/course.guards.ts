import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CourseService } from '../services/course.service';
import { ProgressService } from '../services/progress.service';

/**
 * `/lesson/<old-long-lesson-slug>` used to be a lesson page. Those slugs now
 * redirect to the A–Z list filtered to the bites that replaced them. Slugs that
 * are neither current nor legacy fall through, so the page can say "not found".
 */
export const legacyLessonGuard: CanActivateFn = async (route) => {
  const course = inject(CourseService);
  const router = inject(Router);
  await course.load();

  const slug = route.paramMap.get('slug') ?? '';
  if (course.getBySlug(slug)) return true;
  if (course.legacyBySlug(slug)) {
    return router.createUrlTree(['/lessons'], { queryParams: { from: slug } });
  }
  return true;
};

/** `/lesson/<slug>/quiz` moved into the quiz section, pre-filtered to the lesson's topic. */
export const legacyQuizGuard: CanActivateFn = async (route) => {
  const course = inject(CourseService);
  const router = inject(Router);
  await course.load();

  const slug = route.paramMap.get('slug') ?? '';
  const topic = course.getBySlug(slug)?.topic ?? course.legacyBySlug(slug)?.topic;
  return router.createUrlTree(['/quiz'], { queryParams: topic ? { topic } : {} });
};

/** `/random` redirects to a random lesson, favouring ones not yet learned. */
export const randomGuard: CanActivateFn = async () => {
  const course = inject(CourseService);
  const progress = inject(ProgressService);
  const router = inject(Router);
  await course.load();

  const pick = course.random({
    learned: new Set(Object.keys(progress.learned())),
    exclude: progress.lastOpened(),
  });
  return router.createUrlTree(pick ? ['/lesson', pick.slug] : ['/lessons']);
};

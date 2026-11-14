import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';
import { LegacyEntry } from '../models/lesson.model';
import { LEGACY_PROGRESS_STORAGE_KEY, PROGRESS_STORAGE_KEY } from '../models/progress.model';

const LEGACY: LegacyEntry[] = [
  { id: 'lesson-08', slug: 'introduction-to-signals', title: 'Signals', lessons: ['signal', 'computed'] },
  { id: 'lesson-12', slug: 'template-driven-forms', title: 'Forms', lessons: [] },
];

function create(): ProgressService {
  TestBed.resetTestingModule();
  return TestBed.inject(ProgressService);
}

describe('ProgressService', () => {
  beforeEach(() => {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PROGRESS_STORAGE_KEY);
  });
  afterEach(() => {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PROGRESS_STORAGE_KEY);
  });

  it('marks lessons learned and unlearned', () => {
    const p = create();
    p.setLearned('signal', true);
    expect(p.isLearned('signal')).toBeTrue();
    expect(p.learnedCount()).toBe(1);
    p.toggleLearned('signal');
    expect(p.isLearned('signal')).toBeFalse();
  });

  it('toggles bookmarks and remembers the last opened lesson', () => {
    const p = create();
    p.toggleBookmark('effect');
    expect(p.isBookmarked('effect')).toBeTrue();
    p.toggleBookmark('effect');
    expect(p.isBookmarked('effect')).toBeFalse();

    p.setLastOpened('computed');
    expect(p.lastOpened()).toBe('computed');
  });

  describe('question stats', () => {
    it('tallies answers and computes overall accuracy', () => {
      const p = create();
      expect(p.accuracy()).toBeNull();
      p.recordAnswer('a', true);
      p.recordAnswer('a', false);
      p.recordAnswer('b', true);
      p.recordAnswer('b', true);
      expect(p.questionStats()['a']).toEqual({ seen: 2, correct: 1, lastCorrect: false });
      expect(p.accuracy()).toBe(75);
    });

    it('lists a question as missed until it is answered correctly', () => {
      const p = create();
      p.recordAnswer('q1', false);
      p.recordAnswer('q2', true);
      expect([...p.missedIds()]).toEqual(['q1']);
      p.recordAnswer('q1', true);
      expect(p.missedIds().size).toBe(0);
    });
  });

  it('keeps only the newest 50 quiz sessions', () => {
    const p = create();
    for (let i = 0; i < 55; i++) {
      p.recordSession({ at: `2026-01-${String(i).padStart(2, '0')}`, mode: 'quick', topics: [], total: 5, correct: i % 6, missed: [] });
    }
    expect(p.sessions().length).toBe(50);
    expect(p.sessions()[0].at).toBe('2026-01-54');
  });

  it('persists to the v2 key', async () => {
    const p = create();
    p.setLearned('signal', true);
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)!).learned.signal).toBeDefined();
    expect(create().isLearned('signal')).toBeTrue();
  });

  describe('importLegacy', () => {
    const seedOld = () =>
      localStorage.setItem(
        LEGACY_PROGRESS_STORAGE_KEY,
        JSON.stringify({
          completedLessons: ['lesson-08', 'lesson-12'],
          bookmarkedLessons: ['lesson-08'],
          quizResults: { 'lesson-08': { score: 80, passed: true, completedAt: '2026-01-01' } },
        }),
      );

    it('maps old completions and bookmarks onto the replacement lessons', () => {
      seedOld();
      const p = create();
      p.importLegacy(LEGACY);
      expect(p.isLearned('signal')).toBeTrue();
      expect(p.isLearned('computed')).toBeTrue();
      expect(p.isBookmarked('signal')).toBeTrue();
      expect(p.questionStats()).toEqual({}); // old quiz scores are dropped
    });

    it('leaves lessons that are not migrated yet for a later run', () => {
      seedOld();
      const p = create();
      p.importLegacy(LEGACY);
      expect(p.progress().legacyImported).toEqual(['lesson-08']);

      const migrated = LEGACY.map((e) => (e.id === 'lesson-12' ? { ...e, lessons: ['ngmodel'] } : e));
      p.importLegacy(migrated);
      expect(p.isLearned('ngmodel')).toBeTrue();
      expect(p.progress().legacyImported.sort()).toEqual(['lesson-08', 'lesson-12']);
    });

    it('is idempotent, so un-learning an imported lesson sticks', () => {
      seedOld();
      const p = create();
      p.importLegacy(LEGACY);
      p.setLearned('signal', false);
      p.importLegacy(LEGACY);
      expect(p.isLearned('signal')).toBeFalse();
    });

    it('does nothing when there is no v1 data', () => {
      const p = create();
      p.importLegacy(LEGACY);
      expect(p.learnedCount()).toBe(0);
    });

    it('is not resurrected by a reset', () => {
      seedOld();
      const p = create();
      p.importLegacy(LEGACY);
      p.reset();
      p.importLegacy(LEGACY);
      expect(p.learnedCount()).toBe(0);
      expect(p.bookmarks()).toEqual([]);
    });
  });
});

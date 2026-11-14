import { emptyProgress, QuizSession, UserProgress } from '../models/progress.model';
import {
  FieldOps,
  applyPatch,
  diffProgress,
  isEmptyProgress,
  mergeProgress,
  parseRemoteProgress,
  toFirestoreData,
  toFirestorePatch,
} from './progress-sync';

const session = (at: string, correct = 3): QuizSession => ({
  at,
  mode: 'quick',
  topics: [],
  total: 5,
  correct,
  missed: [],
});

const progress = (over: Partial<UserProgress> = {}): UserProgress => ({ ...emptyProgress(), ...over });

describe('progress-sync', () => {
  describe('isEmptyProgress', () => {
    it('is true for a fresh state and false once anything is recorded', () => {
      expect(isEmptyProgress(emptyProgress())).toBeTrue();
      expect(isEmptyProgress(progress({ learned: { a: '2026-01-01' } }))).toBeFalse();
      expect(isEmptyProgress(progress({ bookmarks: ['a'] }))).toBeFalse();
      expect(isEmptyProgress(progress({ lastOpened: 'a' }))).toBeFalse();
      expect(isEmptyProgress(progress({ legacyImported: ['*'] }))).toBeFalse();
    });
  });

  describe('mergeProgress', () => {
    it('unions lessons and bookmarks from both sides', () => {
      const remote = progress({ learned: { a: '2026-01-02' }, bookmarks: ['x', 'y'] });
      const local = progress({ learned: { b: '2026-01-03' }, bookmarks: ['y', 'z'] });
      const merged = mergeProgress(remote, local);
      expect(Object.keys(merged.learned).sort()).toEqual(['a', 'b']);
      expect(merged.bookmarks).toEqual(['x', 'y', 'z']);
    });

    it('keeps the earlier completion date for a lesson learned on both sides', () => {
      const remote = progress({ learned: { a: '2026-02-01' } });
      const local = progress({ learned: { a: '2026-01-01' } });
      expect(mergeProgress(remote, local).learned['a']).toBe('2026-01-01');
      expect(mergeProgress(local, remote).learned['a']).toBe('2026-01-01');
    });

    it('keeps the question tally that has seen more answers rather than adding them', () => {
      const remote = progress({ questions: { q1: { seen: 4, correct: 3, lastCorrect: true } } });
      const local = progress({
        questions: {
          q1: { seen: 2, correct: 1, lastCorrect: false },
          q2: { seen: 1, correct: 1, lastCorrect: true },
        },
      });
      const merged = mergeProgress(remote, local);
      expect(merged.questions['q1']).toEqual({ seen: 4, correct: 3, lastCorrect: true });
      expect(merged.questions['q2'].seen).toBe(1);
    });

    it('dedupes quiz sessions, sorts newest first and caps at 50', () => {
      const remote = progress({ sessions: [session('2026-01-03'), session('2026-01-01')] });
      const local = progress({ sessions: [session('2026-01-02'), session('2026-01-01')] });
      expect(mergeProgress(remote, local).sessions.map((s) => s.at)).toEqual([
        '2026-01-03',
        '2026-01-02',
        '2026-01-01',
      ]);

      const many = progress({
        sessions: Array.from({ length: 40 }, (_, i) => session(`2026-02-${String(i + 10).padStart(2, '0')}`)),
      });
      const other = progress({
        sessions: Array.from({ length: 40 }, (_, i) => session(`2026-03-${String(i + 10).padStart(2, '0')}`)),
      });
      expect(mergeProgress(many, other).sessions.length).toBe(50);
    });

    it('prefers the local last-opened lesson, falling back to the remote one', () => {
      expect(mergeProgress(progress({ lastOpened: 'r' }), progress({ lastOpened: 'l' })).lastOpened).toBe('l');
      expect(mergeProgress(progress({ lastOpened: 'r' }), progress()).lastOpened).toBe('r');
    });

    it('does not mutate its inputs', () => {
      const remote = progress({ learned: { a: '2026-01-01' }, bookmarks: ['x'] });
      const local = progress({ learned: { b: '2026-01-02' }, bookmarks: ['y'] });
      mergeProgress(remote, local);
      expect(remote.learned).toEqual({ a: '2026-01-01' });
      expect(remote.bookmarks).toEqual(['x']);
      expect(local.bookmarks).toEqual(['y']);
    });
  });

  describe('diffProgress', () => {
    it('returns null when nothing changed', () => {
      const p = progress({ learned: { a: '2026-01-01' }, bookmarks: ['x'] });
      expect(diffProgress(p, { ...p })).toBeNull();
    });

    it('reports a newly learned and a newly un-learned lesson', () => {
      const prev = progress({ learned: { a: '2026-01-01', b: '2026-01-02' } });
      const next = progress({ learned: { a: '2026-01-01', c: '2026-01-03' } });
      const patch = diffProgress(prev, next)!;
      expect(patch.learnedSet).toEqual({ c: '2026-01-03' });
      expect(patch.learnedRemove).toEqual(['b']);
    });

    it('reports bookmark additions and removals', () => {
      const patch = diffProgress(progress({ bookmarks: ['a', 'b'] }), progress({ bookmarks: ['b', 'c'] }))!;
      expect(patch.bookmarksAdd).toEqual(['c']);
      expect(patch.bookmarksRemove).toEqual(['a']);
      expect(patch.bookmarks).toEqual(['b', 'c']);
    });

    it('reports only the question tallies that changed', () => {
      const same = { seen: 1, correct: 1, lastCorrect: true };
      const prev = progress({ questions: { q1: same, q2: { seen: 1, correct: 0, lastCorrect: false } } });
      const next = progress({ questions: { q1: same, q2: { seen: 2, correct: 1, lastCorrect: true } } });
      expect(diffProgress(prev, next)!.questionsSet).toEqual({ q2: { seen: 2, correct: 1, lastCorrect: true } });
    });

    it('reports a changed last-opened lesson, a new session and legacy bookmarks', () => {
      const prev = progress({ lastOpened: 'a' });
      const next = progress({ lastOpened: 'b', sessions: [session('2026-01-01')], legacyImported: ['lesson-01'] });
      const patch = diffProgress(prev, next)!;
      expect(patch.lastOpened).toBe('b');
      expect(patch.sessions?.length).toBe(1);
      expect(patch.legacyImported).toEqual(['lesson-01']);
    });

    it('does not write anything for an unchanged last-opened lesson', () => {
      expect(diffProgress(progress({ lastOpened: 'a' }), progress({ lastOpened: 'a' }))).toBeNull();
    });
  });

  describe('applyPatch', () => {
    /** Whatever diffProgress describes, applyPatch must be able to replay. */
    const roundTrips = (prev: UserProgress, next: UserProgress) =>
      expect(applyPatch(prev, diffProgress(prev, next)!)).toEqual(next);

    it('replays a learned and an un-learned lesson', () => {
      roundTrips(
        progress({ learned: { a: '2026-01-01', b: '2026-01-02' } }),
        progress({ learned: { a: '2026-01-01', c: '2026-01-03' } }),
      );
    });

    it('replays bookmark additions, removals and mixed edits', () => {
      roundTrips(progress({ bookmarks: ['a'] }), progress({ bookmarks: ['a', 'b'] }));
      roundTrips(progress({ bookmarks: ['a', 'b'] }), progress({ bookmarks: ['b'] }));
      roundTrips(progress({ bookmarks: ['a'] }), progress({ bookmarks: ['b'] }));
    });

    it('replays question tallies, a new session, last-opened and legacy ids', () => {
      roundTrips(
        progress({ lastOpened: 'a', questions: { q1: { seen: 1, correct: 0, lastCorrect: false } } }),
        progress({
          lastOpened: 'b',
          questions: { q1: { seen: 2, correct: 1, lastCorrect: true }, q2: { seen: 1, correct: 1, lastCorrect: true } },
          sessions: [session('2026-01-01')],
          legacyImported: ['lesson-01'],
        }),
      );
    });

    it('lays an edit over a snapshot that predates it, leaving other fields alone', () => {
      const edit = diffProgress(progress(), progress({ learned: { mine: '2026-01-02' } }))!;
      const staleSnapshot = progress({ learned: { theirs: '2026-01-01' }, bookmarks: ['x'] });
      const shown = applyPatch(staleSnapshot, edit);
      expect(Object.keys(shown.learned).sort()).toEqual(['mine', 'theirs']);
      expect(shown.bookmarks).toEqual(['x']);
    });

    it('does not mutate its input', () => {
      const base = progress({ learned: { a: '2026-01-01' }, bookmarks: ['x'] });
      applyPatch(base, diffProgress(base, progress({ learned: {}, bookmarks: [] }))!);
      expect(base.learned).toEqual({ a: '2026-01-01' });
      expect(base.bookmarks).toEqual(['x']);
    });
  });

  describe('serialization', () => {
    // Tagged stand-ins for the Firestore sentinels.
    const ops: FieldOps = {
      deleteField: () => ({ op: 'delete' }),
      arrayUnion: (...v) => ({ op: 'union', v }),
      arrayRemove: (...v) => ({ op: 'remove', v }),
      serverTimestamp: () => ({ op: 'now' }),
    };

    it('writes the whole document without undefined values', () => {
      const data = toFirestoreData(progress({ learned: { a: '2026-01-01' } }));
      expect(data['version']).toBe(2);
      expect('lastOpened' in data).toBeFalse();
      expect(data['learned']).toEqual({ a: '2026-01-01' });
    });

    it('turns a patch into per-key merges with deleteField for removals', () => {
      const patch = diffProgress(
        progress({ learned: { b: '2026-01-02' } }),
        progress({ learned: { a: '2026-01-01' }, bookmarks: ['x'] }),
      )!;
      const data = toFirestorePatch(patch, ops);
      expect(data['version']).toBe(2);
      expect(data['updatedAt']).toEqual({ op: 'now' });
      expect(data['learned']).toEqual({ a: '2026-01-01', b: { op: 'delete' } });
      expect(data['bookmarks']).toEqual({ op: 'union', v: ['x'] });
      expect('questions' in data).toBeFalse();
    });

    it('uses arrayRemove for a removal and the whole list for a mixed edit', () => {
      const removal = diffProgress(progress({ bookmarks: ['a', 'b'] }), progress({ bookmarks: ['b'] }))!;
      expect(toFirestorePatch(removal, ops)['bookmarks']).toEqual({ op: 'remove', v: ['a'] });

      const mixed = diffProgress(progress({ bookmarks: ['a'] }), progress({ bookmarks: ['b'] }))!;
      expect(toFirestorePatch(mixed, ops)['bookmarks']).toEqual(['b']);
    });
  });

  describe('parseRemoteProgress', () => {
    it('returns an empty state for anything that is not an object', () => {
      expect(parseRemoteProgress(null)).toEqual(emptyProgress());
      expect(parseRemoteProgress('nope')).toEqual(emptyProgress());
      expect(parseRemoteProgress([])).toEqual(emptyProgress());
    });

    it('round-trips a document written by toFirestoreData', () => {
      const original = progress({
        learned: { a: '2026-01-01' },
        bookmarks: ['x'],
        lastOpened: 'a',
        questions: { q1: { seen: 2, correct: 1, lastCorrect: false } },
        sessions: [session('2026-01-01')],
        legacyImported: ['lesson-01'],
      });
      expect(parseRemoteProgress(toFirestoreData(original))).toEqual(original);
    });

    it('drops malformed entries instead of throwing', () => {
      const parsed = parseRemoteProgress({
        learned: { good: '2026-01-01', bad: 42 },
        bookmarks: ['ok', 7, null],
        questions: { good: { seen: 1, correct: 1, lastCorrect: true }, bad: { seen: 'x' } },
        sessions: [{ at: '2026-01-01', mode: 'nonsense', total: 1, correct: 1 }, 'junk'],
        updatedAt: { seconds: 1 },
      });
      expect(parsed.learned).toEqual({ good: '2026-01-01' });
      expect(parsed.bookmarks).toEqual(['ok']);
      expect(Object.keys(parsed.questions)).toEqual(['good']);
      expect(parsed.sessions).toEqual([]);
    });
  });
});

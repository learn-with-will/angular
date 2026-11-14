import {
  MAX_SESSIONS,
  QuestionStat,
  QuizSession,
  UserProgress,
  emptyProgress,
} from '../models/progress.model';
import { QuizMode } from '../models/quiz.model';

/**
 * Pure helpers for syncing {@link UserProgress} with the cloud copy. Nothing here
 * touches Firebase or Angular, so the rules (what merges, what gets written) are
 * unit-testable in isolation.
 */

/** True when there is nothing worth uploading or preserving. */
export function isEmptyProgress(p: UserProgress): boolean {
  return (
    Object.keys(p.learned).length === 0 &&
    p.bookmarks.length === 0 &&
    !p.lastOpened &&
    Object.keys(p.questions).length === 0 &&
    p.sessions.length === 0 &&
    p.legacyImported.length === 0
  );
}

// ---------------------------------------------------------------------------
// Merge — used once, when an anonymous device's progress meets an account.
// ---------------------------------------------------------------------------

/**
 * Combines the account's saved progress (`remote`) with progress made on this
 * device before signing in (`local`). It only ever *adds*: nothing the learner
 * did on either side is lost. Deletions are not carried across a merge, which is
 * why a merge happens only at sign-in; after that the account copy is the single
 * source of truth.
 */
export function mergeProgress(remote: UserProgress, local: UserProgress): UserProgress {
  const learned: Record<string, string> = { ...remote.learned };
  for (const [slug, at] of Object.entries(local.learned)) {
    // Same lesson on both sides: keep the earlier completion date.
    learned[slug] = slug in learned && learned[slug] < at ? learned[slug] : at;
  }

  const questions: Record<string, QuestionStat> = { ...remote.questions };
  for (const [id, stat] of Object.entries(local.questions)) {
    const existing = questions[id];
    // Tallies from two devices cannot be summed (they may share history), so keep
    // whichever side has seen the question more often.
    if (!existing || stat.seen > existing.seen) questions[id] = stat;
  }

  const sessions = new Map<string, QuizSession>();
  for (const s of [...remote.sessions, ...local.sessions]) if (!sessions.has(s.at)) sessions.set(s.at, s);

  return {
    version: 2,
    learned,
    bookmarks: [...new Set([...remote.bookmarks, ...local.bookmarks])],
    // This device is the one the learner is using right now.
    lastOpened: local.lastOpened ?? remote.lastOpened,
    questions,
    sessions: [...sessions.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_SESSIONS),
    legacyImported: [...new Set([...remote.legacyImported, ...local.legacyImported])],
  };
}

// ---------------------------------------------------------------------------
// Diff — what changed between two local states, as a minimal cloud write.
// ---------------------------------------------------------------------------

/**
 * The cloud write for one local edit. Writing only what changed (rather than the
 * whole document) means a device that opened with stale data can never overwrite
 * progress another device saved in the meantime — it only touches the fields the
 * learner actually just changed.
 */
export interface ProgressPatch {
  learnedSet: Record<string, string>;
  learnedRemove: string[];
  bookmarksAdd: string[];
  bookmarksRemove: string[];
  /** The full list, used when one write both adds and removes a bookmark. */
  bookmarks: string[];
  lastOpened?: string;
  questionsSet: Record<string, QuestionStat>;
  questionsRemove: string[];
  /** Present only when the list changed; it is always replaced whole. */
  sessions?: QuizSession[];
  legacyImported?: string[];
}

export function diffProgress(prev: UserProgress, next: UserProgress): ProgressPatch | null {
  const patch: ProgressPatch = {
    learnedSet: {},
    learnedRemove: [],
    bookmarksAdd: next.bookmarks.filter((s) => !prev.bookmarks.includes(s)),
    bookmarksRemove: prev.bookmarks.filter((s) => !next.bookmarks.includes(s)),
    bookmarks: next.bookmarks,
    questionsSet: {},
    questionsRemove: [],
  };

  for (const [slug, at] of Object.entries(next.learned)) {
    if (prev.learned[slug] !== at) patch.learnedSet[slug] = at;
  }
  for (const slug of Object.keys(prev.learned)) {
    if (!(slug in next.learned)) patch.learnedRemove.push(slug);
  }

  for (const [id, stat] of Object.entries(next.questions)) {
    if (!sameStat(prev.questions[id], stat)) patch.questionsSet[id] = stat;
  }
  for (const id of Object.keys(prev.questions)) {
    if (!(id in next.questions)) patch.questionsRemove.push(id);
  }

  if (next.lastOpened !== undefined && next.lastOpened !== prev.lastOpened) {
    patch.lastOpened = next.lastOpened;
  }
  if (!sameSessions(prev.sessions, next.sessions)) patch.sessions = next.sessions;
  if (!sameList(prev.legacyImported, next.legacyImported)) patch.legacyImported = next.legacyImported;

  const changed =
    Object.keys(patch.learnedSet).length > 0 ||
    patch.learnedRemove.length > 0 ||
    patch.bookmarksAdd.length > 0 ||
    patch.bookmarksRemove.length > 0 ||
    Object.keys(patch.questionsSet).length > 0 ||
    patch.questionsRemove.length > 0 ||
    patch.lastOpened !== undefined ||
    patch.sessions !== undefined ||
    patch.legacyImported !== undefined;
  return changed ? patch : null;
}

/**
 * Applies a patch to a state the way the cloud write will: the inverse of
 * {@link diffProgress}. Used to show an edit on top of a snapshot that does not
 * contain it yet, so a slow or stale snapshot can never roll the UI back.
 */
export function applyPatch(p: UserProgress, patch: ProgressPatch): UserProgress {
  const learned = { ...p.learned, ...patch.learnedSet };
  for (const slug of patch.learnedRemove) delete learned[slug];

  const questions = { ...p.questions, ...patch.questionsSet };
  for (const id of patch.questionsRemove) delete questions[id];

  let bookmarks = p.bookmarks;
  if (patch.bookmarksAdd.length && patch.bookmarksRemove.length) {
    bookmarks = patch.bookmarks; // a mixed edit is sent as the whole list
  } else if (patch.bookmarksAdd.length) {
    bookmarks = [...bookmarks, ...patch.bookmarksAdd.filter((s) => !bookmarks.includes(s))]; // arrayUnion
  } else if (patch.bookmarksRemove.length) {
    bookmarks = bookmarks.filter((s) => !patch.bookmarksRemove.includes(s)); // arrayRemove
  }

  const next: UserProgress = {
    ...p,
    learned,
    questions,
    bookmarks,
    sessions: patch.sessions ?? p.sessions,
    legacyImported: patch.legacyImported ?? p.legacyImported,
  };
  if (patch.lastOpened !== undefined) next.lastOpened = patch.lastOpened;
  return next;
}

function sameStat(a: QuestionStat | undefined, b: QuestionStat): boolean {
  return !!a && a.seen === b.seen && a.correct === b.correct && a.lastCorrect === b.lastCorrect;
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function sameSessions(a: readonly QuizSession[], b: readonly QuizSession[]): boolean {
  return a.length === b.length && a.every((s, i) => s.at === b[i].at);
}

// ---------------------------------------------------------------------------
// Serialization — the Firestore document shape.
// ---------------------------------------------------------------------------

/** The field helpers a patch needs, so this file stays free of the Firebase SDK. */
export interface FieldOps {
  deleteField(): unknown;
  arrayUnion(...values: string[]): unknown;
  arrayRemove(...values: string[]): unknown;
  serverTimestamp(): unknown;
}

/** The whole document, for creating it or replacing it (reset). */
export function toFirestoreData(p: UserProgress): Record<string, unknown> {
  const data: Record<string, unknown> = {
    version: 2,
    learned: p.learned,
    bookmarks: p.bookmarks,
    questions: p.questions,
    sessions: p.sessions,
    legacyImported: p.legacyImported,
  };
  // Firestore rejects `undefined`, so an unset lastOpened is simply left out.
  if (p.lastOpened) data['lastOpened'] = p.lastOpened;
  return data;
}

/**
 * A patch as the argument to `setDoc(ref, data, { merge: true })`. Nested maps
 * merge key by key, so only the touched lessons and questions are written;
 * `deleteField()` removes a single key.
 */
export function toFirestorePatch(patch: ProgressPatch, ops: FieldOps): Record<string, unknown> {
  const data: Record<string, unknown> = { version: 2, updatedAt: ops.serverTimestamp() };

  const learned: Record<string, unknown> = { ...patch.learnedSet };
  for (const slug of patch.learnedRemove) learned[slug] = ops.deleteField();
  if (Object.keys(learned).length) data['learned'] = learned;

  const questions: Record<string, unknown> = { ...patch.questionsSet };
  for (const id of patch.questionsRemove) questions[id] = ops.deleteField();
  if (Object.keys(questions).length) data['questions'] = questions;

  // arrayUnion/arrayRemove keep two devices' bookmark edits from clobbering each
  // other; they cannot share one write, so a mixed edit sends the whole list.
  if (patch.bookmarksAdd.length && !patch.bookmarksRemove.length) {
    data['bookmarks'] = ops.arrayUnion(...patch.bookmarksAdd);
  } else if (patch.bookmarksRemove.length && !patch.bookmarksAdd.length) {
    data['bookmarks'] = ops.arrayRemove(...patch.bookmarksRemove);
  } else if (patch.bookmarksAdd.length && patch.bookmarksRemove.length) {
    data['bookmarks'] = patch.bookmarks;
  }

  if (patch.lastOpened !== undefined) data['lastOpened'] = patch.lastOpened;
  if (patch.sessions !== undefined) data['sessions'] = patch.sessions;
  if (patch.legacyImported !== undefined) data['legacyImported'] = patch.legacyImported;
  return data;
}

// ---------------------------------------------------------------------------
// Parsing — never trust what comes back from the network.
// ---------------------------------------------------------------------------

const MODES: readonly QuizMode[] = ['quick', 'topic', 'missed'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Turns a Firestore document into a valid {@link UserProgress}, dropping anything malformed. */
export function parseRemoteProgress(data: unknown): UserProgress {
  const result = emptyProgress();
  if (!isRecord(data)) return result;

  if (isRecord(data['learned'])) {
    for (const [slug, at] of Object.entries(data['learned'])) {
      if (typeof at === 'string') result.learned[slug] = at;
    }
  }
  result.bookmarks = stringList(data['bookmarks']);
  if (typeof data['lastOpened'] === 'string') result.lastOpened = data['lastOpened'];

  if (isRecord(data['questions'])) {
    for (const [id, s] of Object.entries(data['questions'])) {
      if (isRecord(s) && typeof s['seen'] === 'number' && typeof s['correct'] === 'number') {
        result.questions[id] = {
          seen: s['seen'],
          correct: s['correct'],
          lastCorrect: s['lastCorrect'] === true,
        };
      }
    }
  }

  if (Array.isArray(data['sessions'])) {
    for (const s of data['sessions']) {
      if (
        isRecord(s) &&
        typeof s['at'] === 'string' &&
        MODES.includes(s['mode'] as QuizMode) &&
        typeof s['total'] === 'number' &&
        typeof s['correct'] === 'number'
      ) {
        result.sessions.push({
          at: s['at'],
          mode: s['mode'] as QuizMode,
          topics: stringList(s['topics']),
          total: s['total'],
          correct: s['correct'],
          missed: stringList(s['missed']),
        });
      }
    }
    result.sessions = result.sessions.slice(0, MAX_SESSIONS);
  }

  result.legacyImported = stringList(data['legacyImported']);
  return result;
}

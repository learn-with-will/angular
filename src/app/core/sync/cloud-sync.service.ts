import { Injectable, NgZone, computed, effect, inject, signal, untracked } from '@angular/core';
import type { DocumentReference, DocumentSnapshot } from 'firebase/firestore';
import { COURSE_ID } from '../firebase/firebase.config';
import { FirebaseServices, loadFirebase } from '../firebase/firebase.client';
import { UserProgress, emptyProgress } from '../models/progress.model';
import { AuthService } from '../services/auth.service';
import { ProgressService, ProgressSink } from '../services/progress.service';
import {
  applyPatch,
  diffProgress,
  isEmptyProgress,
  mergeProgress,
  parseRemoteProgress,
  toFirestoreData,
  toFirestorePatch,
} from './progress-sync';

/**
 * A local change the server has not acknowledged yet, as a function that lays it
 * over a snapshot. Snapshots can lag behind local edits (one already in flight
 * when the learner taps, or any snapshot while offline), so every snapshot is
 * shown with these re-applied on top; otherwise it would briefly roll the UI back.
 */
type PendingChange = (snapshot: UserProgress) => UserProgress;

/**
 * - `off`: signed out (or Firebase not configured): progress lives on this device.
 * - `connecting`: signed in, waiting for the account's progress to arrive.
 * - `synced` / `saving` / `offline`: connected; `saving` and `offline` mean edits are queued.
 * - `error`: the account could not be reached or refused access; progress stays on this device.
 */
export type SyncState = 'off' | 'connecting' | 'synced' | 'saving' | 'offline' | 'error';

/**
 * Keeps the learner's progress in Firestore at `users/{uid}/progress/{COURSE_ID}`
 * while they are signed in.
 *
 * How it fits together:
 *  1. Sign-in: wait for the account's document, merge it with whatever this device
 *     learned while signed out, write the result back, then drop the device copy.
 *  2. While signed in: every edit becomes a small patch (see `diffProgress`) and
 *     the document is followed live, so other devices' changes appear here.
 *  3. Sign-out: progress returns to this device's own (now empty) local copy, so a
 *     shared computer never shows the previous learner's progress.
 *
 * Firestore's own persistent cache makes this work offline: edits queue up and
 * flush when the connection returns.
 */
@Injectable({ providedIn: 'root' })
export class CloudSyncService implements ProgressSink {
  private readonly auth = inject(AuthService);
  private readonly progress = inject(ProgressService);
  private readonly zone = inject(NgZone);

  private readonly _state = signal<SyncState>('off');
  readonly state = this._state.asReadonly();

  /** Bumped on every start/stop so a slow async step from an old session is ignored. */
  private session = 0;
  private attached = false;
  private unsubscribe: (() => void) | null = null;
  private target: { ref: DocumentReference; fb: FirebaseServices } | null = null;
  private pending: PendingChange[] = [];

  /** A primitive, so a repeated emission for the same learner does not restart the sync. */
  private readonly uid = computed(() => this.auth.user()?.uid ?? null);

  constructor() {
    effect(() => {
      const uid = this.uid();
      untracked(() => (uid ? void this.start(uid) : this.stop()));
    });
  }

  // ---- ProgressSink ------------------------------------------------------

  push(prev: UserProgress, next: UserProgress): void {
    const patch = diffProgress(prev, next);
    const target = this.target;
    if (!patch || !target) return;
    const data = toFirestorePatch(patch, target.fb.fsApi);
    this.track((snapshot) => applyPatch(snapshot, patch), target.fb.fsApi.setDoc(target.ref, data, { merge: true }));
  }

  replace(next: UserProgress): void {
    const target = this.target;
    if (!target) return;
    const { fsApi } = target.fb;
    this.track(
      () => next,
      fsApi.setDoc(target.ref, { ...toFirestoreData(next), updatedAt: fsApi.serverTimestamp() }),
    );
  }

  // ---- lifecycle ---------------------------------------------------------

  private async start(uid: string): Promise<void> {
    this.stop();
    const session = this.session;
    this._state.set('connecting');

    let fb: FirebaseServices;
    try {
      fb = await this.zone.runOutsideAngular(() => loadFirebase());
    } catch {
      if (session === this.session) this._state.set('error');
      return;
    }
    if (session !== this.session) return; // signed out (or switched) while loading

    const ref = fb.fsApi.doc(fb.db, 'users', uid, 'progress', COURSE_ID);
    this.target = { ref, fb };

    // Run the listener outside Angular's zone (it fires on every network event) and
    // step back in only to touch signals.
    this.unsubscribe = this.zone.runOutsideAngular(() =>
      fb.fsApi.onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) => this.zone.run(() => session === this.session && this.onSnapshot(snap, ref, fb)),
        (err) => this.zone.run(() => session === this.session && this.onListenError(err)),
      ),
    );
  }

  private stop(): void {
    this.session++;
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.target = null;
    this.attached = false;
    this.pending = [];
    if (this.progress.isCloud()) this.progress.detachCloud();
    this._state.set('off');
  }

  // ---- Firestore events --------------------------------------------------

  private onSnapshot(snap: DocumentSnapshot, ref: DocumentReference, fb: FirebaseServices): void {
    const remote = snap.exists() ? parseRemoteProgress(snap.data()) : null;

    if (!this.attached) {
      // A cache-only "no such document" just means nothing is cached yet on this
      // device. Wait for the server's answer before treating the account as empty.
      if (!remote && snap.metadata.fromCache) return;
      this.attached = true;
      this.attach(remote, ref, fb);
    } else if (remote || !snap.metadata.fromCache) {
      // `remote` is null only when the document was deleted elsewhere; a cache-only
      // "missing" is not trusted. Unacknowledged edits are laid back over the top.
      this.progress.applyRemote(this.rebase(remote ?? emptyProgress()));
    }

    this._state.set(this.stateOf(snap));
  }

  /** First contact with the account: fold in this device's progress, then switch over. */
  private attach(remote: UserProgress | null, ref: DocumentReference, fb: FirebaseServices): void {
    const local = this.progress.peekLocal();
    const hasLocal = !isEmptyProgress(local);
    const merged = remote ? mergeProgress(remote, local) : local;

    this.progress.attachCloud(this, merged);

    // Create the document if it does not exist yet, and upload anything learned
    // while signed out. Only once the server has accepted it is the device copy
    // redundant, so only then is it cleared.
    if (hasLocal || !remote) {
      const { fsApi } = fb;
      this.track(
        (snapshot) => mergeProgress(snapshot, local),
        fsApi.setDoc(ref, { ...toFirestoreData(merged), updatedAt: fsApi.serverTimestamp() }, { merge: true }),
      ).then((ok) => ok && hasLocal && this.progress.clearLocal());
    }
  }

  /** What to show for `snapshot`: the server's copy plus every edit it has not acknowledged yet. */
  private rebase(snapshot: UserProgress): UserProgress {
    return this.pending.reduce((state, change) => change(state), snapshot);
  }

  /** Follows a write until the server answers; only then is its change no longer "pending". */
  private track(change: PendingChange, pending: Promise<void>): Promise<boolean> {
    this.pending.push(change);
    return this.write(pending).finally(() => {
      this.pending = this.pending.filter((c) => c !== change);
    });
  }

  private onListenError(err: unknown): void {
    console.warn('[sync] could not read your saved progress; staying on this device', err);
    this._state.set('error');
  }

  /** Tracks a write; a failure is surfaced in the sync state rather than thrown. */
  private write(pending: Promise<void>): Promise<boolean> {
    return pending.then(
      () => true,
      (err) => {
        console.warn('[sync] could not save progress to your account', err);
        this.zone.run(() => this._state.set('error'));
        return false;
      },
    );
  }

  private stateOf(snap: DocumentSnapshot): SyncState {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (snap.metadata.hasPendingWrites) return offline ? 'offline' : 'saving';
    if (snap.metadata.fromCache && offline) return 'offline';
    return 'synced';
  }
}

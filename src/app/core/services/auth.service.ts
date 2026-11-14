import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import type { User } from 'firebase/auth';
import { AUTH_PROVIDERS, AuthProviderId, isFirebaseConfigured } from '../firebase/firebase.config';
import { FirebaseServices, loadFirebase } from '../firebase/firebase.client';

/** The few fields of a signed-in learner the UI needs. */
export interface AccountUser {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * - `disabled`: Firebase is not configured, so the app is local-only and shows no sign-in UI.
 * - `checking`: a returning learner's session is being restored.
 */
export type AuthStatus = 'disabled' | 'signed-out' | 'checking' | 'signed-in';

/**
 * Shared by every course on this origin: Firebase keeps the session in IndexedDB
 * for the whole origin, so one sign-in covers all courses. This flag says "there is
 * probably a session to restore", which lets signed-out visitors skip loading the
 * Firebase SDK entirely.
 */
const SIGNED_IN_HINT_KEY = 'learn-with-will:signed-in';

/** Sign-in codes that mean "the learner changed their mind", not "something broke". */
const QUIET_ERRORS = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

const ERROR_MESSAGES: Record<string, string> = {
  'auth/popup-blocked': 'Your browser blocked the sign-in pop-up. Allow pop-ups for this site and try again.',
  'auth/network-request-failed': 'Could not reach the sign-in service. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not turned on yet. Try another one.',
  'auth/unauthorized-domain': 'Sign-in is not set up for this web address yet.',
  'auth/account-exists-with-different-credential':
    'An account with this email already exists using a different sign-in method. Try the other one.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
};

/**
 * Optional sign-in. Learning never requires it: when signed out (or Firebase is not
 * configured) everything works from localStorage. Firebase is loaded lazily, and
 * outside Angular's zone so its network chatter does not trigger change detection.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly zone = inject(NgZone);

  private readonly _user = signal<AccountUser | null>(null);
  private readonly _checking = signal(false);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _dialogOpen = signal(false);

  private services: FirebaseServices | null = null;
  private listening: Promise<void> | null = null;

  readonly enabled = isFirebaseConfigured();
  readonly providers = AUTH_PROVIDERS;

  readonly user = this._user.asReadonly();
  /** A sign-in is in flight (pop-up open). */
  readonly busy = this._busy.asReadonly();
  /** A message for the sign-in dialog, or null. */
  readonly error = this._error.asReadonly();
  readonly dialogOpen = this._dialogOpen.asReadonly();

  readonly status = computed<AuthStatus>(() => {
    if (!this.enabled) return 'disabled';
    if (this._user()) return 'signed-in';
    return this._checking() ? 'checking' : 'signed-out';
  });

  constructor() {
    // Returning learner: restore the session in the background.
    if (this.enabled && this.hasHint()) {
      this._checking.set(true);
      this.listen().catch(() => this._checking.set(false));
    }
  }

  openSignIn(): void {
    if (!this.enabled) return;
    this._error.set(null);
    this._dialogOpen.set(true);
    // Warm the SDK while the dialog is up, so the pop-up opens straight from the
    // click on a provider button (browsers block pop-ups opened after a delay).
    this.listen().catch(() => undefined);
  }

  closeSignIn(): void {
    this._dialogOpen.set(false);
  }

  /** Opens the provider's pop-up. Resolves true when the learner ended up signed in. */
  async signIn(id: AuthProviderId): Promise<boolean> {
    if (this._busy()) return false;
    this._error.set(null);
    this._busy.set(true);
    try {
      // Normally already loaded by openSignIn(); the await is then skipped, which
      // keeps signInWithPopup inside the click's user gesture.
      let fb = this.services;
      if (!fb) {
        await this.listen();
        fb = this.services;
      }
      if (!fb) throw new Error('Firebase did not load');
      const provider =
        id === 'github' ? new fb.authApi.GithubAuthProvider() : new fb.authApi.GoogleAuthProvider();
      await this.zone.runOutsideAngular(() => fb.authApi.signInWithPopup(fb.auth, provider));
      this._dialogOpen.set(false);
      return true;
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (!QUIET_ERRORS.has(code)) {
        this._error.set(ERROR_MESSAGES[code] ?? 'Sign-in did not work. Please try again.');
      }
      return false;
    } finally {
      this._busy.set(false);
    }
  }

  async signOut(): Promise<void> {
    const fb = this.services;
    if (!fb) return;
    try {
      await this.zone.runOutsideAngular(() => fb.authApi.signOut(fb.auth));
    } catch {
      /* nothing useful to do; the auth listener reports the real state */
    }
  }

  /** Loads Firebase and starts following the sign-in state (once). */
  private listen(): Promise<void> {
    this.listening ??= this.zone
      .runOutsideAngular(() => loadFirebase())
      .then((fb) => {
        this.services = fb;
        fb.authApi.onAuthStateChanged(fb.auth, (user) => this.zone.run(() => this.apply(user)));
      })
      .catch((err) => {
        this.listening = null; // retry on the next attempt
        throw err;
      });
    return this.listening;
  }

  private apply(user: User | null): void {
    this._checking.set(false);
    if (user) {
      this._user.set({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
      this.setHint(true);
      this._dialogOpen.set(false); // signed in, whichever way it happened
    } else {
      this._user.set(null);
      this.setHint(false);
    }
  }

  private hasHint(): boolean {
    try {
      return localStorage.getItem(SIGNED_IN_HINT_KEY) === '1';
    } catch {
      return false;
    }
  }

  private setHint(on: boolean): void {
    try {
      if (on) localStorage.setItem(SIGNED_IN_HINT_KEY, '1');
      else localStorage.removeItem(SIGNED_IN_HINT_KEY);
    } catch {
      /* storage may be unavailable; the session still works for this visit */
    }
  }
}

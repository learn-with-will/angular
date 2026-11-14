/**
 * Firebase settings for optional sign-in and progress sync.
 *
 * Fill in `FIREBASE_CONFIG` from Firebase console → Project settings → Your apps →
 * Web app → "SDK setup and configuration". Until you do, the app behaves exactly as
 * it did before: no sign-in button, progress stays in this browser.
 *
 * These values are NOT secrets. They only identify the project to Google; what a
 * visitor can actually read or write is decided by `firestore.rules`, and which
 * sites may start a sign-in by "Authorized domains" in the Auth settings. It is
 * safe (and normal) to commit them to a public repository.
 *
 * The same project can serve every course: each course writes its own document,
 * `users/{uid}/progress/{COURSE_ID}`.
 */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  // Present in the snippet the Firebase console generates; not needed for sign-in or sync,
  // but accepted so the snippet can be pasted in unchanged.
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

export const FIREBASE_CONFIG: FirebaseWebConfig = {
  apiKey: "AIzaSyBHckDNcX2_WNppA4Ux4p0wwMGi7sYha_M",
  authDomain: "learn-with-will.firebaseapp.com",
  projectId: "learn-with-will",
  storageBucket: "learn-with-will.firebasestorage.app",
  messagingSenderId: "566869077403",
  appId: "1:566869077403:web:ac2de6a4b14cabf766c53e",
  measurementId: "G-W4RHKQ6H5D"
};

/** Which course this app is; names its progress document in Firestore. */
export const COURSE_ID = 'angular';

/** Sign-in methods offered in the dialog. Each one must also be enabled in the Firebase console. */
export type AuthProviderId = 'google' | 'github';
export const AUTH_PROVIDERS: readonly AuthProviderId[] = ['google', 'github'];

/**
 * Talk to the local Firebase emulators (`npm run emulators`) instead of the real
 * project, using the throwaway project below, so no real settings are needed.
 * Leave `false` in anything you commit or deploy.
 */
export const USE_EMULATORS = false;

/** Ids starting with `demo-` tell the emulators to run fully offline. Matches `npm run emulators`. */
export const EMULATOR_CONFIG: FirebaseWebConfig = {
  apiKey: 'demo-key',
  authDomain: 'localhost',
  projectId: 'demo-angular-learn',
  appId: 'demo-app',
};

/** False while the placeholders above are still in place. */
export function isFirebaseConfigured(): boolean {
  return USE_EMULATORS || !FIREBASE_CONFIG.apiKey.startsWith('REPLACE_');
}

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { EMULATOR_CONFIG, FIREBASE_CONFIG, USE_EMULATORS } from './firebase.config';

/** Everything the app needs from Firebase, loaded together on first use. */
export interface FirebaseServices {
  auth: Auth;
  db: Firestore;
  authApi: typeof import('firebase/auth');
  fsApi: typeof import('firebase/firestore');
}

let loading: Promise<FirebaseServices> | null = null;

/**
 * Loads and initialises Firebase once. The SDK is pulled in with dynamic imports so
 * it becomes its own lazy chunks: visitors who never sign in never download it, and
 * the initial bundle stays small.
 */
export function loadFirebase(): Promise<FirebaseServices> {
  loading ??= init().catch((err) => {
    loading = null; // allow a retry after a failed (e.g. offline) load
    throw err;
  });
  return loading;
}

async function init(): Promise<FirebaseServices> {
  const [{ initializeApp, getApps, getApp }, authApi, fsApi] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);

  const app = getApps().length
    ? getApp()
    : initializeApp(USE_EMULATORS ? EMULATOR_CONFIG : FIREBASE_CONFIG);
  const auth = authApi.getAuth(app);

  // A persistent cache keeps progress readable offline and queues edits made while
  // offline; the multi-tab manager lets several open tabs share it.
  let db: Firestore;
  try {
    db = fsApi.initializeFirestore(app, {
      localCache: fsApi.persistentLocalCache({ tabManager: fsApi.persistentMultipleTabManager() }),
    });
  } catch {
    db = fsApi.getFirestore(app); // already initialised (e.g. a dev-server hot reload)
  }

  if (USE_EMULATORS) {
    authApi.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    fsApi.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }

  return { auth, db, authApi, fsApi };
}

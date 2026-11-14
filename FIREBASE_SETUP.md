# Sign-in and progress sync (Firebase)

Learning never requires an account. Without one, progress is saved in the browser exactly as
before. With the setup below, a learner can optionally sign in (Google or GitHub) and their
progress follows them to any device.

Until you fill in the Firebase settings, **none of this appears**: no sign-in button, no
Firebase code downloaded, nothing changes.

## What learners get

- A **Sign in** button in the top bar and a short note on the dashboard.
- Progress made *before* signing in is merged into the account, so nothing is lost.
- Changes show up on their other devices within a second or two, and edits made offline are
  saved when the connection returns.
- **Sign out** leaves nothing of the account on the device (important on shared computers).

## How it works

| Piece | Where |
| --- | --- |
| Settings and switches | `src/app/core/firebase/firebase.config.ts` |
| Lazy SDK loader (Firebase is a separate chunk, only fetched when needed) | `src/app/core/firebase/firebase.client.ts` |
| Sign-in state | `src/app/core/services/auth.service.ts` |
| Merge, diff and (de)serialisation rules, with no Firebase imports | `src/app/core/sync/progress-sync.ts` |
| Keeps Firestore and `ProgressService` in step | `src/app/core/sync/cloud-sync.service.ts` |
| UI | `shared/components/account-menu`, `shared/components/sign-in-dialog` |
| Security rules | `firestore.rules` |

**Data model.** One document per learner per course: `users/{uid}/progress/{COURSE_ID}`
(`COURSE_ID` is `angular`). It holds the same shape as the local progress: `learned`,
`bookmarks`, `lastOpened`, `questions`, `sessions`, `legacyImported`, plus `version` and
`updatedAt`.

**Sync rules** (all covered by unit tests in `progress-sync.spec.ts`):

- On sign-in the account's progress and this device's progress are **merged by union**: nothing
  is dropped. For a lesson learned on both, the earlier date wins; for a question answered on
  both, the tally that has seen more answers wins.
- After that the account is the single source of truth. Each edit is written as a small patch
  (only the lesson or question that changed), so a device that opened with stale data can never
  overwrite what another device saved.
- Edits not yet acknowledged by the server are shown on top of every incoming update, so the
  screen never jumps back while a save is in flight or the learner is offline.

## One-time setup

1. **Create a project** at <https://console.firebase.google.com>. The free Spark plan is plenty
   for a pilot (check current quotas; every learner edit is one small write).
2. **Add a web app** (Project settings, Your apps, `</>`). Copy the config object into
   `FIREBASE_CONFIG` in `src/app/core/firebase/firebase.config.ts`. These values are not
   secrets and are safe to commit; the rules in step 6 are what protect the data.
3. **Authentication, Sign-in method**: enable **Google**. GitHub is optional: create an OAuth app
   at <https://github.com/settings/developers>, use the callback URL Firebase shows you, and paste
   its client ID and secret into the GitHub provider. Remove any provider you did not enable from
   `AUTH_PROVIDERS` in the same config file.
4. **Authentication, Settings, Authorized domains**: add `learn-with-will.github.io`. This one
   entry covers the portal and every course. (`localhost` is already allowed.)
5. **Firestore Database, Create database**. Pick a region close to your learners; it cannot be
   changed later. Start in production mode.
6. **Publish the rules** in `firestore.rules`, either by pasting them into the Rules tab or with
   the CLI:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project <your-project-id>
   ```

7. Paste the same config into the portal's `index.html` (it is already there if you copied it from
   this file), then commit and push both repositories. The existing GitHub Actions workflow
   builds and deploys the course as usual; the portal is a plain static file.

Finish steps 3 to 6 **before** you push: as soon as the config is filled in, the Sign in button
appears, and it can only work once the provider, authorized domain, database and rules exist.

## Developing locally with the emulators

The emulators run Firebase on your own machine, so you can try sign-in and sync without a real
project. They need Java 21 or newer.

```bash
npm run emulators      # Auth on :9099, Firestore on :8080
```

Then set `USE_EMULATORS = true` in `firebase.config.ts` and run `npm start`. The sign-in pop-up
becomes a local page where you choose **Add new account** and sign in as a made-up user. Set the
flag back to `false` before you commit.

## One sign-in for the portal and every course

The portal home page (`https://learn-with-will.github.io/`) and every course
(`https://learn-with-will.github.io/<course>/`) are served from the **same origin**, and Firebase
keeps the sign-in session in that origin's browser storage. So signing in on the portal also signs
you in to the Angular course, and the other way round; signing out in one place signs out of both.
The portal's sign-in lives in `index.html` (the "OPTIONAL SIGN-IN" script) and loads only
Firebase Authentication, from Google's CDN, because it needs to know who you are, not to store
progress.

For the session to be shared, every page that offers sign-in must agree on these three things:

| Must match | Angular course | Portal `index.html` |
| --- | --- | --- |
| Firebase project settings (at least `apiKey`; paste the console snippet unchanged into both) | `FIREBASE_CONFIG` in `firebase.config.ts` | `FIREBASE_CONFIG` in the sign-in script |
| Session hint key, `learn-with-will:signed-in` | `auth.service.ts` | `HINT_KEY` |
| Firebase SDK version (the CDN URL uses the same version as the `firebase` npm package) | `package.json` | `SDK_BASE` |

If you update the `firebase` package, bump `SDK_BASE` in the portal to match. This only holds on
the real site: `localhost:4200` and `localhost:<other port>` are different origins, so locally the
portal and a course do not share a session.

Each course writes its own `users/{uid}/progress/{courseId}` document, and the rules already allow
any `courseId`. The Angular files can be copied to another Angular course by changing
`COURSE_ID`. The React and Vue courses need the three service files ported to their framework, but
`progress-sync.ts` is framework-free and the Firestore data model and rules are shared as they are.

## Good to know

- Sign-in uses a **pop-up**. Redirect sign-in is unreliable on a `github.io` address because
  browsers now partition storage between the site and Firebase's sign-in domain.
- Firebase Authentication stores each learner's name and email. Because this site would then hold
  personal data, consider adding a short privacy note and a way to delete an account before you
  roll this out beyond the pilot.
- `Reset progress` on the dashboard clears the account copy too, on every device.

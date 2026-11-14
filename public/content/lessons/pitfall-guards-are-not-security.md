---
slug: pitfall-guards-are-not-security
title: "Pitfall: guards are not security"
topic: routing
kind: pitfall
summary: "A route guard only hides screens in the browser; the real protection must live on the server."
tags: [routing, guards, security, auth]
related: [can-activate, can-match, navigation-lifecycle, guard-factories]
---
> **In one line:** A guard decides what the *browser* shows. Anyone can open DevTools, change the code or call your API directly, so every protected endpoint must enforce access on the server.

## The idea

Angular runs in the user's browser, and everything the browser runs belongs to the user. They can pause execution and flip `isLoggedIn` to `true`, edit the JavaScript, or skip the UI entirely and call `GET /api/admin/users` with a script. A guard cannot stop any of that, because it never sees those requests.

So what is a guard for? **Usability.** It keeps honest users out of screens that would only show errors, redirects them to login with a good message, and avoids loading code they cannot use. It is a signpost, not a lock.

```sequence
actor user: User
actor app: Angular app
actor api: Server API
user -> app: Opens `/admin`
app --> user: Guard redirects to login
note app: UX only, easy to bypass @amber
user -> api: Calls `/api/admin/users` directly | skips the app entirely
api --> user: `403 Forbidden`
note api: The server is the real gate @green
```

## See it

```typescript
// Client: a convenience for the user
export const adminGuard: CanActivateFn = () =>
  inject(AuthService).hasRole('admin') || inject(Router).createUrlTree(['/forbidden']);
```

```typescript
// Server (pseudo-code): the actual enforcement, on every request
app.get('/api/admin/users', requireRole('admin'), (req, res) => {
  res.json(listUsers());
});
```

The client also has to cope with the server saying no. An HTTP interceptor can catch `401` and `403` and send the user to login or a forbidden page, which keeps the UI honest when a session expires mid-visit.

## Go deeper

There is a practical split of responsibilities. The client keeps a *copy* of the user's roles, usually from a token, purely so it can hide buttons, skip menu entries and redirect politely. The server never trusts that copy: it reads the roles from the verified session or token on each request and decides again. If the two ever disagree, the server wins, and the client should react to the `403` by refreshing its view of the user.

Treat anything you ship in the bundle as public: API keys that grant power, hidden "admin" routes whose existence is a secret, or business rules that decide who may do what. If it matters, it belongs behind an authenticated, authorised server call.

A useful habit when reviewing a feature is to ask: *what if someone skipped my UI and sent the request themselves?* If the answer is "they could see or change something they should not", the fix is on the server, not in another guard.

Lazy loading does not make code private either. A `canMatch` guard stops the chunk being served through the router, but the file is still a public URL that anyone can request.

## Watch out

- Believing a guarded route means protected data. The API must check permissions itself.
- Putting secrets in the Angular bundle or environment files.
- Skipping `401` and `403` handling because "the guard already checked".

## Remember

- Guards are UX, not security.
- Enforce authentication and authorisation on the server for every request.
- Treat the bundle and its routes as public.

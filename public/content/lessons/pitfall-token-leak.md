---
slug: pitfall-token-leak
title: "Pitfall: leaking the auth token"
topic: http
kind: pitfall
summary: "An auth interceptor that attaches the token to every URL sends it to third parties. Check the host first."
tags: [http, interceptors, auth, security]
related: [functional-interceptor, interceptor-order, pitfall-guards-are-not-security, http-context]
---
> **In one line:** An interceptor that adds `Authorization` to every request will hand your token to every third-party API and CDN your app calls. Check the host first.

## The idea

`HttpClient` interceptors run for *all* requests, not just your own API. If the app also loads a fonts service, an analytics endpoint or a public API, an unconditional auth interceptor attaches the user's bearer token to those calls too. The third party now holds a credential that works against your backend.

The fix is a one-line allow-list check. Compare the request URL with your API's base URL, and attach the token only on a match.

| Request | Should carry the token? |
|---|---|
| `https://api.example.com/diary` | yes, it is your API |
| `https://fonts.example.net/css` | no, third party |
| `content/course-manifest.json` | no, a static asset |

Rewrites share the same trap in reverse: a base-URL interceptor that touches every relative path also redirects assets to the API server.

## See it

```typescript
// Before: every host gets the token
export const authInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { Authorization: `Bearer ${inject(AuthService).token()}` } }));

// After: only our own API, only when signed in
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const isOurApi = req.url.startsWith(inject(API_BASE_URL));

  if (!token || !isOurApi) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

## Go deeper

This check only works if the URL is already absolute when the auth interceptor runs. That is why the base-URL interceptor must come first in the array: it turns `api/diary` into the full address that `startsWith(API_BASE_URL)` can compare. Put them the other way round and the host check never matches, so no request is authorised and every call returns `401`.

Prefix matching is easy to defeat: `https://api.example.com.evil.net` starts with `https://api.example.com`. For anything sensitive, parse the URL and compare the **origin** exactly, or end the base URL with a slash.

Remember the bigger picture. A token in browser memory or storage is reachable by any script on the page, so keep tokens short-lived and prefer secure, HTTP-only cookies where the backend supports them.

Treat the allow-list as configuration, not a string buried in an interceptor. An `API_BASE_URL` injection token, as in the base-URL lesson, gives you one place to change per environment, and the interceptor reads it with `inject()`. Tests can then provide a different value without editing code.

It is also worth an automated check. A two-line spec that sends a request to a foreign host and asserts there is no `Authorization` header costs almost nothing and catches the day someone "simplifies" the interceptor.

## Watch out

- An auth interceptor with no host check.
- Prefix checks that a lookalike domain can satisfy.
- Putting auth before the base-URL rewrite, so the check never matches.

## Remember

- Interceptors see every request, so filter to your own API.
- Compare the origin exactly, and run auth after the URL is final.
- Keep tokens short-lived.

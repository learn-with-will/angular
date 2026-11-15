---
slug: cors-dev-proxy
title: "CORS and the dev-server proxy"
topic: http
kind: technique
summary: "The browser enforces CORS and the server allows it. In development, a proxy sidesteps it cleanly."
tags: [http, cors, proxy, development]
related: [http-error-response, http-client-setup, data-service, ng-serve-and-build]
---
> **In one line:** CORS is enforced by the browser and granted by the server, so no Angular setting can bypass it. In development, proxy API calls through the dev server instead.

## The idea

A page on `http://localhost:4200` is a different **origin** from an API on `http://localhost:3000`. By default the browser lets the page send the request but refuses to let it *read* the response, unless the server answers with CORS headers that allow that origin.

The failing request shows up as an `HttpErrorResponse` with status `0` and a console message about CORS. It looks like a network problem, but it is a permission problem.

| Place | Fix |
|---|---|
| Development | the Angular dev server proxies `/api` to the backend |
| Production | the real server, or a reverse proxy, sends the right CORS headers (or serves both on one origin) |
| Anywhere | **not** a client-side flag; there is none |

With a proxy, the app calls `/api/products` on its *own* origin, and the dev server forwards the request to port 3000, so the browser sees no cross-origin call at all.

## See it

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

```bash
ng serve --proxy-config proxy.conf.json
```

Or make it permanent in `angular.json` under the `serve` options:

```json
"serve": { "options": { "proxyConfig": "proxy.conf.json" } }
```

Then call relative URLs only, for example `this.http.get('/api/products')`.

## Go deeper

Because the proxy keeps URLs relative, the same code works in production behind a reverse proxy that serves the app and the API from one origin. That setup avoids CORS completely and is simpler to secure than opening the API to other origins.

If you do need cross-origin calls in production, configure the server with an explicit allow-list of origins. Avoid `*` for APIs that use cookies or authorisation headers, since browsers refuse the combination.

Custom request headers, and verbs such as `PUT` or `DELETE`, trigger a **preflight** `OPTIONS` request first. A server that does not answer it correctly fails even though the real call would have succeeded, which is one more reason to prefer a single origin.

A quick way to tell the two failures apart is the network tab. A CORS block shows the request leaving with a response that the browser then hides, and the console names the missing `Access-Control-Allow-Origin` header. A genuinely unreachable server shows a failed connection with no response at all. Both reach your code as status `0`, which is why reading the console matters more than the status.

When the proxy does not seem to work, check three things: the dev server was restarted after editing `proxy.conf.json` (it is read at startup), the path prefix matches exactly (`/api`), and the app calls a relative URL rather than a full `http://localhost:3000` address, which bypasses the proxy completely.

## Watch out

- Searching for an Angular setting that disables CORS. It does not exist.
- Hard-coding `http://localhost:3000` in services, so production breaks.
- Allowing every origin with `*` on an API that uses credentials.

## Remember

- CORS is a browser rule satisfied by the server.
- Proxy `/api` through `ng serve` while developing.
- Prefer relative URLs and one origin in production.

---
slug: testing-http
title: "Testing HTTP with HttpTestingController"
topic: http
kind: technique
summary: "Exercise real interceptors and services through a real HttpClient, with a controller standing in for the network."
tags: [http, testing, httptestingcontroller, interceptors]
related: [functional-interceptor, data-service, interceptor-order, pitfall-token-leak]
---
> **In one line:** Provide `HttpClient` normally, add `provideHttpClientTesting()` after it, and answer requests by hand with `HttpTestingController`.

## The idea

You want tests that run the **real** interceptors and services but never touch a network. `HttpTestingController` replaces the backend: every request the code makes is captured, and your test decides what the "server" answers.

| Step | What you write |
|---|---|
| configure | `provideHttpClient(withInterceptors([...]))`, then `provideHttpClientTesting()` |
| trigger | call the service, or `http.get(...).subscribe()` |
| assert | `controller.expectOne(url)` and inspect `request.headers`, `method`, `body` |
| answer | `request.flush(body)` or `request.flush(null, { status: 500, statusText: 'Server Error' })` |
| clean up | `controller.verify()` in `afterEach` |

The order of the providers matters: `provideHttpClientTesting()` must come **after** `provideHttpClient()`, or the real backend stays in place.

## See it

```typescript
describe('baseUrlInterceptor + authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: 'https://api.test' },
        { provide: AuthService, useValue: { token: signal('abc123') } },
        provideHttpClient(withInterceptors([baseUrlInterceptor, authInterceptor])),
        provideHttpClientTesting(), // after provideHttpClient
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => controller.verify()); // fails if a request was left unanswered

  it('rewrites api/ URLs and attaches the token', () => {
    http.get('api/diary').subscribe();
    const call = controller.expectOne('https://api.test/diary');
    expect(call.request.headers.get('Authorization')).toBe('Bearer abc123');
    call.flush({ items: [] });
  });
});
```

## Go deeper

A second test should prove the **negative**: a request to another host must not carry the token. Security rules are exactly the kind of behaviour that regresses silently, and the test is two lines:

```typescript
http.get('https://other.example/data').subscribe();
const call = controller.expectOne('https://other.example/data');
expect(call.request.headers.has('Authorization')).toBe(false);
```

`controller.verify()` is what makes the suite honest. Without it, a request your code made but your test never matched would pass unnoticed.

To test error handling, flush with a failing status and assert on what the component or service did with it. This is the branch nobody clicks through by hand. Vitest runs these specs the same way, since the controller is plain Angular.

## Watch out

- Putting `provideHttpClientTesting()` before `provideHttpClient()`.
- Skipping `controller.verify()`.
- Testing only the success path.

## Remember

- Real `HttpClient` plus `provideHttpClientTesting()` captures requests.
- `expectOne`, inspect, then `flush` the reply.
- Verify in `afterEach`, and test the negative cases.

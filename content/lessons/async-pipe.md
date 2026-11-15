---
slug: async-pipe
title: "The async pipe"
topic: directives-pipes
kind: api
summary: "Show the latest value of an Observable or Promise, subscribing and unsubscribing for you."
tags: [pipes, observables, async, subscriptions]
related: [builtin-pipes, pure-and-impure-pipes, pitfall-forgotten-cleanup, pipe-basics]
---
> **In one line:** `observable$ | async` subscribes to an Observable or Promise, renders its latest value, and unsubscribes automatically when the component is destroyed.

## The idea

A lot of data arrives over time: an HTTP response, a timer, a stream of messages. Displaying it by hand means subscribing in the class, storing each value in a field, and remembering to unsubscribe, or you leak memory. The `async` pipe does all three in the template.

It subscribes when the template renders, returns the most recent emitted value, marks the view for update when a new value arrives, and **unsubscribes when the component is destroyed**. Until the first value arrives it returns `null`, so a loading state is natural.

The important habit is to subscribe once. Every `| async` on the same Observable creates its own subscription, and for something like an HTTP call, its own request.

## See it

```typescript
@Component({
  selector: 'app-clock',
  imports: [AsyncPipe, DatePipe],
  template: `
    @if (now$ | async; as now) {
      <p>Current time: {{ now | date:'mediumTime' }}</p>
    } @else {
      <p>Loading…</p>
    }
  `,
})
export class Clock {
  // Emits the current Date once a second
  now$: Observable<Date> = interval(1000).pipe(map(() => new Date()));
}
```

`@if (now$ | async; as now)` creates **one** subscription and stores the emitted value in `now`. The `@else` branch covers the moment before the first value.

## Go deeper

Here is the mistake the alias avoids:

```html
<!-- Before: three subscriptions, possibly three HTTP requests -->
<h1>{{ (user$ | async)?.name }}</h1>
<p>{{ (user$ | async)?.email }}</p>
<p>{{ (user$ | async)?.role }}</p>

<!-- After: one subscription, reused through the alias -->
@if (user$ | async; as user) {
  <h1>{{ user.name }}</h1>
  <p>{{ user.email }}</p>
  <p>{{ user.role }}</p>
}
```

In a signals-first app, `toSignal()` is often the neater bridge: it turns an Observable into a signal you read with `user()`, with no pipe at all. The `async` pipe remains a clean choice when the Observable already lives in the class, and it works without any extra imports beyond `AsyncPipe`.

## Watch out

- Using `| async` several times on the same Observable. Each use subscribes again, so subscribe once with `@if (x$ | async; as x)`.
- Subscribing by hand as well as using the pipe. You end up with two subscriptions and a leak to manage.
- Forgetting the first value is `null`. Handle it with `@else` or `?.` so the template does not break.

## Remember

- `| async` subscribes, renders the latest value, and unsubscribes with the component.
- Subscribe once and reuse the value through `@if (x$ | async; as x)`.
- It returns `null` until the first value, so plan a loading state.

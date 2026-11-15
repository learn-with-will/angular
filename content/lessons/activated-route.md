---
slug: activated-route
title: "ActivatedRoute and paramMap"
topic: routing
kind: api
summary: "Read route parameters as a one-time snapshot or a live stream, and turn changes into requests."
tags: [routing, activatedroute, parammap, rxjs]
related: [component-input-binding, pitfall-stale-param-snapshot, route-params, query-params]
---
> **In one line:** `ActivatedRoute` holds everything the router knows about the current route. Read parameters from its **snapshot** for a one-time value, or from `paramMap` for a stream that emits on every change.

## The idea

Input binding covers simple display. When a parameter change should *trigger work*, such as fetching a user, you need the classic tool. `ActivatedRoute` is an injectable service for the currently active route, and it exposes parameters in two shapes:

| Read it with | What you get | Use it when |
|---|---|---|
| `route.snapshot.paramMap` | a value read once, right now | the component is recreated on every navigation |
| `route.paramMap` | an Observable that emits each time the value changes | the component can be reused with new parameters |

Prefer `paramMap` and `queryParamMap` over the raw `params` objects. The map API (`get`, `has`) is safer when a key might be missing.

## See it

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    @if (user(); as u) {
      <h2>{{ u.name }}</h2>
    } @else {
      <p>Loading user…</p>
    }
  `,
})
export class UserProfile {
  private readonly route = inject(ActivatedRoute);
  private readonly users = inject(UserService);

  // switchMap cancels the previous request if the param changes again quickly
  readonly user = toSignal(
    this.route.paramMap.pipe(switchMap(params => this.users.getUser(params.get('id')!))),
  );
}
```

`paramMap` emits whenever `:id` changes, `switchMap` starts a new request each time and cancels any request still in flight, and `toSignal()` hands the result to the template as a signal.

## Go deeper

The cancellation matters. Without `switchMap`, navigating quickly from user 1 to user 2 to user 3 can let an old response arrive *after* a newer one and overwrite it, which shows the wrong profile. That is a race condition, and `switchMap` removes it.

`toSignal()` subscribes for you and unsubscribes when the component is destroyed, so there is no cleanup code. If you subscribe by hand instead, use `takeUntilDestroyed()` or you create a leak that lasts as long as the component does.

`ActivatedRoute` also carries `data` (including resolver results), `title` and `queryParamMap`. For anything that changes over time, read the observable form.

## Watch out

- Reading `snapshot` once in `ngOnInit` when the component can be reused. The value goes stale.
- Calling `.subscribe()` on `paramMap` without cleanup.
- Forgetting `switchMap` when a parameter change starts a request, so responses can arrive out of order.

## Remember

- `snapshot` is a single read; `paramMap` is a live stream.
- Use `switchMap` so a new parameter cancels the previous request.
- `toSignal()` turns the stream into a signal and cleans up for you.

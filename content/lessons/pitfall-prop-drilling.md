---
slug: pitfall-prop-drilling
title: "Pitfall: prop drilling"
topic: components
kind: pitfall
summary: "Passing an input through layers that do not use it is a sign the state belongs in a service."
tags: [components, architecture, services, data-flow]
related: [component-communication, smart-and-presentational, signal-state-service, input]
---
> **In one line:** Re-emitting events through two or three layers is fine. When the same inputs and outputs travel through components that never use them, move the state into a shared service.

## The idea

Inputs and outputs are explicit, which is their strength: you can trace a value from where it starts to where it is used. But explicit wiring has a cost that grows with depth. When a value is needed five levels down, every component in between must declare the input and pass it on, even though it never touches it. That is **prop drilling**.

The signs are easy to spot: components with inputs they only forward, outputs that only re-emit, and a change to one value that forces edits in four files.

Whether to fix it depends on how far the data travels:

```tree
How far does the data travel?
  One or two levels
    [pass] Keep inputs and outputs | explicit and easy to trace @green
  Through layers that never use it
    [service] Move it into a service | inject it where it is used @amber
  Between components that never meet
    [service] Shared service | a signal in a service @amber
```

## See it

```html
<!-- Before: user is passed through two components that never use it -->
<app-page [user]="user()">
  <app-layout [user]="user()">
    <app-header [user]="user()" />
  </app-layout>
</app-page>
```

```typescript
// After: the header injects what it needs, the layers in between know nothing
@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
}

export class Header {
  protected readonly user = inject(UserStore).user;
}
```

The layout and page no longer mention `user`, so they can change freely.

## Go deeper

Do not jump to a service too early. If two components are directly parent and child, inputs and outputs are simpler than a service in the middle, and easier to read. Two or three layers of re-emitting, such as `(remove)="remove.emit($event)"`, are normal and keep everything explicit.

When you do add a service, follow the shape from the signal state service pattern: a private writable signal, a read-only view, and methods to change it. Never expose a raw writable signal for other components to call `.set()` on.

## Watch out

- Adding a service the moment two components need to share a value. For a plain parent and child, inputs and outputs are simpler.
- Exposing the service's writable signal. Components then change state from anywhere, which is the problem the pattern was meant to remove.
- Providing the service in a component's `providers` and expecting siblings to share it. Each component gets its own instance; use `providedIn: 'root'` for shared state.

## Remember

- Passing an input through layers that do not use it is prop drilling.
- One or two levels of re-emitting is fine; beyond that, move the state into a service.
- Expose read-only signals plus methods, and provide the service at root so everyone shares one instance.

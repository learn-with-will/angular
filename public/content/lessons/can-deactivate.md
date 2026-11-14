---
slug: can-deactivate
title: "canDeactivate: unsaved changes"
topic: routing
kind: api
summary: "Ask before the user leaves a page, so a half-filled form is not lost by an accidental click."
tags: [routing, guards, forms, candeactivate]
related: [navigation-lifecycle, can-activate, guard-factories, pitfall-guards-are-not-security]
---
> **In one line:** `canDeactivate` runs when the user tries to *leave* a route. It lets the page veto the navigation, which is the standard way to protect unsaved work.

## The idea

Most guards protect the way *in*. `canDeactivate` protects the way *out*. The classic use is a form: the user types for five minutes, clicks a menu link by accident, and everything is gone. A guard can intercept the navigation and ask first.

The function receives the **component instance** that is about to be destroyed, so it can look at that component's own state. The usual pattern is a tiny interface the page implements, which keeps the guard generic and reusable across every form in the app.

```sequence
actor user: User
actor router: Router
actor guard: `canDeactivate`
actor page: `EditPage` | has unsaved edits @amber
user -> router: Clicks another link
router -> guard: May we leave?
guard -> page: `hasUnsavedChanges()`
page --> guard: `true`
guard --> user: Asks to confirm
note user: Stay or leave? @amber
user -> router: Confirms
note router: Navigation continues @green
```

## See it

```typescript
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  confirm('You have unsaved changes. Leave this page anyway?');
```

```typescript
@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form">…</form>`,
})
export class EditProfile implements HasUnsavedChanges {
  protected readonly form = inject(NonNullableFormBuilder).group({ name: '' });

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }
}
```

```typescript
{ path: 'profile/edit', component: EditProfile, canDeactivate: [unsavedChangesGuard] }
```

## Go deeper

`confirm()` is blocking and unstyled but needs no setup. In a real app, return an Observable from your own dialog service, and the router will wait for the user's answer.

`canDeactivate` only covers navigation *inside* the app. Closing the tab, reloading or typing a new address bypasses the router entirely. For those, add a `beforeunload` listener while the form is dirty, because the router can never see that event.

After a successful save, mark the form pristine *before* you navigate away, or the guard will ask the user to confirm leaving a page they have just saved.

## Watch out

- Forgetting to reset `dirty` after saving, so the guard nags after a successful save.
- Relying on it for tab close or reload. Those need `beforeunload`.
- Putting the unsaved-state logic in the guard instead of the component, which makes it impossible to reuse.

## Remember

- `canDeactivate` guards leaving; it receives the component instance.
- Use a small interface so one guard serves every form.
- Add `beforeunload` for closes the router cannot see.

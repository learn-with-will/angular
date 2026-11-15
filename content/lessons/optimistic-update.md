---
slug: optimistic-update
title: "Optimistic updates"
topic: di
kind: technique
summary: "Apply a change to the UI before the server confirms it, and roll back if it fails."
tags: [facade, optimistic-ui, rollback, state]
related: [facade-pattern, pitfall-leaky-facade, signal-state-service, pitfall-mutating-signal-array]
---
> **In one line:** An optimistic update changes the UI immediately, then rolls the change back if the request fails. It makes quick, reversible actions such as "delete" feel instant.

## The idea

The honest way to delete an entry is to send the request, wait for the response, and only then remove it from the screen. That is correct, and it feels slow: the user clicks and nothing happens for a moment.

An **optimistic** update bets that the request will succeed. It removes the entry at once, sends the request in the background, and puts the entry back with an error message only if the server refuses. Most of the time the user sees an instant result, and the rare failure is handled cleanly.

The facade is the right home for this, because it owns both the state and the request, so it can change one and undo it using the other.

```sequence
actor user: User
actor facade: Facade | owns the state @primary
actor api: API | the server @amber
user -> facade: `remove(id)` | the user clicks Delete
note facade: Entry disappears at once | the UI feels instant @green
facade -> api: DELETE request | sent in the background
api --> facade: Error response | the server refused
note facade: Entry is put back | with an error message @red
```

## See it

```typescript
remove(id: string): void {
  const entries = this.state().entries;
  const index = entries.findIndex(entry => entry.id === id);
  if (index === -1) return;
  const removed = entries[index];

  // 1. Apply the change now
  this.patch({ entries: entries.filter(entry => entry.id !== id), error: null });

  // 2. Ask the server, and undo on failure
  this.api.remove(id).subscribe({
    error: () => {
      const restored = [...this.state().entries];
      restored.splice(index, 0, removed);          // back in its original place
      this.patch({ entries: restored, error: 'Could not delete the entry.' });
    },
  });
}
```

The entry is saved before it is removed, so the rollback can put it back exactly where it was.

## Go deeper

Optimism fits actions that are quick, reversible and usually succeed: delete, toggle, reorder, "like". It does not fit actions where the result matters before you continue, such as a payment, where waiting for confirmation is the right behavior.

The rollback path is the part people forget, and it is half the feature. Always write it, and always tell the user when it happens, otherwise an item mysteriously reappears with no explanation.

Every update goes through new objects and arrays (`filter`, spread, `splice` on a copy), never in-place edits, so signals notify readers both when the item disappears and when it returns.

## Watch out

- Applying the change and forgetting the rollback. A failed request then leaves the UI lying about the server.
- Mutating the array in place while optimistic. Readers are not notified, so the change is invisible.
- Using it for actions the user must see confirmed, like a purchase. Wait for the server there.

## Remember

- Change the UI first, call the server second, and undo on failure.
- Save what you removed, so the rollback restores it in place.
- Reserve it for quick, reversible actions, and always tell the user about a rollback.

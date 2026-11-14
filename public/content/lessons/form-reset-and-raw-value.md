---
slug: form-reset-and-raw-value
title: "value, getRawValue() and reset()"
topic: forms
kind: api
summary: "Disabled controls vanish from value, and reset needs care. Know which read and which reset to use."
tags: [forms, getrawvalue, reset, disabled]
related: [form-builder, control-state, reactive-validation-errors, form-value-changes]
---
> **In one line:** `form.value` leaves out disabled controls, `getRawValue()` includes them, and `reset()` clears both values and state.

## The idea

Two reads, two resets, and each pair differs in one important way.

| You want | Use | Notes |
|---|---|---|
| Only enabled fields | `form.value` | disabled controls are silently omitted, and keys may be `undefined` |
| Every field, typed | `form.getRawValue()` | disabled controls included, no `undefined` |
| A clean pristine form | `form.reset()` | values return to initial (with `nonNullable`), state is cleared |
| A form with specific values | `form.reset({ ... })` | same, but to values you pass |

The classic bug: a field is disabled because the user cannot change it (an id, a read-only price), and it is missing from the object you send to the server. `value` did exactly what it documents. If you wanted it, read `getRawValue()`.

## See it

```typescript
readonly form = this.fb.group({
  id: [{ value: 42, disabled: true }],
  name: ['Keyboard', Validators.required],
});

// Before: the id is missing
console.log(this.form.value);          // { name: 'Keyboard' }

// After: everything, fully typed
console.log(this.form.getRawValue());  // { id: 42, name: 'Keyboard' }
```

```typescript
onSaved(): void {
  // Clear the values AND the touched/dirty flags in one call
  this.form.reset();
}
```

## Go deeper

`reset()` matters because assigning values alone leaves the old state behind. A form can look empty while still being `dirty` and `touched`, so error messages appear on fields the user has not visited since the save. Call `reset()` (or `reset(initialValue)`) after a successful submit, not `setValue`.

Use `patchValue` to update *some* fields, and `setValue` to update *all* of them; `setValue` throws if you leave one out, which is useful as a safety check when loading data into a form.

If the value should include disabled fields only sometimes, decide at the call site: use `value` for "what the user can edit", and `getRawValue()` for "the complete record".

Typed forms make the difference visible in the type system. For `fb.group({ id: [...], name: [...] })`, `form.value` is a `Partial` of the model, because any control might be disabled, so every key can be `undefined`. `getRawValue()` returns the full model type. When your code later does `value.id.toFixed()`, the compiler is telling you something real about disabled controls.

A practical convention: send `getRawValue()` for "save the whole record", and `value` only when the disabled fields are meant to stay out, such as a read-only field mirrored from another source. Write the choice down in a comment, since the next reader will not know which you meant.

## Watch out

- Posting `form.value` when a disabled field is part of the data.
- Calling `setValue` with a partial object. It throws; use `patchValue`.
- Reassigning values after saving and leaving `dirty` and `touched` set.

## Remember

- `value` skips disabled controls; `getRawValue()` does not.
- `reset()` clears state as well as values.
- `patchValue` for partial updates, `setValue` for complete ones.

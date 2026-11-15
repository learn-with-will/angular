---
slug: form-array
title: "FormArray for dynamic lists"
topic: forms
kind: technique
summary: "Add and remove repeated fields at runtime, such as phone numbers, skills or invitees."
tags: [forms, formarray, dynamic, lists]
related: [reactive-form-model, nested-groups, form-builder, cross-field-validator]
---
> **In one line:** When the number of fields is not known ahead of time, use a `FormArray`. You `push()` and `removeAt()` controls, and the template loops over them.

## The idea

A `FormGroup` has named controls, which is right when the fields are fixed. A user who can add as many skills, phone numbers or invited teammates as they like needs an **ordered list** instead. That is a `FormArray`.

| | `FormGroup` | `FormArray` |
|---|---|---|
| Keys | named (`email`, `city`) | positions (0, 1, 2) |
| Size | fixed when built | grows and shrinks |
| Value | an object | an array |

Validators can sit on the array itself, so `Validators.minLength(1)` means "at least one item", and it checks the *length*, not any single value.

## See it

```typescript
readonly form = this.fb.group({
  username: ['', [Validators.required, Validators.minLength(3)]],
  skills: this.fb.array<string>([], Validators.minLength(1)),
});

get skills() {
  return this.form.controls.skills;
}

addSkill(name: string): void {
  if (!name.trim()) return;
  this.skills.push(this.fb.control(name, Validators.required));
}

removeSkill(index: number): void {
  this.skills.removeAt(index);
}
```

```html
<div formArrayName="skills">
  @for (skill of skills.controls; track skill) {
    <div>
      <input [formControl]="skill" />
      <button type="button" (click)="removeSkill($index)">Remove</button>
    </div>
  }
</div>
```

Tracking by the control object itself keeps the right input focused when an item above it is removed.

## Go deeper

The array is typed: `FormArray<FormControl<string>>`, so `skill.value` is a `string`, not `any`. For an array of *groups*, such as a list of `{ name, qty }` rows, push `this.fb.group({...})` and bind each row with `[formGroupName]="$index"`.

`track $index` also works but misbehaves on removal: when you delete item 1, item 2 *becomes* index 1, so Angular reuses the DOM of the wrong row. Tracking by the control avoids that.

Clear the whole list with `skills.clear()`, and replace it from server data with `skills.clear()` followed by a `push` per item. Use `setValue` only when the length already matches, because it throws on a length mismatch.

## Watch out

- Using `track $index` on a list where items are removed from the middle.
- Calling `setValue` with an array of a different length.
- Putting a per-item rule on the array. Item rules go on each control, list rules on the array.

## Remember

- `FormArray` is an ordered, resizable list of controls.
- `push`, `removeAt` and `clear` change its size.
- Validators on the array check the list; validators on controls check each item.

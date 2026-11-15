---
slug: property-binding
title: "Property binding: [prop]"
topic: templates
kind: api
summary: "Set a DOM property from a component value, with real booleans, numbers and objects."
tags: [templates, binding, dom-properties]
related: [attribute-binding, interpolation, class-and-style-binding, template-expressions]
---
> **In one line:** `[property]="expression"` sets a DOM **property** on an element, keeping the value's real type: boolean, number or object, not just text.

## The idea

Data flows one way, from the component into the element. The part in square brackets is the *target* property, and the quoted part is a template expression. Picture the control room of a building flipping a switch on a device in the lobby: lock the door (`[disabled]`), change a sign's picture (`[src]`).

Because the value keeps its type, property binding is the right tool for anything that is not plain text. That is why it beats the attribute-style alternative for booleans:

| You write | What happens |
|---|---|
| `[disabled]="isSaving()"` | Sets a real boolean. Angular enables and disables the button correctly. |
| `disabled="{{ isSaving() }}"` | Becomes a property binding with the *string* `"false"`. A non-empty string counts as true, so the button stays disabled. |

Angular targets DOM properties by default, which is why names follow the DOM (`colSpan`, not `colspan`). With several kinds of binding around, this is how to choose:

```tree
What do you want to set?
  Text in the page
    [text] Interpolation | `{{ name() }}` @blue
  A DOM property
    [prop] Property binding | `[disabled]="busy()"` @green
  No DOM property
    [attr] Attribute binding | `[attr.colspan]="n()"` @amber
  A class or style
    [css] Class and style | `[class.active]="on()"` @primary
```

## See it

```typescript
@Component({
  selector: 'app-profile-card',
  template: `
    <img [src]="avatarUrl()" [alt]="'Avatar of ' + name()" width="80" />
    <button [disabled]="messageCount() === 0">Open inbox</button>
  `,
})
export class ProfileCard {
  protected readonly name = signal('Ada');
  protected readonly messageCount = signal(3);
  protected readonly avatarUrl = signal('https://example.com/avatars/ada.png');
}
```

The same syntax works on your own components: `[user]="currentUser()"` passes a value into an `input()`, and it can be an object, which no attribute could carry.

## Go deeper

Property binding sets the **live** value on the DOM object. An attribute in the HTML markup is only the *initial* value. For an `<input>`, the `value` property is what the user is looking at right now, and `[value]="term()"` keeps it in step with your state.

These are the targets you will bind most often:

| Property | Typical use |
|---|---|
| `[disabled]` | turn a button or field off while saving |
| `[hidden]` | hide an element without removing it |
| `[src]`, `[href]` | point an image or link at a dynamic URL |
| `[value]`, `[checked]` | set what a form control shows |

Prefer property binding over building strings with interpolation whenever the value is not plain text. It handles booleans, numbers and objects correctly, and it reads more clearly.

## Watch out

- Do not mix the two syntaxes: `[disabled]="{{ x }}"` is invalid. Pick one.
- Binding to a name the element does not have is a compile error. For attributes with no DOM property, see "Attribute binding".
- Never write `disabled="{{ x }}"` for a boolean; bind the real boolean with `[disabled]="x()"`.

## Remember

- `[prop]="expr"` sets a DOM property and keeps the value's type.
- Use it for booleans, numbers, objects and anything that is not static text.
- It is also how data flows into your own components' inputs.

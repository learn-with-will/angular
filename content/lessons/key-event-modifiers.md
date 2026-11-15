---
slug: key-event-modifiers
title: "Key event modifiers"
topic: templates
kind: technique
summary: "React to one specific key with (keyup.enter) instead of inspecting event.key yourself."
tags: [templates, events, keyboard]
related: [event-binding, event-object, template-reference-variables]
---
> **In one line:** Add a key name after a dot, as in `(keyup.enter)="submit()"`, and Angular runs the handler only for that key.

## The idea

Keyboard events fire for *every* key. Without help you write a handler that checks `event.key` and ignores everything else, and that check ends up repeated in every component with a search box. A key modifier moves the filter into the template, where Angular matches the key for you.

```html
<!-- Before: every keyup reaches the handler, which must filter -->
<input (keyup)="onKey($event)" />

<!-- After: Angular only calls search() for Enter -->
<input (keyup.enter)="search()" />
```

Common ones are `(keyup.enter)` for submitting and `(keydown.escape)` for cancelling. The handler becomes a single clear intent: "when Enter is released, search".

| You write | Runs when |
|---|---|
| `(keyup.enter)="submit()"` | Enter is released |
| `(keydown.escape)="cancel()"` | Escape is pressed |
| `(keyup)="onKey($event)"` | any key is released |

## See it

```typescript
@Component({
  selector: 'app-search-box',
  template: `
    <input (input)="onInput($event)" (keyup.enter)="search()" />
    <button (click)="search()">Search</button>
    @if (lastSearch()) {
      <p>Searching for: {{ lastSearch() }}</p>
    }
  `,
})
export class SearchBox {
  private readonly query = signal('');
  protected readonly lastSearch = signal('');

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  search(): void {
    this.lastSearch.set(this.query());
  }
}
```

Pressing Enter and clicking the button both call `search()`, and the handler never looks at a key code.

## Go deeper

`keyup` fires when the key is *released* and `keydown` when it is *pressed*. For submitting, `keyup.enter` avoids firing repeatedly if the key is held; for cancelling or shortcuts that should feel instant, `keydown.escape` reacts sooner.

Modifiers work on any element that can receive key events, and you can combine several listeners on one element, as the example does with `(input)` and `(keyup.enter)`.

Mind accessibility. A native `<button>` already fires `click` when a keyboard user presses Enter or Space, so you do not need a key modifier on it. Key modifiers earn their keep on text fields and custom widgets, where Enter and Escape have no built-in meaning until you give them one. Offering Enter-to-submit and Escape-to-cancel is a small touch that makes a form feel finished.

## Watch out

- Writing `if (event.key === 'Enter')` inside a handler is unnecessary when a modifier exists. Let Angular filter.
- `keyup` fires when the key is *released* and `keydown` when it is *pressed*. Pick the one that matches the behavior you want.
- The element must have focus to receive key events. Listen on an `<input>` or a focusable element, not a plain `<div>`.

## Remember

- `(keyup.enter)` and `(keydown.escape)` run only for that key.
- The modifier replaces a manual `event.key` check.
- Choose `keyup` or `keydown` deliberately.

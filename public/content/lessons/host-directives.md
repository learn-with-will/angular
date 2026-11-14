---
slug: host-directives
title: "hostDirectives"
topic: directives-pipes
kind: api
summary: "Build behavior into a component by applying directives to its own host element."
tags: [directives, composition, hostdirectives, outputs]
related: [attribute-directive, host-bindings, directives-overview, output]
since: "15"
---
> **In one line:** `hostDirectives` lets a component or directive apply other directives to its own host element, so everyone who uses it gets the behavior without adding attributes.

## The idea

Say you have a `ClickOutside` directive that reports clicks outside its element. Every popover should close that way. Without `hostDirectives`, each place that uses a popover must remember to add the attribute, and one forgotten attribute is a popover that never closes.

`hostDirectives` moves that decision into the component. The directive is applied to the component's host automatically, and the component decides which of the directive's inputs and outputs to expose. Behavior stays small and reusable, and components compose it.

```html
<!-- Before: every user must remember the attribute -->
<app-popover appClickOutside (appClickOutside)="close()">…</app-popover>

<!-- After: the popover brings the behavior with it -->
<app-popover (dismissed)="close()">…</app-popover>
```

A host directive's inputs and outputs are **private by default**. You list the ones you want public, optionally renaming them with `'original: alias'`, which keeps the component's API clear.

## See it

```typescript
@Directive({
  selector: '[appClickOutside]',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class ClickOutside {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly appClickOutside = output<MouseEvent>();

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.appClickOutside.emit(event);
    }
  }
}
```

```typescript
@Component({
  selector: 'app-popover',
  hostDirectives: [
    // Apply ClickOutside to <app-popover> and expose its output as (dismissed)
    { directive: ClickOutside, outputs: ['appClickOutside: dismissed'] },
  ],
  template: `<ng-content />`,
})
export class Popover {}
```

Every `<app-popover>` now emits `dismissed` when the user clicks elsewhere, and nothing else about `ClickOutside` leaks into its API.

## Go deeper

Host directives must be standalone, and the component can `inject()` the directive instance if it needs to talk to it. Because each directive does one job, you build bigger behaviors by listing several rather than writing one large directive.

When a toggle button opens the popover, call `$event.stopPropagation()` in its click handler. Otherwise the very click that opens the popover also counts as an outside click and closes it at once.

## Watch out

- Expecting host directive inputs and outputs to be public. They are private unless listed in `inputs` or `outputs`; if `(dismissed)` never fires, check the mapping.
- Applying a directive that is not standalone. Host directives must be standalone.
- Forgetting `stopPropagation()` on the opener, so the opening click counts as outside.

## Remember

- `hostDirectives` applies directives to a component's own host, so users get the behavior automatically.
- List the inputs and outputs you want public; the rest stay private.
- Compose small directives rather than growing one big one.

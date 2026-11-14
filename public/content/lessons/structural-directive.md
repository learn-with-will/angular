---
slug: structural-directive
title: "Structural directives"
topic: directives-pipes
kind: api
summary: "Decide whether a piece of the template exists, using TemplateRef and ViewContainerRef."
tags: [directives, structural, templateref, viewcontainerref]
related: [directives-overview, attribute-directive, if-block, host-directives]
---
> **In one line:** A structural directive sits on an `<ng-template>` and decides when to create its content with `createEmbeddedView()` and when to remove it with `clear()`.

## The idea

The leading `*` is shorthand. Angular rewrites

```html
<button *appIfRole="'admin'">Delete user</button>
```

into a template with the directive on it, and the button becomes the template's content, which is *not* rendered by itself:

```flow
star: `*appIfRole` | the shorthand you write @blue
tpl: `<ng-template>` | holds the button, not rendered yet @primary
view: Embedded view | created only when allowed @green
star -> tpl: Angular rewrites
tpl -> view: createEmbeddedView
```

The directive injects two things. **`TemplateRef`** is the template it sits on. **`ViewContainerRef`** is the spot in the DOM where views made from that template appear. The directive's whole job is to call `createEmbeddedView(template)` to show it and `clear()` to remove it.

Since Angular 17, `@if`, `@for` and `@switch` cover the common cases, so you write a structural directive for app-specific rules such as permissions or feature flags.

## See it

```typescript
@Directive({ selector: '[appIfRole]' })
export class IfRole {
  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly appIfRole = input.required<string>();
  private hasView = false;

  constructor() {
    effect(() => {
      const allowed = this.auth.hasRole(this.appIfRole());
      if (allowed && !this.hasView) {
        this.container.createEmbeddedView(this.template);
        this.hasView = true;
      } else if (!allowed && this.hasView) {
        this.container.clear();
        this.hasView = false;
      }
    });
  }
}
```

```html
<button type="button" *appIfRole="'admin'">Delete report</button>
```

The `effect()` re-runs when the input or the user's roles change, so logging in as an admin shows the button with no extra code.

## Go deeper

The `hasView` flag matters. Calling `clear()` and `createEmbeddedView()` on every run would destroy and rebuild the content each time, losing focus, typed text and child component state. Create the view once and clear it once.

This is a **user-experience** feature, like a route guard. It only hides the button. The server must still refuse the delete request from anyone without the role, because a determined user can call the API directly.

For plain conditions and loops, prefer the built-in control flow. A structural directive earns its place when the *rule* is yours.

## Watch out

- Rebuilding the view on every change. Track whether it exists and only create or clear when that flips.
- Treating a permission directive as security. It hides UI only; enforce permissions on the server.
- Writing a structural directive for a plain condition. `@if` is simpler and needs no directive.

## Remember

- `*directive` becomes an `<ng-template>` carrying the directive.
- Inject `TemplateRef` and `ViewContainerRef`, and create the view once, clear it once.
- Permission directives are UX; the server enforces the real rule.

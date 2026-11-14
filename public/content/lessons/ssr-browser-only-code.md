---
slug: ssr-browser-only-code
title: "Browser-only code in SSR apps"
topic: performance
kind: technique
summary: "Components also run on the server, where window and localStorage do not exist. Move that work into afterNextRender."
tags: [performance, ssr, afternextrender, platform]
related: [ssr-render-modes, hydration, after-next-render, ng-on-init]
---
> **In one line:** Constructors, field initialisers and `ngOnInit` run on the server too. Put browser-only work in `afterNextRender()`, which runs only in the browser.

## The idea

During SSR your components execute in Node.js. Angular provides a server-side `document`, but there is no real `window`, no `localStorage` and no layout. Touching them in the wrong place crashes the render, and the user gets an error page instead of HTML.

Two rules keep a component safe:

| Rule | How |
|---|---|
| browser-only work goes in render callbacks | `afterNextRender()` runs once; `afterEveryRender()` runs each time |
| never touch browser globals early | not in constructors, field initialisers or `ngOnInit` |
| need a branch? | inject `PLATFORM_ID` and check `isPlatformBrowser(platformId)` |

Pick a **server-safe default** for any state that depends on the browser, so the server HTML is sensible, and apply the real value once the app is in the browser.

## See it

```typescript
type Theme = 'light' | 'dark';

@Component({
  selector: 'app-theme-toggle',
  template: `<button type="button" (click)="theme.set('dark')">Dark mode</button>`,
})
export class ThemeToggle {
  // Server-safe default; the stored value arrives later
  protected readonly theme = signal<Theme>('light');
  private readonly inBrowser = signal(false);

  constructor() {
    afterNextRender(() => {
      this.theme.set((localStorage.getItem('theme') as Theme | null) ?? 'light');
      this.inBrowser.set(true);
    });

    effect(() => {
      const theme = this.theme();
      if (!this.inBrowser()) return;       // not before the browser
      localStorage.setItem('theme', theme);
      document.documentElement.dataset['theme'] = theme;
    });
  }
}
```

## Go deeper

The `inBrowser` guard matters. An `effect` runs on the server as well, and without the check it would call `localStorage.setItem` during rendering. The flag flips only inside `afterNextRender`, so the effect does nothing server-side.

A consequence of the safe default is a brief flash: the server HTML shows `light`, and the browser switches to `dark` after hydration. For theme specifically, avoid the flash by setting the attribute with a tiny inline script in `index.html`, or by storing the choice in a cookie that the server can read.

Libraries that touch `window` at import time (charts, maps) break the server build outright. Load them lazily inside `afterNextRender` with a dynamic `import()`, so they are never evaluated on the server.

Use `isPlatformBrowser` for a quick branch in a service where render callbacks are not available, and prefer `DOCUMENT` from `@angular/common` over the global `document` so the server's document is used.

## Watch out

- Reading `localStorage` or `window` in a constructor or `ngOnInit`.
- Importing a browser-only library at the top of a file.
- Effects that write to browser APIs without a browser guard.

## Remember

- Components run on the server too.
- Use `afterNextRender()` for browser-only work, with a server-safe default.
- Inject `DOCUMENT` or check `PLATFORM_ID` when you must branch.

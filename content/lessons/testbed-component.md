---
slug: testbed-component
title: "Testing a component with TestBed"
topic: testing
kind: technique
summary: "Build a component in isolation, wait for it to settle, and assert on what the user sees."
tags: [testing, testbed, vitest, zoneless]
related: [test-pyramid, vitest-mocking, component-harnesses, zoneless-and-signals]
---
> **In one line:** `TestBed` creates a component with just the providers it needs. In zoneless tests, `await fixture.whenStable()` replaces manual `detectChanges()` calls.

## The idea

`TestBed` is a tiny Angular application built for one test. You declare the component and any providers it needs, create it, and get a **fixture**: a handle on the component instance and its DOM.

Nothing renders until change detection runs at least once, so a DOM assertion with no render sees empty content.

| Step | Code | Purpose |
|---|---|---|
| configure | `TestBed.configureTestingModule({ imports: [Counter] })` | the minimal environment |
| create | `TestBed.createComponent(Counter)` | the fixture |
| render | `await fixture.whenStable()` | wait until Angular has settled |
| act | `button.click()` | simulate the user |
| assert | `expect(text).toBe('1')` | check the visible result |

Keep the module minimal: import only what the component needs, and stub heavy dependencies such as HTTP and routing rather than pulling in the real ones.

## See it

```typescript
@Component({
  selector: 'app-counter',
  template: `
    <p>Count: {{ count() }}</p>
    <button type="button" (click)="increment()">+</button>
  `,
})
export class Counter {
  protected readonly count = signal(0);
  protected increment(): void { this.count.update((n) => n + 1); }
}

describe('Counter', () => {
  it('increments when the button is clicked', async () => {
    const fixture = TestBed.createComponent(Counter);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('button')!.click();
    await fixture.whenStable();

    expect(el.querySelector('p')!.textContent).toContain('Count: 1');
  });
});
```

## Go deeper

Why `whenStable()` instead of `detectChanges()`? In a zoneless app Angular decides *itself* when to check, after a signal write or an event. `await fixture.whenStable()` waits the same way production does. Forcing extra synchronous `detectChanges()` passes can hide a real bug: state that only updates because the test happened to call it.

Use `provideZonelessChangeDetection()` in the test module to match a zoneless app. It is the stable name; older snippets use `provideExperimentalZonelessChangeDetection`, which no longer exists.

Raw `fixture.nativeElement` queries are fine for the component's own markup. For a *child* component's behaviour, reach for a harness, which the next lessons cover. And avoid `NO_ERRORS_SCHEMA`, which silently swallows template errors you would want the test to catch.

Run tests once in CI with `ng test --watch=false`, so the pipeline does not hang in watch mode.

## Watch out

- Asserting on the DOM before the first render.
- Sprinkling `detectChanges()` in a zoneless suite.
- Using `NO_ERRORS_SCHEMA` to quiet template errors.

## Remember

- `TestBed` builds a minimal app; the fixture exposes component and DOM.
- Wait with `await fixture.whenStable()`.
- Keep the module minimal and stub heavy dependencies.

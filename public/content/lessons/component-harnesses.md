---
slug: component-harnesses
title: "Component harnesses"
topic: testing
kind: concept
summary: "Test through a component's public interface instead of its markup, so refactors do not break tests."
tags: [testing, cdk, harness, brittleness]
related: [testbed-component, custom-harness, test-pyramid, pitfall-unit-test-mistakes]
---
> **In one line:** A harness is a test API for a component: `click()`, `getText()`, `isDone()`. Tests use it instead of CSS selectors, so changing markup does not break them.

## The idea

A test that does `querySelector('.btn-primary')` knows about class names and structure. A designer renames the class, or wraps the button in a `<div>`, and the test fails although nothing the user sees has changed. Multiply that across a shared widget used in thirty places and the suite becomes a tax on every refactor.

The Angular CDK's **component harness** puts a stable layer between tests and markup. The component's author writes the harness once, next to the component, and every test talks to it:

```flow
test: Test | `await counter.increment()` @primary
harness: Harness | `CounterHarness` @blue
dom: DOM | markup can change freely @amber
test -> harness: intention-revealing methods
harness -> dom: private selectors
```

| Test without a harness | Test with a harness |
|---|---|
| `el.querySelector('.btn-primary').click()` | `await counter.increment()` |
| breaks when markup changes | breaks only when behaviour changes |
| every test repeats the selectors | selectors live in one class |

## See it

```typescript
describe('Settings page', () => {
  let loader: HarnessLoader;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(SettingsPage);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  it('toggles notifications', async () => {
    const toggle = await loader.getHarness(ToggleSwitchHarness.with({ label: 'Email' }));

    await toggle.check();

    expect(await toggle.isChecked()).toBe(true);
  });
});
```

`TestbedHarnessEnvironment.loader(fixture)` is the adapter that creates a `HarnessLoader` from a `TestBed` fixture.

## Go deeper

Harnesses are **asynchronous**: every call returns a Promise, because the same harness works in unit tests and in real browsers. A missing `await` produces silent race conditions and flaky tests, which is the most common harness mistake.

Angular Material ships harnesses for all its components, so `MatButtonHarness` and `MatSelectHarness` come free. Install the CDK with `ng add @angular/cdk` to import `@angular/cdk/testing`; without it you get a "Cannot find module" error.

They pay off for **shared, reusable widgets**. A component that appears in exactly one place can reasonably be tested through its own markup, since the test and component evolve together. Use a harness the moment you assert on a *child* component's behaviour.

Treat the harness as part of the component's public API, and review changes to it as you would any other interface.

## Watch out

- Forgetting `await` on harness calls.
- Writing a harness for a single-use, page-specific component.
- Querying a shared component's markup directly.

## Remember

- A harness is a stable test API over changing markup.
- Every harness call is async; always `await`.
- Use them for shared widgets; Material already provides its own.

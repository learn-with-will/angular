---
slug: test-pyramid
title: "What to test, and where"
topic: testing
kind: concept
summary: "Many fast unit tests, fewer component tests with harnesses, and a handful of end-to-end journeys."
tags: [testing, strategy, pyramid, e2e]
related: [testbed-component, component-harnesses, cypress-basics, vitest-mocking]
---
> **In one line:** Put most tests where they are fast and precise (units and components), and keep slow end-to-end tests for a few critical user journeys.

## The idea

Different tests answer different questions, and cost very different amounts. A test that boots a browser against a real backend is slow and breaks for reasons unrelated to your code. A test of one function runs in milliseconds and points straight at the bug.

| Level | Tool | Asks | Speed |
|---|---|---|---|
| **Unit** | Vitest, plain functions and services | does this logic compute correctly? | milliseconds |
| **Component** | `TestBed` plus harnesses | does this piece of UI render and react? | tens of milliseconds |
| **End to end** | Cypress | does the whole journey work in a real browser? | seconds |

```tree
End to end | few: critical journeys only @red
  Component tests | some: each reusable widget @amber
    Unit tests | many: logic, services, pipes, reducers @green
```

The shape is a pyramid on purpose: broad and cheap at the bottom, narrow and expensive at the top. An inverted pyramid, with hundreds of E2E tests and no unit tests, is slow, flaky and tells you little about *where* things broke.

## See it

```typescript
// Unit: a pure function, no Angular at all
it('applies the discount', () => {
  expect(discount(100, 0.2)).toBe(80);
});

// Component: render it, interact through a harness
it('shows the count', async () => {
  const counter = await loader.getHarness(CounterHarness);
  await counter.increment();
  expect(await counter.getCount()).toBe(1);
});
```

```typescript
// End to end: the user's whole journey
it('signs in', () => {
  cy.visit('/login');
  cy.get('[data-cy=email]').type('ada@example.com');
  cy.get('[data-cy=submit]').click();
  cy.url().should('include', '/dashboard');
});
```

## Go deeper

Choose the lowest level that can catch the bug. A formatting rule belongs in a unit test. A button that must disable while loading belongs in a component test. "A user can check out" is an E2E journey, because it crosses the router, services, the API and the page.

Keep E2E tests to the **critical journeys**: sign-in, checkout, the core workflow. Edge cases (the validation message for each field, each error status) are cheap to cover below, and expensive to cover above.

Run them at different moments. Units and components on every save and every pull request; E2E on a schedule or before release, since they take minutes. A slow suite people stop running is worth less than a fast one they trust.

## Watch out

- Testing everything end to end because it feels realistic.
- Skipping unit tests for logic buried inside components.
- Letting the slowest level dominate the suite.

## Remember

- Many unit tests, some component tests, few E2E journeys.
- Test at the lowest level that can catch the bug.
- Run fast tests constantly; slow ones where they count.

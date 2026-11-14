---
slug: pitfall-e2e-flaky
title: "Pitfall: flaky E2E tests"
topic: testing
kind: pitfall
summary: "Hard waits, shared data, order dependence and happy-path-only suites: the causes of tests nobody trusts."
tags: [testing, cypress, flaky, e2e]
related: [cypress-retry-and-intercept, data-cy-selectors, cypress-commands-session, test-pyramid]
---
> **In one line:** A flaky E2E test depends on timing, data or order that it does not control. Fix the dependency, not the symptom.

## The idea

| Mistake | Symptom | Fix |
|---|---|---|
| `cy.wait(3000)` | slow when fast, still flaky when slow | `cy.intercept(...).as()` then `cy.wait('@alias')` |
| selecting by class or position | breaks on a redesign | `data-cy` attributes |
| a real, shared backend | passes today, fails tomorrow | stub with `cy.intercept` and fixtures |
| tests that rely on a previous test | pass in a run, fail alone | each test sets up what it needs |
| treating `cy` as synchronous | "undefined" values, odd ordering | chain, or use `.then()` |
| only the happy path | bugs in error states ship | test failures with stubbed `4xx` and `5xx` |

## See it

```typescript
// Before: timing, shared data and order dependence
it('shows the last order', () => {
  cy.visit('/orders');
  cy.wait(3000);                                   // hope the API answered
  cy.get('.order-row:nth-child(3)').click();       // depends on a previous test's data
});

// After: waits for the request, owns its data, stable selector
it('shows the last order', () => {
  cy.intercept('GET', '/api/orders', { fixture: 'orders.json' }).as('orders');
  cy.visit('/orders');
  cy.wait('@orders');
  cy.get('[data-cy=order-row]').last().click();
  cy.get('[data-cy=order-detail]').should('be.visible');
});
```

## Go deeper

Treat the three sources of flakiness separately. **Time:** replace sleeps with conditions. **Data:** make every test create or stub exactly what it needs, so it can run alone, in any order, in parallel. **Environment:** a test that needs a particular server state is a test of the environment as much as the app.

When a test fails only in CI, compare what differs: slower machines expose timing assumptions, and a fresh database exposes order dependence. Cypress records screenshots and optionally video on failure, which is usually enough to see the missing wait.

Quarantine, then fix. A known-flaky test that blocks every merge teaches people to retry; a skipped test with a ticket and an owner does not. Retries (`retries: { runMode: 2 }`) are a bandage that can hide real intermittent bugs, so use them sparingly and keep track of which tests needed them.

Finally, keep the suite small. A few robust journeys catch more than hundreds of fragile ones, and edge cases belong in unit and component tests.

## Watch out

- Hard-coded waits and structural selectors.
- Tests that need data left behind by other tests.
- Using automatic retries to hide flakiness.

## Remember

- Wait for conditions, own your data, select by `data-cy`.
- Test the error paths with stubbed responses.
- Fix or quarantine flaky tests; never normalise re-running them.

---
slug: cypress-basics
title: "Cypress: testing the real app"
topic: testing
kind: tool
summary: "Cypress drives a real browser against the running app, and its commands are queued, not immediate."
tags: [testing, cypress, e2e, browser]
related: [test-pyramid, cypress-retry-and-intercept, data-cy-selectors, pitfall-e2e-flaky]
---
> **In one line:** A Cypress test opens the running app in a real browser and acts like a user. Its commands are queued and retried, not run as normal synchronous code.

## The idea

A `TestBed` test builds a piece of the app in memory. Cypress is the opposite: it loads the **whole running application** in a browser and clicks, types and reads like a person would. That makes it the right tool for "does the journey work", and the wrong one for exhaustive edge cases.

| | `TestBed` unit or component test | Cypress E2E test |
|---|---|---|
| Runs | in a test runner, in memory | in a real browser against the served app |
| Covers | one component or service | routing, services, API and page together |
| Speed | milliseconds | seconds |
| Fails because of | your code | your code, the network, timing, data |

Cypress commands are **asynchronous and queued**. `cy.get(...)` does not return an element; it adds a step to a queue that Cypress runs in order, retrying assertions until they pass or time out.

## See it

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
  },
});
```

```typescript
// cypress/e2e/home.cy.ts
describe('Home page', () => {
  it('greets the visitor and navigates to products', () => {
    cy.visit('/');
    cy.get('[data-cy=hero-title]').should('contain.text', 'Welcome');
    cy.get('[data-cy=products-link]').click();
    cy.url().should('include', '/products');
  });
});
```

```bash
npx cypress open        # interactive, while writing the test
npx cypress run         # headless, for CI
```

## Go deeper

Because commands are queued, `const title = cy.get(...)` does not give you an element, only a chainable, so calling `title.text()` fails.

Chain with `.then()` when you need the value, and prefer assertions (`.should(...)`) which retry automatically. Mixing in `async` and `await` does not behave as you expect, either.

`baseUrl` keeps tests environment-independent: `cy.visit('/')` works against local, staging or CI. Keep environment-specific values in `cypress.config.ts` or per-environment config.

Use `cypress open` while developing, to watch commands run and time-travel through snapshots, and `cypress run` in CI, where it records results, screenshots and optionally video of failures.

## Watch out

- Treating `cy` commands as synchronous.
- Writing E2E tests for every edge case that a component test covers cheaply.
- Hardcoding `localhost` URLs instead of `baseUrl`.

## Remember

- Cypress drives the real, running app in a browser.
- Commands are queued; assertions retry.
- Configure `baseUrl`; open interactively, run headless in CI.

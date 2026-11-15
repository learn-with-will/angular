---
slug: cypress-retry-and-intercept
title: "Retry-ability and cy.intercept"
topic: testing
kind: technique
summary: "Wait for conditions rather than time, and stub the network so tests are fast and deterministic."
tags: [testing, cypress, intercept, retry]
related: [cypress-basics, data-cy-selectors, pitfall-e2e-flaky, testing-http]
---
> **In one line:** Cypress retries assertions until they pass, and `cy.intercept` plus `cy.wait('@alias')` waits for a specific request. Never wait for a fixed duration.

## The idea

Two features make E2E tests reliable.

**Retry-ability.** A query such as `cy.get(...)` followed by `.should(...)` is retried until the assertion passes or a timeout is reached. If the page takes 50 ms or 3 seconds to show the element, the same test passes, with no sleep.

**Network control.** `cy.intercept()` catches a request and either observes it or answers it with fixture data, so a test does not depend on a live backend.

| Need | Use |
|---|---|
| wait until something appears | `.should('be.visible')`: retries |
| wait for a request to finish | `cy.wait('@alias')` |
| a specific response, fast | `cy.intercept(..., { fixture })` |
| test the error path | `cy.intercept(..., { statusCode: 500 })` |
| wait a fixed time | almost never |

## See it

```typescript
describe('Login', () => {
  it('shows an error for bad credentials', () => {
    cy.intercept('POST', '/api/login', { statusCode: 401, body: { message: 'Invalid' } }).as('login');

    cy.visit('/login');
    cy.get('[data-cy=email]').type('ada@example.com');
    cy.get('[data-cy=password]').type('nope');
    cy.get('[data-cy=submit]').click();

    cy.wait('@login');
    cy.get('[data-cy=error]').should('contain.text', 'Invalid');
  });

  it('signs in with a stubbed API', () => {
    cy.intercept('POST', '/api/login', { fixture: 'login-success.json' }).as('login');
    // ...type and submit...
    cy.wait('@login').its('request.body').should('deep.include', { email: 'ada@example.com' });
    cy.url().should('include', '/dashboard');
  });
});
```

## Go deeper

`cy.wait(3000)` is slow when the response is fast and still flaky when it is slow. `cy.wait('@login')` waits exactly as long as needed. It also gives you the request and response to assert on, so you can check what the app *sent*, not only what it displayed.

Stub everything except the integration you are deliberately verifying. A real shared backend makes tests non-deterministic: data changes under you, the server is down, another run deletes the record you expected. Fixtures in `cypress/fixtures/*.json` keep test data readable and versioned beside the tests.

Test **failure paths** this way, which is nearly impossible against a real server: a `500`, a slow response, an offline network. These are exactly the states a happy-path-only suite misses.

Intercept before the action that triggers the request, and register aliases before `cy.visit`, or the request may already have happened.

## Watch out

- `cy.wait(3000)` instead of waiting on an alias.
- Registering an intercept after the request fires.
- Testing only the success response.

## Remember

- Assertions retry; fixed waits do not belong.
- `cy.intercept(...).as('x')` then `cy.wait('@x')`.
- Stub the network for deterministic tests, including error cases.

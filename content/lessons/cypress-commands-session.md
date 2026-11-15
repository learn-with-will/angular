---
slug: cypress-commands-session
title: "Custom commands and cy.session"
topic: testing
kind: technique
summary: "Name repeated flows, and cache the login so each test stays independent without paying for it every time."
tags: [testing, cypress, commands, session]
related: [cypress-basics, cypress-retry-and-intercept, data-cy-selectors, pitfall-e2e-flaky]
---
> **In one line:** Extract repeated multi-step flows into typed custom commands, and use `cy.session()` to cache authentication across tests.

## The idea

Most E2E suites repeat the same preamble: sign in, add an item, open a menu. Pasting it into every test is slow to write and slower to maintain, since one change to the login form breaks fifty tests.

| Tool | Solves | How |
|---|---|---|
| custom command | duplicated steps | `Cypress.Commands.add('login', ...)` |
| `cy.session()` | the cost of logging in for every test | caches cookies, local and session storage under a key |
| fixtures | hard-coded test data | JSON files in `cypress/fixtures` |

Each test must still **set up its own world**. `cy.session` caches the *login*, not the state of the app, so independent tests stay independent while the expensive part runs once.

## See it

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    [email, password],                       // cache key
    () => {
      cy.visit('/login');
      cy.get('[data-cy=email]').type(email);
      cy.get('[data-cy=password]').type(password, { log: false });
      cy.get('[data-cy=submit]').click();
      cy.url().should('include', '/dashboard');
    },
    { validate: () => cy.getCookie('session').should('exist') },
  );
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
```

```typescript
it('shows the account page', () => {
  cy.login('ada@example.com', 'secret');
  cy.visit('/account');
  cy.get('[data-cy=account-name]').should('contain.text', 'Ada');
});
```

## Go deeper

The `declare global` block gives the command a **type**, so editors autocomplete `cy.login` and the compiler checks the arguments. Without it, TypeScript reports the command as unknown.

`cy.session` also clears the page and the browser state before running its setup, then restores the cached state for later calls with the same key. The `validate` callback is what notices an expired session and re-runs the setup, so a stale cache does not produce confusing failures far from the cause.

For speed, log in through the API instead of the UI inside the session setup: `cy.request('POST', '/api/login', {...})`. Then keep one dedicated test that exercises the real login form, and let every other test skip it.

Use `{ log: false }` when typing a password, so it does not appear in the command log, screenshots or videos, and keep test credentials out of the repository, in environment variables.

## Watch out

- Pasting the same steps into every test.
- Skipping `validate`, so an expired session fails mysteriously.
- Committing real credentials, or logging passwords in the command log.

## Remember

- Custom commands name repeated flows; declare their types.
- `cy.session()` caches login across tests, keyed and validated.
- Log in through the API in setup; test the form once.

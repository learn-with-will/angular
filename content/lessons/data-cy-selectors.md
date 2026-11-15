---
slug: data-cy-selectors
title: "data-cy selectors"
topic: testing
kind: technique
summary: "Select elements with dedicated test attributes, so styling and structure can change freely."
tags: [testing, cypress, selectors, data-cy]
related: [cypress-basics, component-harnesses, cypress-retry-and-intercept, pitfall-e2e-flaky]
---
> **In one line:** Mark elements tests need with `data-cy="..."`. Classes belong to styling and ids to behaviour, so tests should not borrow either.

## The idea

A selector is a promise that something about the page stays the same. Pick the wrong attribute and a harmless change breaks the suite.

| Selector | Changes when | Verdict |
|---|---|---|
| `.btn-primary` | a designer restyles | brittle |
| `:nth-child(3)` | someone reorders the markup | brittle |
| `#submit` | script or anchor logic changes | meh: ids are for behaviour |
| `[data-cy=submit]` | only when someone edits a test attribute | stable |
| text such as `cy.contains('Sign in')` | copy changes or is translated | fine for user-facing assertions |

A dedicated attribute has one job. Nobody restyles it, nobody removes it as unused CSS, and a reviewer who sees `data-cy` in a diff knows a test depends on it.

## See it

```html
<form (ngSubmit)="signIn()">
  <input data-cy="email" type="email" formControlName="email" />
  <input data-cy="password" type="password" formControlName="password" />
  <button data-cy="submit" type="submit">Sign in</button>
</form>
@if (error()) {
  <p data-cy="error" role="alert">{{ error() }}</p>
}
```

```typescript
cy.get('[data-cy=email]').type('ada@example.com');
cy.get('[data-cy=password]').type('wrong-password');
cy.get('[data-cy=submit]').click();
cy.get('[data-cy=error]').should('be.visible');
```

## Go deeper

Assert on what the **user can see**, not on internals. `should('be.visible')`, `should('contain.text', ...)` and `cy.url()` describe outcomes. Reading a component's properties couples the test to implementation and defeats the point of testing in a browser.

A tiny helper removes the repetition. Register it once and the tests read `cy.getBySel('submit')`; if you ever change the attribute convention, it is one edit:

```typescript
Cypress.Commands.add('getBySel', (sel: string) => cy.get('[data-cy=' + sel + ']'));
```

Accessible queries are a good alternative. Selecting by role and name tests what assistive technology sees, which doubles as a light accessibility check, with Testing Library plugins for Cypress. Reach for `data-cy` where no accessible name exists, such as a container.

Do not ship test attributes you do not need. Adding one to every element is noise; add them to the elements a test actually uses.

Agree the convention with the team and write it down. A short rule such as "interactive elements and result containers get a `data-cy`, named `feature-element`" prevents a codebase where half the tests use ids, a quarter use classes and the rest use text. Consistent names also make tests read like a description of the screen.

Strip the attributes from production builds only if you must. They are harmless, tiny and useful in support sessions, and removing them requires a build step that can itself go wrong. A bundle-size argument rarely holds up against measurement.

## Watch out

- Selecting by classes or structural position.
- Reading component internals instead of visible outcomes.
- Adding `data-cy` to everything, "just in case".

## Remember

- `data-cy` is for tests, class is for style, id is for behaviour.
- Assert on visible outcomes.
- A small helper keeps selectors consistent.

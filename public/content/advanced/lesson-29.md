---
id: lesson-29
slug: end-to-end-testing-with-cypress
title: "End-to-End Testing with Cypress"
level: advanced
order: 27
duration: 55
tags:
  - cypress
  - e2e-testing
  - testing
  - angular-router
  - ci-cd
---

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain how Cypress's real-browser architecture differs from Angular's `TestBed`-based unit and component tests.
- Install and configure Cypress in a standalone Angular application using the official Angular schematic.
- Write E2E tests that reproduce authentic user flows: navigation, form input, and client-side routing.
- Use `cy.intercept` to control network requests, stub responses, and eliminate test flakiness.
- Apply best practices — `data-cy` selectors, custom commands, and session caching — to build a maintainable E2E suite.

## Why This Concept Exists

Angular's unit and component tests (built on `TestBed`, Jasmine/Karma, or Jest) are fast and precise because they run in a **simulated** environment. `TestBed` creates an isolated fixture for a single component, lets you mock its dependencies, and inspects the rendered output without ever touching a real browser tab, a real router, or a real network stack. This isolation is exactly what makes unit tests fast and deterministic — but it's also their biggest limitation. A component can pass every unit test in isolation and still fail in production because:

- A route guard blocks navigation in a way no unit test exercised.
- Two lazy-loaded feature modules interact badly when navigated between in sequence.
- A CSS rule hides a button behind an overlay, so clicks silently fail for real users even though the DOM technically "contains" the button.
- An HTTP interceptor attaches the wrong header only when running against the compiled production bundle.

Angular used to ship **Protractor** as its default E2E tool, but Protractor was built on top of Selenium WebDriver and became difficult to maintain as browsers evolved; the Angular team eventually removed it as the default. Today, running `ng e2e` on a project with no E2E builder configured prompts you to add one of several community-maintained integrations — Cypress, Playwright, WebdriverIO, Nightwatch, or Puppeteer — via `ng add`.

Cypress exists to close the gap between "the pieces work" and "the application works for a real person." Instead of simulating the DOM or driving the browser through an external protocol, Cypress **boots your actual compiled Angular application inside a real browser instance** (Chrome, Edge, Firefox, or Electron) and executes commands in the same run loop as your app. Clicks are real clicks. Typing triggers real Angular event bindings and change detection. Navigating fires the real Angular Router, executes real guards and resolvers, and — unless you explicitly intercept it — sends real HTTP requests. This is what gives you confidence that a feature actually works end to end, not just in isolation.

## Concept Explanation

### Two different testing philosophies

| | `TestBed` (unit/component tests) | Cypress (E2E tests) |
|---|---|---|
| Environment | Simulated fixture, isolated component instance | Real browser tab running the compiled app |
| Dependencies | Mocked/stubbed via Angular DI | Real services, real `HttpClient`, real Router (unless you intercept) |
| Speed | Very fast, runs hundreds of tests per second | Slower, each test drives a real UI |
| What it proves | "This unit behaves correctly given these inputs" | "A user can actually complete this flow" |
| Failure surface | Logic bugs, incorrect bindings, wrong outputs | Integration bugs, layout bugs, routing bugs, timing bugs |

Neither replaces the other. A healthy Angular test suite uses `TestBed` for the majority of logic-heavy tests (fast feedback loop) and Cypress for a smaller number of critical, high-value user journeys (login, checkout, core workflows) that must work exactly as the user experiences them.

### How Cypress actually drives your app

When you run a Cypress spec, Cypress does **not** simulate a DOM in Node.js the way Jest/JSDOM does. Instead:

1. A Node.js process (the Cypress "app") launches and controls a real browser instance.
2. Cypress navigates that browser to your running Angular application (typically served by `ng serve` or a built artifact served by a static server).
3. Your Angular app boots normally — bootstrapping, change detection, the Router, HTTP calls, everything runs exactly as it would for a real visitor.
4. Cypress commands (`cy.get`, `cy.click`, `cy.type`, …) execute directly against that live page.

Because Cypress commands run inside the browser's event loop, they are **automatically retried**. If you write `cy.get('[data-cy="save-button"]').click()`, Cypress does not fail immediately if the button isn't in the DOM yet — it retries the query for a configurable timeout window until the element appears and is actionable (visible, not covered, not disabled), or the timeout expires. This "retry-ability" is what eliminates the need for manual `setTimeout`-style waits that plague older Selenium/Protractor-based suites.

### Commands are asynchronous and queued, not immediate

A very common source of confusion: `cy.get(...)` does **not** return the element synchronously. Every `cy` command is queued and resolved asynchronously by the Cypress runner. This means you cannot write:

```typescript
// ❌ WRONG — cy.get() does not return a value synchronously
const button = cy.get('[data-cy="submit"]');
button.click(); // this "happens to work" by accident of chaining, but the pattern is wrong
```

Instead, you chain commands, or use `.then()` to work with the resolved subject:

```typescript
// ✅ CORRECT — chain commands
cy.get('[data-cy="submit"]').click();

// ✅ CORRECT — use .then() when you need the actual value
cy.get('[data-cy="total"]').then(($el) => {
  expect($el.text()).to.contain('$42.00');
});
```

### Interactive vs. headless execution

Cypress has two run modes:

- `cypress open` — launches the interactive Test Runner with time-travel debugging, DOM snapshots per command, and live reload. Use this while writing tests.
- `cypress run` — runs specs headlessly from the command line and exits with a pass/fail status. Use this in CI pipelines.

## Key Terminology

| Term | Meaning |
|---|---|
| **E2E (End-to-End) test** | A test that exercises a complete user flow through the real, running application, from UI interaction to backend response and back. |
| **Cypress Test Runner** | The interactive GUI launched by `cypress open`, showing your app alongside a command log and time-travel snapshots. |
| **`cy` command** | A chainable, auto-retrying instruction (`cy.get`, `cy.visit`, `cy.click`, …) that Cypress queues and executes against the live browser. |
| **Fixture** | A static JSON (or other) file under `cypress/fixtures/` used as canned data for stubbed network responses. |
| **Intercept / stub** | Using `cy.intercept()` to observe or replace a network request/response so tests don't depend on a real backend. |
| **Alias** | A name given to a command's result via `.as('name')`, referenced later as `@name` (commonly used with `cy.intercept` + `cy.wait('@name')`). |
| **Retry-ability** | Cypress's built-in behavior of retrying a command/assertion until it passes or a timeout elapses, instead of failing instantly. |
| **Flaky test** | A test that passes and fails inconsistently without code changes — usually caused by timing assumptions or uncontrolled network calls. |
| **Headless mode** | Running the browser and Cypress without a visible UI, used for CI (`cypress run`). |
| **`baseUrl`** | The root URL configured in `cypress.config.ts` so specs can call `cy.visit('/login')` instead of a full URL. |
| **Custom command** | A reusable Cypress command you define yourself (e.g. `cy.login()`) in `cypress/support/commands.ts`. |

## Syntax Overview

### 1. Configuration — `cypress.config.ts`

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on, config) {
      // register Node event listeners / plugins here if needed
      return config;
    },
  },
});
```

`baseUrl` lets every spec use relative paths with `cy.visit('/')` instead of hardcoding `http://localhost:4200` everywhere — essential once you deploy to staging/production URLs that differ per environment.

### 2. A spec file — `describe` / `it`

```typescript
describe('Home page', () => {
  it('displays the application title', () => {
    cy.visit('/');
    cy.get('h1').should('contain.text', 'Welcome');
  });
});
```

Cypress specs use the familiar Mocha `describe`/`it` structure, combined with Chai-based assertions (`.should(...)`) that are automatically retried.

### 3. Core interaction commands

```typescript
cy.visit('/products');                       // navigate the real Angular Router to a route
cy.get('[data-cy="search-input"]').type('shoes'); // type into a real input, firing real events
cy.contains('Add to cart').click();           // find by visible text, then click
cy.url().should('include', '/cart');          // assert on the real browser URL after routing
```

### 4. Controlling the network — `cy.intercept`

```typescript
cy.intercept('GET', '/api/products', { fixture: 'products.json' }).as('getProducts');
cy.visit('/products');
cy.wait('@getProducts');
```

`cy.intercept` replaces the older, removed `cy.route` API. It can observe real requests, delay them, or — as above — replace them entirely with fixture data so the test's outcome doesn't depend on a live backend.

## Real World Analogy

Think of Angular's `TestBed` unit tests as **inspecting individual car parts on a workbench**: you test that the brake pad has the right friction coefficient, that the headlight bulb lights up when given voltage. Fast, precise, cheap to repeat — but it never tells you whether the finished car actually drives safely on a real road.

Cypress is a **licensed test driver taking the fully assembled car out onto an actual test track**. They sit in the real seat, turn the real key, press the real brake pedal, and drive the real route a customer would drive — through real turns (routing), real traffic lights (guards), and real fuel stops (network calls). If something only breaks when all the parts work together on the real road, the workbench inspection would never have caught it — but the test driver will.

## Examples

### Example 1 — Basic: Installing Cypress and testing the home page

This example installs Cypress via the official Angular schematic and writes the smallest possible meaningful E2E test.

**Step 1 — install and scaffold Cypress**

```bash
ng add @cypress/schematic
```

This adds Cypress as a dev dependency, creates a `cypress/` folder with example specs, generates `cypress.config.ts`, and wires `cypress-open` / `cypress-run` targets into `angular.json` (replacing the need for a legacy Protractor setup).

**Step 2 — a standalone `AppComponent` under test**

```typescript
// src/app/app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <h1 data-cy="app-title">Welcome to Acme Store</h1>
  `,
})
export class AppComponent {}
```

Notice the `data-cy="app-title"` attribute — a dedicated testing hook, unrelated to CSS classes or IDs, so the test survives visual redesigns.

**Step 3 — the E2E spec**

```typescript
// cypress/e2e/home.cy.ts
describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders the store title', () => {
    cy.get('[data-cy="app-title"]').should('be.visible').and('contain.text', 'Acme Store');
  });
});
```

**Step 4 — run it**

```bash
# interactive, while developing the test
ng run <project-name>:cypress-open

# headless, for CI
ng run <project-name>:cypress-run
```

This confirms the real compiled app boots in a real browser and renders the expected content — something a `TestBed` test can also verify, but here it is verified exactly as a visitor's browser would render it, including real CSS and real bootstrapping.

### Example 2 — Real-world: Testing a login flow with a stubbed API

Login flows are a perfect Cypress candidate: they combine form input, an HTTP call, and a routing redirect guarded by an `AuthGuard` — exactly the kind of integration that unit tests struggle to cover realistically.

**The component under test (standalone, reactive forms)**

```typescript
// src/app/auth/login.component.ts
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input data-cy="email-input" type="email" formControlName="email" />
      <input data-cy="password-input" type="password" formControlName="password" />
      <button data-cy="login-submit" type="submit" [disabled]="form.invalid">Log in</button>
      @if (errorMessage()) {
        <p data-cy="login-error">{{ errorMessage() }}</p>
      }
    </form>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  errorMessage = () => this._errorMessage;
  private _errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;

    this.http.post('/api/login', this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => (this._errorMessage = 'Invalid credentials'),
    });
  }
}
```

**The E2E spec, controlling the network with `cy.intercept`**

```typescript
// cypress/e2e/login.cy.ts
describe('Login flow', () => {
  it('logs the user in and redirects to the dashboard', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token' },
    }).as('loginRequest');

    cy.visit('/login');

    cy.get('[data-cy="email-input"]').type('user@example.com');
    cy.get('[data-cy="password-input"]').type('correct-horse-battery-staple');
    cy.get('[data-cy="login-submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });

  it('shows an error message on invalid credentials', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('loginRequest');

    cy.visit('/login');

    cy.get('[data-cy="email-input"]').type('user@example.com');
    cy.get('[data-cy="password-input"]').type('wrong-password');
    cy.get('[data-cy="login-submit"]').click();

    cy.wait('@loginRequest');
    cy.get('[data-cy="login-error"]').should('contain.text', 'Invalid credentials');
    cy.url().should('include', '/login');
  });
});
```

Stubbing the network with `cy.intercept` means these tests don't depend on a real backend being available and don't fail because of unrelated backend bugs or seed-data drift — they isolate exactly what the Angular app does with a given HTTP response, while still driving the UI exactly as a real user would.

### Example 3 — Best practice: Custom commands, fixtures, and session caching

As a suite grows, repeating the same login steps in every spec becomes slow and hard to maintain. This example factors the login flow into a reusable, typed custom command and uses `cy.session` to avoid re-authenticating for every single test.

**Fixture data**

```json
// cypress/fixtures/dashboard-user.json
{
  "id": 42,
  "name": "Ada Lovelace",
  "role": "admin"
}
```

**Custom command definition**

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.intercept('POST', '/api/login', { statusCode: 200, body: { token: 'fake-jwt-token' } }).as(
      'loginRequest'
    );

    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(email);
    cy.get('[data-cy="password-input"]').type(password);
    cy.get('[data-cy="login-submit"]').click();
    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });
});
```

**Type declaration so TypeScript recognizes `cy.login`**

```typescript
// cypress/support/index.d.ts
declare namespace Cypress {
  interface Chainable {
    login(email: string, password: string): Chainable<void>;
  }
}
```

**Register the command**

```typescript
// cypress/support/e2e.ts
import './commands';
```

**A spec that reuses the command and stubs a fixture-backed endpoint**

```typescript
// cypress/e2e/dashboard.cy.ts
describe('Dashboard', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'correct-horse-battery-staple');

    cy.intercept('GET', '/api/me', { fixture: 'dashboard-user.json' }).as('getMe');
    cy.visit('/dashboard');
    cy.wait('@getMe');
  });

  it('greets the logged-in user by name', () => {
    cy.get('[data-cy="dashboard-greeting"]').should('contain.text', 'Ada Lovelace');
  });

  it('shows admin-only controls for admin users', () => {
    cy.get('[data-cy="admin-panel-link"]').should('be.visible');
  });
});
```

`cy.session` caches the authenticated browser state (cookies, local storage) across tests with the same arguments, so Cypress only replays the full login flow once per unique session key instead of once per test — a significant speedup for larger suites, while still keeping each test's assertions fully independent.

## Common Mistakes

- **Selecting elements by CSS classes or structural position** (`.btn-primary`, `:nth-child(3)`). These break the moment a designer changes styling or markup order. Use dedicated `data-cy` attributes instead, which are only ever used by tests.
- **Hardcoding waits** like `cy.wait(3000)` to "give the API time to respond." This is slow when the response is fast and still flaky when it's slow. Use `cy.intercept(...).as('alias')` + `cy.wait('@alias')`, which waits exactly as long as needed and no longer.
- **Testing against a real, shared backend/production data.** Tests become flaky and non-deterministic when data changes outside the test's control. Stub network responses with `cy.intercept` for anything that isn't the specific integration you intend to verify.
- **Writing tests that depend on execution order or leftover state from a previous test.** Each test should set up everything it needs (via `cy.intercept`, fixtures, or a fresh `cy.visit`) rather than assuming a prior test left the app in a particular state.
- **Treating `cy` commands as synchronous**, e.g. assigning `const el = cy.get(...)` and using `el` immediately as if it were a DOM element. Commands are queued; use chaining or `.then()`.
- **Only covering the happy path.** A login test that only checks successful login misses the error states (invalid credentials, network failure) that are just as important to a real user's experience.

## Best Practices

- Add `data-cy` attributes to any element your tests interact with, kept completely separate from styling (`class`) and behavior (`id`) attributes, so refactors don't silently break tests.
- Prefer `cy.intercept` over hitting a real backend for E2E tests that aren't specifically validating live integration; use fixtures (`cypress/fixtures/*.json`) for consistent, readable test data.
- Extract repeated multi-step flows (login, adding an item to a cart, etc.) into typed custom commands under `cypress/support/commands.ts`.
- Use `cy.session()` to cache authentication state across tests and keep the suite fast, while still asserting independently in each test.
- Keep `baseUrl` and any environment-specific values in `cypress.config.ts` (or per-environment config files), and run `cypress run` headlessly in CI, reserving `cypress open` for local development.
- Write E2E tests for a small number of **critical user journeys** (checkout, authentication, core workflows) rather than trying to E2E-test every possible UI state — leave exhaustive edge-case coverage to `TestBed` unit and component tests.
- Assert on user-visible outcomes (visible text, URL, element state) rather than internal implementation details like component instance properties.

## Summary

- Angular's `TestBed` tests run in a simulated, isolated environment — fast, but blind to real integration issues.
- Cypress boots the actual compiled Angular application inside a real browser and drives it the way a real user would: real clicks, real typing, real routing, real network calls.
- Angular no longer ships a default E2E tool; you add one explicitly (e.g. `ng add @cypress/schematic`) after Protractor's removal as the default.
- Cypress commands (`cy.get`, `cy.click`, `cy.type`, …) are asynchronous, queued, and automatically retried until they succeed or time out — this "retry-ability" removes the need for manual waits.
- `cy.intercept` lets you observe or stub network requests, keeping E2E tests fast and deterministic without depending on a live backend.
- Use `data-cy` attributes for selectors so tests survive styling and markup refactors.
- Custom commands and `cy.session()` keep larger suites fast and maintainable by avoiding repeated, redundant setup steps.
- Reserve Cypress for high-value, critical user journeys; keep the bulk of your logic coverage in fast `TestBed` unit/component tests.

## Flash Cards

**Q: What is the fundamental architectural difference between a Cypress E2E test and an Angular `TestBed` unit test?**
A: `TestBed` tests run components in a simulated, isolated environment with mocked dependencies. Cypress boots the actual compiled application inside a real browser and drives it with real clicks, real typing, real routing, and real network calls.

**Q: Which official Angular CLI command and schematic package add Cypress to an Angular project?**
A: `ng add @cypress/schematic`, which scaffolds `cypress.config.ts`, the `cypress/` folder, and the `cypress-open`/`cypress-run` builder targets.

**Q: What does "retry-ability" mean in Cypress, and why does it matter?**
A: Cypress commands and assertions are automatically retried against the live DOM until they pass or a timeout elapses, instead of failing instantly — this removes the need for manual, arbitrary waits and reduces flaky tests.

**Q: How do you make an E2E test independent of a live backend for a specific network call?**
A: Use `cy.intercept()` to observe or replace the request/response (optionally backed by a fixture file), then alias it with `.as('name')` and wait for it with `cy.wait('@name')`.

**Q: Why should you use dedicated `data-cy` attributes instead of CSS classes or IDs as test selectors?**
A: `data-cy` attributes exist solely for testing and are decoupled from styling and behavior concerns, so visual redesigns or markup restructuring don't silently break the test suite.

## Exercises

**Easy**
Install Cypress in a standalone Angular application using `ng add @cypress/schematic`. Add a `data-cy="page-heading"` attribute to your root component's heading, then write a spec in `cypress/e2e/` that visits `/` and asserts the heading is visible and contains the expected text.

**Medium**
Build a reactive "Contact Us" form component with `name`, `email`, and `message` fields, each carrying a `data-cy` attribute, plus a submit button that calls `POST /api/contact`. Write a Cypress spec with two tests: one that submits valid data, uses `cy.intercept` to stub a `200` response, and asserts a success message appears; and one that attempts to submit with an empty `email` field and asserts the submit button remains disabled (or a validation message appears, depending on your implementation).

**Challenging**
Implement a three-step checkout wizard behind an `AuthGuard` (`/checkout/shipping` → `/checkout/payment` → `/checkout/confirmation`), each step on its own lazy-loaded route. Write a Cypress spec that: (1) defines a `cy.login()` custom command using `cy.session()`; (2) stubs the shipping-options and payment-methods endpoints with fixtures via `cy.intercept`; (3) walks through all three routes verifying the URL and key page content at each step; and (4) asserts the final confirmation page displays an order summary built from the intercepted responses. Ensure no test depends on the execution order of any other test in the file.

## Further Reading

- Angular official docs — [End-to-End Testing](https://angular.dev/tools/cli/end-to-end) (how `ng e2e` and `ng add` integrate third-party E2E tools)
- Angular official docs — [Testing overview](https://angular.dev/guide/testing) (context on `TestBed`-based unit/component testing)
- Cypress official docs — [Writing Your First End-to-End Test](https://docs.cypress.io/guides/end-to-end-testing/writing-your-first-end-to-end-test)
- Cypress official docs — [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- Cypress official docs — [Network Requests (`cy.intercept`)](https://docs.cypress.io/guides/guides/network-requests)
- Cypress official docs — [Testing your Login page](https://docs.cypress.io/guides/end-to-end-testing/testing-your-app) and [`cy.session()`](https://docs.cypress.io/api/commands/session)
- npm — [`@cypress/schematic`](https://www.npmjs.com/package/@cypress/schematic)

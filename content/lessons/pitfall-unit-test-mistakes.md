---
slug: pitfall-unit-test-mistakes
title: "Pitfall: flaky unit tests"
topic: testing
kind: pitfall
summary: "Missing awaits, forced change detection, mixed spy APIs and over-broad schemas: how each one shows up."
tags: [testing, bugs, flaky, harness]
related: [testbed-component, vitest-mocking, component-harnesses, custom-harness]
---
> **In one line:** Most flaky or misleading unit tests come from a handful of mistakes. Each has a recognisable symptom.

## The idea

| Mistake | Symptom | Fix |
|---|---|---|
| no render before asserting | empty DOM, "cannot read properties of null" | `await fixture.whenStable()` first |
| forced `detectChanges()` in a zoneless suite | test passes, production does not update | wait with `whenStable()` instead |
| missing `await` on a harness call | passes or fails randomly | `await` every harness call |
| `jasmine.createSpy()` or `jest.fn()` in a Vitest project | runtime error, `X is not defined` | `vi.fn()` and `vi.spyOn()` |
| raw selectors for a shared component | tests break when markup changes | use its harness |
| `NO_ERRORS_SCHEMA` | template errors vanish | import the real child components |
| missing CDK dependency | "Cannot find module @angular/cdk/testing" | `ng add @angular/cdk` |

## See it

```typescript
// Before: three problems in four lines
it('increments', () => {
  const button = fixture.nativeElement.querySelector('.btn-primary');   // brittle selector
  button.click();
  expect(counter.getCount()).toBe(1);                                   // not awaited, no render
});

// After: harness, awaits, settled
it('increments', async () => {
  const counter = await loader.getHarness(CounterHarness);
  await counter.increment();
  expect(await counter.getCount()).toBe(1);
});
```

## Go deeper

The forced `detectChanges()` one is the subtle one. A test that calls `fixture.detectChanges()` after every action can pass for state that, in the real app, never updates because nothing notified Angular. The test supplies the notification the app lacks. Waiting with `whenStable()` behaves like production, so the same bug fails in the test.

A missing `await` is hard to spot because the assertion often passes by luck: the Promise resolves quickly enough on a fast machine. It fails on a slow CI runner, and the failure appears unrelated to the change that broke it. A lint rule for floating promises catches the whole class.

Do not blame the framework first. When a test is flaky, ask whether it depends on timing, order or leftover state. Make it wait for a *condition*, not a duration, and make each test create everything it needs.

Delete tests that cannot be made reliable. A test that people re-run until it goes green is worse than none, because it teaches the team to ignore failures.

A fast way to audit a suite is to break the code on purpose. Comment out the line a test claims to cover, or negate a condition, and run it. If the test still passes, it was not testing that behaviour: usually a missing `await`, an assertion that ran before render, or a mock returning the value the test expects regardless of the code.

Mutation-testing tools automate this, but the manual version, done once on your most important tests, finds the worst offenders with no tooling.

## Watch out

- Asserting without awaiting or rendering.
- Hiding template errors with a permissive schema.
- Re-running flaky tests instead of fixing the cause.

## Remember

- Render, await, then assert.
- One test framework's spy API per project.
- A flaky test is a bug in the test or the code, never noise.

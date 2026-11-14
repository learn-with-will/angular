---
slug: vitest-mocking
title: "Mocking with Vitest"
topic: testing
kind: technique
summary: "vi.fn and vi.spyOn replace the Jasmine and Jest spies, and TestBed.inject keeps real types."
tags: [testing, vitest, mocks, spies]
related: [testbed-component, test-pyramid, pitfall-unit-test-mistakes, testing-http]
---
> **In one line:** In a Vitest project (the default since Angular 21), use `vi.fn()` and `vi.spyOn()`. Spy on the real service from `TestBed.inject` rather than hand-writing a fake.

## The idea

A unit test should control what its dependencies do. Two Vitest tools cover almost everything:

| Tool | Does | Use it to |
|---|---|---|
| `vi.fn()` | creates a standalone mock function | pass a callback and assert how it was called |
| `vi.spyOn(obj, 'method')` | wraps an existing method | observe it, or replace what it returns |
| `.mockReturnValue(x)` | makes the spy return a fixed value | isolate the component from a real service |
| `toHaveBeenCalledWith(...)` | asserts on arguments | check the interaction happened |

The framework APIs are not interchangeable. `jasmine.createSpy()` or `jest.fn()` in a Vitest project throws at runtime, and code copied from older Karma or Jest projects needs its spies translated.

## See it

```typescript
@Injectable({ providedIn: 'root' })
export class PriceService {
  convert(amount: number, currency: string): number { /* calls an API in real life */ return amount; }
}

describe('Checkout', () => {
  it('shows the converted price', async () => {
    TestBed.configureTestingModule({ imports: [Checkout] });

    // Real instance from DI: full type safety, signature drift is caught
    const prices = TestBed.inject(PriceService);
    const spy = vi.spyOn(prices, 'convert').mockReturnValue(42);

    const fixture = TestBed.createComponent(Checkout);
    await fixture.whenStable();

    expect(spy).toHaveBeenCalledWith(100, 'EUR');
    expect(fixture.nativeElement.textContent).toContain('42');
  });
});
```

## Go deeper

Spying on the **real instance** beats a hand-rolled fake class. A fake drifts: when the real method's signature changes, the fake still compiles and the test still passes while production breaks. A spy on the real object keeps the type, so a signature change fails the test at compile time.

Reset between tests. Spies are global to the instance, so call `vi.restoreAllMocks()` in `afterEach` (or enable `restoreMocks` in config), or one test's return value leaks into the next. The same applies to fake timers: `vi.useFakeTimers()` needs a matching `vi.useRealTimers()`.

Replace a dependency wholesale by providing a stub for its token: `{ provide: PriceService, useValue: { convert: vi.fn().mockReturnValue(42) } }`. Use this for services that are heavy to construct, such as ones needing HTTP, and keep `spyOn` for ones that are cheap.

For HTTP specifically, prefer `HttpTestingController` over mocking `HttpClient`, so the real interceptors and serialisation run.

## Watch out

- Mixing Jasmine, Jest and Vitest spy APIs.
- Letting spies leak between tests.
- Writing a fake service that no longer matches the real one.

## Remember

- `vi.fn()` for callbacks, `vi.spyOn()` for existing methods.
- Spy on `TestBed.inject(Service)` to keep types.
- Restore mocks after each test.

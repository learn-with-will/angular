---
slug: custom-harness
title: "Writing a custom harness"
topic: testing
kind: technique
summary: "Extend ComponentHarness, locate elements with functions, expose intention-revealing methods and a with() filter."
tags: [testing, harness, harnesspredicate, locatorfor]
related: [component-harnesses, testbed-component, cva-toggle-example, pitfall-unit-test-mistakes]
---
> **In one line:** Extend `ComponentHarness`, find elements with `locatorFor`, and expose methods named after what a user does, never raw elements.

## The idea

A harness class has three parts:

| Part | Code | Why |
|---|---|---|
| host selector | `static hostSelector = 'app-toggle'` | tells the loader which elements it matches |
| locators | `locatorFor('button')` | find inner elements |
| methods | `click()`, `isChecked()` | the public API tests use |

`locatorFor()` and `locatorForAll()` return **functions**, not elements. Calling the function looks the element up *at that moment*. That is deliberate: after a change, the DOM may have been re-rendered, and a cached reference would be stale. The harness always asks again.

Never return a raw `TestElement` from a harness method. It leaks implementation details to every consumer. Wrap it in a method that says what it means.

## See it

```typescript
export class ToggleSwitchHarness extends ComponentHarness {
  static hostSelector = 'app-toggle-switch';

  private readonly button = this.locatorFor('button[role="switch"]');

  static with(options: { label?: string } = {}): HarnessPredicate<ToggleSwitchHarness> {
    return new HarnessPredicate(ToggleSwitchHarness, options).addOption(
      'label',
      options.label,
      async (harness, label) => (await harness.getLabel()) === label,
    );
  }

  async getLabel(): Promise<string> {
    return (await (await this.button()).getAttribute('aria-label')) ?? '';
  }

  async isChecked(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-checked')) === 'true';
  }

  async check(): Promise<void> {
    if (!(await this.isChecked())) await (await this.button()).click();
  }
}
```

## Go deeper

The static `with(filters)` method backed by `HarnessPredicate` is the convention test authors expect: `loader.getHarness(ToggleSwitchHarness.with({ label: 'Email' }))` narrows to one instance among many on a page. Add one option per property people will reasonably filter by.

Keep the harness **next to the component** (`toggle-switch.harness.ts`) and export it alongside. A harness lives and dies with the markup it understands, so the person changing the template is the right person to update it.

Note the `aria-checked` read in the example. A harness that reads accessible attributes tests what assistive technology sees, which makes it more stable than reading classes, and it quietly checks that the component exposes the right semantics.

`check()` is **idempotent**: it only clicks when unchecked. Methods that describe the desired outcome ("check", "select this option") are easier to use than ones that describe the mechanical action ("toggle").

## Watch out

- Returning `TestElement` instances from harness methods.
- Caching an element instead of calling the locator each time.
- Forgetting to give filterable harnesses a `with()` method.

## Remember

- `hostSelector`, locator functions, intention-revealing methods.
- Locators return functions so they are always fresh.
- `with()` plus `HarnessPredicate` makes instances filterable.

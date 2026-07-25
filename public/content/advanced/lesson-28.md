---
id: lesson-28
slug: unit-testing-jest-component-harnesses
title: "Unit Testing with Jest & Component Harnesses"
level: advanced
order: 26
duration: 65
tags:
  - testing
  - jest
  - testbed
  - component-harness
  - zoneless
---

## Learning Objectives

By the end of this lesson you will be able to:

- Configure an isolated Angular test environment with `TestBed` and run it under Jest instead of Karma/Jasmine.
- Explain the difference between `fixture.detectChanges()` and `await fixture.whenStable()`, and know which to prefer in zoneless applications.
- Write a custom Angular CDK `ComponentHarness` that exposes a stable, behavior-based API for a component.
- Use `TestbedHarnessEnvironment`, `HarnessLoader`, and `HarnessPredicate` to query and filter components in your tests.
- Combine Jest mocking (`jest.fn()`, `jest.spyOn()`) with `TestBed` and harnesses to write refactor-resistant tests for realistic, service-backed components.

## Why This Concept Exists

Angular components are not plain classes — they're wired into templates, dependency injection, change detection, and lifecycle hooks by the framework. You can't just `new MyComponent()` and expect it to behave correctly; there's no injector, no rendered DOM, and no change-detection loop backing it. **`TestBed`** exists to solve this: it builds a minimal, isolated Angular environment for a single test — its own injector, its own compiled component tree, its own change-detection cycle — without booting your entire application. Every test starts from a clean slate, so tests can't leak state into each other.

**Jest** is a fast, Node-based test runner with a huge ecosystem, built-in mocking (`jest.fn()`, `jest.spyOn()`, `jest.mock()`), snapshot testing, and parallel test execution. None of that is Angular-specific — `TestBed` and the rest of Angular's testing utilities work the same way regardless of which runner drives them. Jest simply replaces the process that discovers, executes, and reports your `*.spec.ts` files.

> **A note on the current tooling landscape:** Angular's CLI historically shipped an experimental first‑party Jest builder, and more recently the CLI's built-in `@angular/build:unit-test` builder defaults new projects to [Vitest](https://vitest.dev). Jest remains a very widely used, community-supported option, driven by the [`jest-preset-angular`](https://thymikee.github.io/jest-preset-angular/) package. Whichever runner sits underneath, `TestBed` and Angular CDK harnesses behave identically — they operate at the *framework* layer, not the *runner* layer. This lesson uses Jest because it's still one of the most common choices in real-world Angular codebases, and everything you learn here transfers directly if a project later moves to Vitest.

Once you can render a component in isolation, a second problem appears: **how do you interact with it without your tests becoming brittle?** A test that does `fixture.nativeElement.querySelector('.btn.btn-primary.submit-btn')` breaks the moment a designer renames a CSS class or wraps the button in a new `<div>` — even though the component's actual *behavior* didn't change. **Angular CDK Component Harnesses** solve this by giving you a documented, versioned API (`click()`, `getText()`, `setValue()`, …) that hides the HTML structure behind it. The harness author updates the internal selectors once when markup changes; every test using the harness keeps working.

## Concept Explanation

### How `TestBed` builds an isolated component

`TestBed.configureTestingModule({...})` accepts the same kind of metadata as an `@NgModule` — `imports`, `providers`, `declarations` (for older, non-standalone components) — and assembles a throwaway Angular module just for this test file. Because most modern components are **standalone**, you typically don't declare anything: you `import` the component class itself, exactly like you would in a real `@Component`'s `imports` array.

`TestBed.createComponent(MyComponent)` then:

1. Instantiates the component through Angular's dependency injector (so `inject()`/constructor DI works normally).
2. Compiles and attaches its template to a detached DOM node.
3. Returns a `ComponentFixture<MyComponent>` — a handle you use to drive change detection and inspect the result.

Nothing is rendered until you tell Angular to run change detection. In classic Zone.js-based apps, the conventional call is `fixture.detectChanges()`. In modern **zoneless** apps (opt in today with `provideZonelessChangeDetection()`, and where Angular is heading by default), Angular schedules change detection reactively whenever a signal changes — so tests are encouraged to `await fixture.whenStable()` instead of forcing a synchronous pass. `whenStable()` waits for Angular to settle exactly the way it would in production, which catches real scheduling bugs that a manual `detectChanges()` call can paper over.

### How Angular CDK Component Harnesses work

A `ComponentHarness` is a small class that knows how to find and interact with **one kind of component**, without knowing which test environment it's running under (an in-memory unit test, a real browser via WebDriver, etc.). This portability comes from the `TestElement` abstraction: instead of calling `element.click()` on a raw DOM node, a harness calls `await testElement.click()`, and the underlying environment decides how to actually perform that click.

Key building blocks:

- **`hostSelector`** — a static string identifying the DOM element(s) that represent an instance of this component (usually the component's own selector).
- **`locatorFor()` / `locatorForOptional()` / `locatorForAll()`** — methods that return *functions*, which re-query the DOM every time they're called. This matters because Angular's control-flow blocks (`@if`, `@for`) destroy and recreate DOM nodes; caching a raw reference would go stale.
- **`HarnessLoader`** — the entry point for finding harnesses, rooted at some part of the DOM.
- **`TestbedHarnessEnvironment.loader(fixture)`** — bridges a `TestBed` `ComponentFixture` to the harness system, producing a `HarnessLoader`.
- **`HarnessPredicate`** — lets you filter multiple instances of the same component (e.g., "the todo item whose text is *Ship the release*").

A crucial, easy-to-miss benefit: **`TestElement` methods automatically trigger Angular's change detection and wait for pending tasks** before resolving. This means tests written purely against harnesses often need *no* manual `detectChanges()`/`whenStable()` calls at all — the harness handles stabilization for you.

## Key Terminology

| Term | Meaning |
|---|---|
| **`TestBed`** | Angular's static test-module factory; builds an isolated injector + compiled component tree per test. |
| **`ComponentFixture<T>`** | A handle to a `TestBed`-created component instance, its DOM (`nativeElement`), its `DebugElement`, and change-detection controls. |
| **`fixture.detectChanges()`** | Forces a synchronous change-detection pass (classic, Zone.js-friendly pattern). |
| **`fixture.whenStable()`** | Returns a promise that resolves once Angular has finished any pending async/scheduled work — the recommended pattern for zoneless apps. |
| **`jest.fn()`** | Creates a bare mock function you can pass as a callback or provider stub. |
| **`jest.spyOn(obj, 'method')`** | Wraps an existing object's method so you can assert on calls and optionally replace its implementation. |
| **`ComponentHarness`** | Abstract CDK base class for writing a component-specific testing API. |
| **`TestElement`** | Environment-agnostic wrapper around a DOM element, exposing methods like `click()`, `sendKeys()`, `getProperty()`, `text()`. |
| **`HarnessLoader`** | Object used to locate `ComponentHarness` instances within a DOM subtree. |
| **`TestbedHarnessEnvironment`** | Adapter that creates a `HarnessLoader` from a `TestBed` `ComponentFixture`. |
| **`HarnessPredicate`** | Filtering mechanism for narrowing down which harness instance(s) to retrieve. |
| **Zoneless change detection** | Angular's signal-driven change-detection mode enabled via `provideZonelessChangeDetection()`, avoiding Zone.js patching entirely. |

## Syntax Overview

**1. Minimal `TestBed` setup**

```ts
import { TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent], // standalone component, imported directly
  }).compileComponents();
});
```

**2. Creating and driving a fixture**

```ts
const fixture = TestBed.createComponent(MyComponent);
const component = fixture.componentInstance;   // the component class instance
const element = fixture.nativeElement;         // its root HTMLElement

fixture.detectChanges();      // classic (Zone.js) pattern
await fixture.whenStable();   // preferred pattern for zoneless apps
```

**3. A minimal harness**

```ts
import { ComponentHarness } from '@angular/cdk/testing';

export class MyHarness extends ComponentHarness {
  static hostSelector = 'app-my-component';

  private getButton = this.locatorFor('button');

  async click(): Promise<void> {
    const button = await this.getButton();
    await button.click();
  }
}
```

**4. Loading a harness from a `TestBed` fixture**

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import type { HarnessLoader } from '@angular/cdk/testing';

const loader: HarnessLoader = TestbedHarnessEnvironment.loader(fixture);
const harness = await loader.getHarness(MyHarness);
await harness.click();
```

**5. Jest mocking cheatsheet**

```ts
const onClick = jest.fn();                                   // bare mock
jest.spyOn(service, 'save').mockReturnValue(of(true));        // replace return value
jest.spyOn(service, 'save').mockImplementation(() => of(true)); // replace implementation
expect(onClick).toHaveBeenCalledWith('expected-arg');
```

## Real World Analogy

Think of `TestBed` as a **theater's rehearsal stage**: before every scene, the crew resets the set from scratch — same lighting rig, same props closet (the injector), nothing left over from the last rehearsal. That isolation is what lets you rehearse one scene a hundred times without earlier takes bleeding into the next.

Now think of a **Component Harness as a universal remote control** for a specific TV model. Instead of learning where every button physically sits on the remote (raw CSS selectors and DOM structure — which the manufacturer might rearrange in the next hardware revision), you get a documented interface: "power," "volume up," "channel." If the manufacturer redesigns the remote's internal circuitry, they update the mapping once — your muscle memory (your test code) for "press volume up" keeps working without any changes.

## Examples

### 1. Basic Example — Testing a signal-based counter with `TestBed` + Jest

This example covers the fundamentals: configuring `TestBed`, creating a fixture, driving change detection, and asserting against the rendered DOM and the component instance.

```ts
// counter.component.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <p data-testid="count">Count: {{ count() }}</p>
    <button type="button" (click)="increment()">Increment</button>
    <button type="button" (click)="reset()">Reset</button>
  `,
})
export class CounterComponent {
  count = signal(0);

  increment(): void {
    this.count.update((value) => value + 1);
  }

  reset(): void {
    this.count.set(0);
  }
}
```

```ts
// counter.component.spec.ts
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;
  let component: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run initial change detection
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders an initial count of 0', () => {
    const countEl: HTMLElement = fixture.nativeElement.querySelector('[data-testid="count"]');
    expect(countEl.textContent).toContain('Count: 0');
  });

  it('increments the count when the button is clicked', () => {
    const [incrementBtn] = fixture.nativeElement.querySelectorAll('button');
    incrementBtn.click();
    fixture.detectChanges();

    expect(component.count()).toBe(1);
  });

  it('resets the count', () => {
    const [incrementBtn, resetBtn] = fixture.nativeElement.querySelectorAll('button');
    incrementBtn.click();
    incrementBtn.click();
    resetBtn.click();
    fixture.detectChanges();

    expect(component.count()).toBe(0);
  });
});
```

**Why this works:** `TestBed.configureTestingModule` treats `CounterComponent` as a standalone import, exactly as it would appear in a real feature's `imports` array — no `NgModule` boilerplate needed. `fixture.detectChanges()` is what actually renders the interpolated `count()` value and wires up the `(click)` listeners; forgetting it is the single most common cause of "my test reads stale DOM" bugs (see **Common Mistakes**).

### 2. Real-World Example — A custom harness that survives markup refactors

Here we build a reusable `SearchBoxComponent` and a matching `SearchBoxHarness`. Notice how the test never touches a CSS selector or DOM structure directly — it only calls documented harness methods.

```ts
// search-box.component.ts
import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  template: `
    <label class="search-box">
      <span class="search-box__label">Search</span>
      <input
        class="search-box__input"
        type="text"
        [value]="query()"
        (input)="onInput($event)"
        (keyup.enter)="submit()"
        placeholder="Search products…"
      />
    </label>
    <button type="button" class="search-box__submit" (click)="submit()">Search</button>
  `,
})
export class SearchBoxComponent {
  query = signal('');
  search = output<string>();

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  submit(): void {
    this.search.emit(this.query().trim());
  }
}
```

```ts
// search-box.harness.ts
import { ComponentHarness } from '@angular/cdk/testing';

export class SearchBoxHarness extends ComponentHarness {
  static hostSelector = 'app-search-box';

  private getInput = this.locatorFor('input');
  private getSubmitButton = this.locatorFor('button');

  /** Types a query into the search box without submitting it. */
  async setQuery(query: string): Promise<void> {
    const input = await this.getInput();
    await input.clear();
    await input.sendKeys(query);
  }

  /** Reads the current value of the search input. */
  async getQuery(): Promise<string> {
    const input = await this.getInput();
    return (await input.getProperty('value')) as string;
  }

  /** Clicks the submit button. */
  async submit(): Promise<void> {
    const button = await this.getSubmitButton();
    await button.click();
  }
}
```

```ts
// search-box.component.spec.ts
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import type { HarnessLoader } from '@angular/cdk/testing';
import { SearchBoxComponent } from './search-box.component';
import { SearchBoxHarness } from './search-box.harness';

describe('SearchBoxComponent (via harness)', () => {
  let fixture: ComponentFixture<SearchBoxComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBoxComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('emits the trimmed query when the user searches', async () => {
    const emitted: string[] = [];
    fixture.componentInstance.search.subscribe((value) => emitted.push(value));

    const searchBox = await loader.getHarness(SearchBoxHarness);
    await searchBox.setQuery('  wireless mouse  ');
    await searchBox.submit();

    expect(emitted).toEqual(['wireless mouse']);
  });

  it('reflects typed text back through getQuery()', async () => {
    const searchBox = await loader.getHarness(SearchBoxHarness);

    await searchBox.setQuery('keyboard');

    expect(await searchBox.getQuery()).toBe('keyboard');
  });
});
```

**Why this matters:** imagine a designer wraps the `<input>` in an extra `<div class="search-box__field">` and renames `.search-box__submit` to `.search-box__cta`. A test written with `fixture.nativeElement.querySelector('.search-box__submit')` breaks immediately. This test doesn't — only `SearchBoxHarness`'s internal selectors need a one-line update, and every test file using the harness keeps passing.

### 3. Best-Practice Example — Service-backed list with mocking, zoneless `TestBed`, and `HarnessPredicate`

This example combines everything: a signal-based service, Jest spies, `provideZonelessChangeDetection()`, and a filterable harness built with `HarnessPredicate`.

```ts
// todo.model.ts
export interface Todo {
  id: number;
  text: string;
  done: boolean;
}
```

```ts
// todo.service.ts
import { Injectable, signal } from '@angular/core';
import { Todo } from './todo.model';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private nextId = 1;
  readonly todos = signal<Todo[]>([]);

  addTodo(text: string): void {
    this.todos.update((todos) => [...todos, { id: this.nextId++, text, done: false }]);
  }

  toggleTodo(id: number): void {
    this.todos.update((todos) =>
      todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );
  }
}
```

```ts
// todo-list.component.ts
import { Component, inject } from '@angular/core';
import { TodoService } from './todo.service';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  template: `
    <ul class="todo-list">
      @for (todo of todoService.todos(); track todo.id) {
        <li class="todo-item" [class.todo-item--done]="todo.done">
          <label>
            <input
              type="checkbox"
              [checked]="todo.done"
              (change)="todoService.toggleTodo(todo.id)"
            />
            {{ todo.text }}
          </label>
        </li>
      }
    </ul>
  `,
})
export class TodoListComponent {
  protected todoService = inject(TodoService);
}
```

```ts
// todo-item.harness.ts
import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

export interface TodoItemHarnessFilters extends BaseHarnessFilters {
  text?: string | RegExp;
  done?: boolean;
}

export class TodoItemHarness extends ComponentHarness {
  static hostSelector = '.todo-item';

  private getCheckbox = this.locatorFor('input[type="checkbox"]');

  static with(options: TodoItemHarnessFilters = {}): HarnessPredicate<TodoItemHarness> {
    return new HarnessPredicate(TodoItemHarness, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'done',
        options.done,
        async (harness, done) => (await harness.isDone()) === done,
      );
  }

  async getText(): Promise<string> {
    const host = await this.host();
    return (await host.text()).trim();
  }

  async isDone(): Promise<boolean> {
    const checkbox = await this.getCheckbox();
    return Boolean(await checkbox.getProperty('checked'));
  }

  async toggle(): Promise<void> {
    const checkbox = await this.getCheckbox();
    await checkbox.click();
  }
}
```

```ts
// todo-list.harness.ts
import { ComponentHarness } from '@angular/cdk/testing';
import { TodoItemHarness, type TodoItemHarnessFilters } from './todo-item.harness';

export class TodoListHarness extends ComponentHarness {
  static hostSelector = 'app-todo-list';

  async getItems(filters: TodoItemHarnessFilters = {}): Promise<TodoItemHarness[]> {
    const getFilteredItems = this.locatorForAll(TodoItemHarness.with(filters));
    return getFilteredItems();
  }
}
```

```ts
// todo-list.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TodoListComponent } from './todo-list.component';
import { TodoService } from './todo.service';
import { TodoListHarness } from './todo-list.harness';

describe('TodoListComponent', () => {
  let loader: HarnessLoader;
  let todoService: TodoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    const fixture = TestBed.createComponent(TodoListComponent);
    todoService = TestBed.inject(TodoService);
    loader = TestbedHarnessEnvironment.loader(fixture);

    await fixture.whenStable(); // preferred over detectChanges() in zoneless tests
  });

  it('renders one item per todo and filters by completion state', async () => {
    todoService.addTodo('Write the Jest lesson');
    todoService.addTodo('Record the CDK harness demo');
    todoService.toggleTodo(1);

    const list = await loader.getHarness(TodoListHarness);
    const doneItems = await list.getItems({ done: true });
    const pendingItems = await list.getItems({ done: false });

    expect(doneItems).toHaveLength(1);
    expect(pendingItems).toHaveLength(1);
    expect(await doneItems[0].getText()).toContain('Write the Jest lesson');
  });

  it('toggles a todo when its checkbox is clicked', async () => {
    todoService.addTodo('Ship the release');

    const list = await loader.getHarness(TodoListHarness);
    const [item] = await list.getItems();

    expect(await item.isDone()).toBe(false);

    await item.toggle();

    expect(await item.isDone()).toBe(true);
  });

  it('uses a mocked service call to verify interaction, not implementation', async () => {
    const toggleSpy = jest.spyOn(todoService, 'toggleTodo');
    todoService.addTodo('Deploy to staging');

    const list = await loader.getHarness(TodoListHarness);
    const [item] = await list.getItems();
    await item.toggle();

    expect(toggleSpy).toHaveBeenCalledWith(1);
  });
});
```

**Why this is best practice:** the test never reads a raw CSS class, notice we don't need `detectChanges()`/`whenStable()` again inside each `it()` block — `TestElement` methods like `checkbox.click()` and `checkbox.getProperty()` already wait for Angular to stabilize. `jest.spyOn` verifies the component *called* the service correctly without duplicating the service's own logic in the test, and `provideZonelessChangeDetection()` keeps the test aligned with how modern Angular apps actually run in production.

## Common Mistakes

- **Forgetting `fixture.detectChanges()` / `await fixture.whenStable()`.** Nothing renders until change detection runs at least once; assertions against the DOM will see stale or empty content.
- **Calling `detectChanges()` repeatedly for unrelated actions in one test.** With `OnPush`/zoneless components this can trigger `ExpressionChangedAfterItHasBeenCheckedError`. Prefer one action + one `await fixture.whenStable()` per assertion, or split into separate `it()` blocks.
- **Reaching for raw DOM queries (`querySelector('.btn-primary')`) instead of a harness** for components that are shared across the app — this is exactly the brittleness harnesses exist to prevent.
- **Exposing raw `TestElement` instances from a harness.** Doing so leaks implementation details to harness consumers; wrap them in intention-revealing methods like `click()`, `getText()`, `isDone()` instead.
- **Forgetting to `await` async harness calls.** `harness.click()`, `loader.getHarness(...)`, and `locatorFor(...)()` are all `Promise`-returning; a missing `await` produces silent race conditions and flaky tests.
- **Mixing test-framework APIs.** Using `jasmine.createSpy()` in a Jest project (or vice versa) throws a runtime error — stick to `jest.fn()` / `jest.spyOn()` once your runner is Jest.
- **Missing the CDK peer dependency.** `@angular/cdk/testing` imports fail with "Cannot find module" until you run `ng add @angular/cdk`.
- **Using the old `provideExperimentalZonelessChangeDetection` name.** The API stabilized as `provideZonelessChangeDetection`; older blog posts and snippets still reference the experimental name.
- **Writing a harness for a single-use, page-specific component.** Harnesses pay off for shared, reusable widgets. A component that only appears in one place can reasonably be tested against its own implementation details, since the test and component evolve together.

## Best Practices

- Keep `TestBed.configureTestingModule` minimal: import only what the component under test needs, and mock or stub heavy dependencies (HTTP, routing) rather than pulling in real implementations.
- Prefer `await fixture.whenStable()` over manual `fixture.detectChanges()` in new, zoneless-ready test suites; it more closely matches production scheduling behavior.
- Write **one harness class per reusable component**, alongside the component's source file (e.g., `search-box.harness.ts` next to `search-box.component.ts`), and treat it as part of that component's public API.
- Give every filterable harness a static `with(filters)` method backed by `HarnessPredicate` — this is the idiomatic way test authors expect to narrow down instances.
- Retrieve services with `TestBed.inject(MyService)` and use `jest.spyOn` on the real instance rather than hand-rolling a fake class; you keep full type safety and catch signature drift automatically.
- Avoid `NO_ERRORS_SCHEMA` — it silently swallows template binding errors that you actually want your tests to catch.
- Run tests non-interactively in CI (`ng test --no-watch --no-progress`, or the equivalent Jest CLI flags) so pipelines don't hang waiting for watch mode.
- Reserve raw `fixture.nativeElement` queries for the component under test's *own*, private markup — reach for a harness the moment you're asserting on a child component's behavior.

## Summary

- `TestBed` builds a fresh, isolated Angular test module and injector for every test, without booting a full application.
- Standalone components are imported directly into `TestBed.configureTestingModule({ imports: [...] })` — no `NgModule` boilerplate required.
- Jest can run Angular test suites via `jest-preset-angular`; the Angular CLI's own built-in unit-test builder now defaults new projects to Vitest, but `TestBed` and CDK harness APIs behave identically under either runner.
- `fixture.detectChanges()` forces synchronous change detection; `await fixture.whenStable()` waits for Angular to settle naturally and is the recommended pattern for zoneless apps.
- Angular CDK Component Harnesses decouple test code from HTML structure by exposing a stable, documented, behavior-based API instead of raw selectors.
- `locatorFor` / `locatorForOptional` / `locatorForAll` return *functions* that re-query the DOM on every call, so they stay correct across `@if`/`@for` re-renders.
- `HarnessPredicate` plus a conventional static `with()` method lets tests filter down to a specific instance among many.
- `TestElement` methods automatically trigger change detection and wait for pending tasks, so harness-driven tests often need no manual stabilization calls.
- Harnesses provide the most value for shared, reusable components; single-use, page-specific components may not need one.

## Flash Cards

**Q: What does `TestBed.configureTestingModule()` do?**
A: It assembles a temporary Angular testing module — imports, providers, and (for non-standalone code) declarations — giving the component under test its own isolated injector and compilation context.

**Q: Why prefer `await fixture.whenStable()` over `fixture.detectChanges()` in zoneless tests?**
A: `whenStable()` waits for Angular's own reactive scheduling to settle, matching production behavior, while `detectChanges()` forces a synchronous pass that can mask real scheduling issues and trigger `ExpressionChangedAfterItHasBeenCheckedError` when called repeatedly.

**Q: What problem do Angular CDK Component Harnesses solve?**
A: They replace brittle CSS-selector/DOM-structure queries in tests with a stable, purpose-built API, so refactoring a component's internal markup doesn't break every test that interacts with it.

**Q: What's the difference between `locatorFor()` and `locatorForOptional()`?**
A: `locatorFor()` returns a function that throws if no matching element is found; `locatorForOptional()` returns a function that resolves to `null` instead, for elements that may or may not be present.

**Q: How do you retrieve one specific instance out of several matching harnesses?**
A: Add a static `with(filters)` method on the harness that builds and returns a `HarnessPredicate`, then pass it to `getHarness()`, `getAllHarnesses()`, or `locatorForAll()`.

## Exercises

### Easy

Write a Jest + `TestBed` spec for a standalone `GreetingComponent` with an `input()` called `name: string | undefined`. Its template should render `Hello, {{ name() || 'stranger' }}!`. Your test should:

1. Verify it renders `"Hello, stranger!"` when no name is provided.
2. Set the input to `"Ada"` (via `fixture.componentRef.setInput('name', 'Ada')`) and verify it renders `"Hello, Ada!"` after change detection.

### Medium

Given a `RatingComponent` that renders five clickable `<span class="star">` elements (1 through 5) and emits the selected value through an `output<number>()` named `rated`, write:

1. A `RatingHarness` with `getValue(): Promise<number>` (count how many stars have a `star--filled` class) and `setValue(n: number): Promise<void>` (click the nth star).
2. A Jest test using `TestbedHarnessEnvironment.loader(fixture)` that sets the rating to `3` via the harness and asserts the component emitted `3`.

*Hint: use `locatorForAll('.star')` inside the harness to get all star elements as an array of `TestElement`s.*

### Challenging

Extend the `TodoListComponent` example from this lesson:

1. Add a "Clear completed" button to the template that removes all `done: true` todos from `TodoService`.
2. Add a `clearCompleted()` method to `TodoListHarness` that clicks this button.
3. Add a `getItemCount(filters?: TodoItemHarnessFilters): Promise<number>` convenience method to `TodoListHarness`.
4. Extend `TodoItemHarnessFilters` to support filtering by a `RegExp` for `text` (the existing `HarnessPredicate.stringMatches` helper already supports this — confirm it with a test).
5. Write a `provideZonelessChangeDetection()`-based Jest test that adds three todos, marks two as done, clicks "Clear completed" through the harness, and asserts exactly one todo remains — using `await fixture.whenStable()` rather than `detectChanges()` throughout.

## Further Reading

- [Angular — Testing overview](https://angular.dev/guide/testing)
- [Angular — Basics of testing components](https://angular.dev/guide/testing/components-basics)
- [Angular — Component harnesses overview](https://angular.dev/guide/testing/component-harnesses-overview)
- [Angular — Using component harnesses in tests](https://angular.dev/guide/testing/using-component-harnesses)
- [Angular — Creating harnesses for your components](https://angular.dev/guide/testing/creating-component-harnesses)
- [Angular — Zoneless change detection](https://angular.dev/guide/zoneless)
- [Angular — Migrating from Karma to Vitest](https://angular.dev/guide/testing/migrating-to-vitest) (useful context on the current test-runner landscape)
- [Angular CDK — Testing overview (Material docs)](https://material.angular.dev/cdk/testing/overview)
- [jest-preset-angular documentation](https://thymikee.github.io/jest-preset-angular/)
- [Jest documentation](https://jestjs.io/docs/getting-started)

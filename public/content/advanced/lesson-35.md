---
id: lesson-35
slug: micro-frontends-angular-elements
title: "Micro Frontends with Angular Elements"
level: advanced
order: 33
duration: 60
tags:
  - architecture
  - design-patterns
  - micro-frontends
  - angular-elements
  - web-components
---

## Learning Objectives

By the end of this lesson you will be able to:

- Explain what a **micro frontend** is and the organizational problem it solves.
- Decide when micro frontends are worth their costs, and when feature folders in one app are the better choice.
- Slice an application **vertically** by business capability instead of by technical layer.
- Compare the main integration options: build-time packages, iframes, Web Components, and Module/Native Federation.
- Package a standalone component as a **custom element** with `@angular/elements`, building it zoneless so it can live inside another Angular app.
- Load a micro frontend at runtime from a host app, pass data in through properties, listen for its events, and handle loading failures.
- Design the contract between host and micro frontend so teams can deploy independently.

## Why This Concept Exists

A single Angular app scales well for one team, and for a few teams that coordinate closely. Past that point, organizational problems show up:

- **Release trains.** Every team's change ships in the same build, so one unfinished feature or failing test blocks everyone.
- **Ownership blur.** Nobody is sure who can change the shared layout, the build config, or the Angular version.
- **Upgrade gridlock.** Moving to a new Angular major means coordinating every team at once.

Backend teams hit the same wall years earlier and split monolith services into **microservices**. **Micro frontends** apply that idea to the UI: a large frontend is split into smaller apps, each owned end to end by one team, then composed into what users see as a single product.

The key point: micro frontends are mainly an **organizational** pattern. They let teams build, test, and deploy independently. The technical side is the price you pay for that independence, and the price is real.

## Concept Explanation

### When micro frontends make sense

Consider them when most of these are true:

- Several teams work on the same product, each owning a clear business area.
- Teams need to **deploy on their own schedule** without a shared release.
- The areas are fairly independent: they share a shell and a design system, not lots of state.
- You have the platform capacity to run the shared pieces: the shell, the design system, the CI/CD for many apps.

### When they don't

- **One team, or a few teams that already coordinate.** Feature folders with lazy routes (see the **Feature-Based Architecture & Lazy Boundaries** lesson) give you the boundaries without the runtime costs.
- **Performance is critical and budgets are tight.** Each independently built micro frontend tends to bring its own copy of the framework runtime unless you add tooling to share it.
- **Areas are tightly coupled.** If two "independent" parts constantly exchange state, splitting them adds integration work without adding independence.

Rule of thumb: start with a well-structured single app. Split a piece out when a team's need to deploy independently is concrete, not hypothetical.

### Slice vertically, by business capability

Each micro frontend should cover a full user journey or business capability, such as "exercise catalog", "checkout", or "admin", including its own UI, state, and API calls. Avoid horizontal slices like "the header team", "the forms team", or "the services team". Those can't ship anything useful on their own, so they reintroduce the coordination you were trying to remove.

### Integration options

| Approach | How it works | Good for | Watch out for |
|---|---|---|---|
| Build-time packages | Each team publishes an npm library; the host installs and builds it | Shared components, design systems | Not independent deployment: the host must rebuild to ship a change |
| iframes | Each micro frontend is a separate page embedded in a frame | Strong isolation, legacy apps | Awkward sizing, routing, accessibility, and communication |
| Web Components (Angular Elements) | Each micro frontend is a custom HTML element loaded at runtime | Framework-agnostic widgets and pages with a small contract | Each bundle carries its own runtime; styling and zone.js need care |
| Module / Native Federation | The host loads remote modules at runtime and shares dependencies like Angular itself | Several Angular micro frontends that want shared dependencies | More build tooling; teams must agree on shared versions |

This lesson uses Angular Elements because it relies only on web standards and the official `@angular/elements` package, and the same element can be used by an Angular, React, or plain HTML host. Native Federation (`@angular-architects/native-federation`) is the common next step when you have many Angular micro frontends and want to share one copy of Angular between them.

### Web Components and Angular Elements

**Web Components** are browser standards for defining your own HTML tags. A **custom element** like `<exercise-form>` is registered with `customElements.define()` and then works anywhere HTML does.

**Angular Elements** wraps an Angular component in a custom element:

- Component **inputs** become element **properties**, and are also readable from dash-case **attributes**. An input named `maxItems` is set with `element.maxItems = 5` or `<x-widget max-items="5">`.
- Component **outputs** are dispatched as DOM **`CustomEvent`s** with the output's name. The emitted value is in `event.detail`.
- Angular's change detection and DI run inside the element, using the injector you give it.

### Runtime concerns

- **zone.js**: only one copy of zone.js can run on a page. If the host is an Angular app using zone.js, build the micro frontend **zoneless** (`provideZonelessChangeDetection()`, no `zone.js` polyfill). Zoneless components work well when they use signals.
- **Duplicate frameworks**: each element bundles its own Angular runtime. That's acceptable for a few micro frontends, but measure it, and consider Native Federation if the duplication grows.
- **Styles**: global styles from the host can leak into the element and vice versa. `ViewEncapsulation.ShadowDom` gives the element its own style scope. A shared design system keeps everything looking like one product.
- **ES modules**: the Angular CLI's application builder outputs ES modules, so the host must load the bundle with `<script type="module">`.
- **Versioning**: deploy each release to a versioned URL so the host can pin, upgrade, and roll back deliberately.

## Key Terminology

- **Micro frontend**: an independently built and deployed part of a frontend, owned by one team and composed with others into one product.
- **Host (shell)**: the application that provides the layout, routing, and authentication, and loads micro frontends into it.
- **Vertical slice**: a cut through all layers of one business capability, from UI to API calls.
- **Web Components**: browser standards (custom elements, Shadow DOM, templates) for creating reusable, framework-agnostic HTML elements.
- **Custom element**: a developer-defined HTML tag registered with `customElements.define()`.
- **Angular Elements**: the `@angular/elements` package that turns an Angular component into a custom element with `createCustomElement()`.
- **Contract**: the agreed public API between host and micro frontend: tag name, properties, events, and versioning rules.
- **Module / Native Federation**: build tooling that loads remote code at runtime and shares common dependencies between apps.
- **Zoneless**: running Angular change detection without zone.js, driven by signals and explicit notifications.

## Syntax Overview

```typescript
// Micro frontend: main.ts
import { provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { MyWidget } from './app/my-widget';

createApplication({ providers: [provideZonelessChangeDetection()] }).then((app) => {
  const element = createCustomElement(MyWidget, { injector: app.injector });
  customElements.define('my-widget', element);
});
```

```typescript
// Host: a standalone component that renders the element
import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';

@Component({
  selector: 'app-widget-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // allow tags Angular doesn't know about
  template: `<my-widget [title]="'Hello'" (picked)="onPicked($event)"></my-widget>`,
})
export class WidgetPage {
  onPicked(event: Event): void {
    const value = (event as CustomEvent<string>).detail;
  }
}
```

## Real World Analogy

Think of a food court.

- Each **stall** is run by its own team, with its own kitchen, menu, staff, and opening hours. A stall can change its menu without asking the others. That's a **micro frontend** with independent deployment.
- The **food court** provides the seating, the signs, the trays, and the payment system. That's the **host shell** and the **design system**. Diners experience one place, not twelve restaurants.
- Each stall has a **counter** with a standard shape: you hand over an order, you get a tray back. That's the **contract** (properties in, events out).
- Stalls are organized by cuisine (**vertical slices**), not "one stall for all the drinks and one for all the cutlery".
- If every stall brings its own generator (its own framework runtime), the place still works, but it's noisy and the bill goes up. Sharing the building's power is what **federation** offers.
- For a single small café, building a food court would be silly. That's the one-team app.

## Examples

### 1. Basic Example: Turning a standalone component into a custom element

The exercise team owns an "add exercise" form. They build it as a normal standalone component with signal inputs and outputs.

```typescript
// exercise-form/src/app/exercise-form.ts
import { Component, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Exercise, ExercisesApi } from './exercises.api';

@Component({
  selector: 'app-exercise-form',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3">
      <h2 class="text-lg font-bold">{{ heading() }}</h2>
      <label class="block">
        Description
        <input formControlName="description" class="w-full rounded border px-3 py-2" />
      </label>
      <button type="submit" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Saving…' : 'Save exercise' }}
      </button>
    </form>
  `,
})
export class ExerciseForm {
  private readonly api = inject(ExercisesApi);

  readonly heading = input('New exercise');
  readonly exerciseSaved = output<Exercise>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    description: ['', Validators.required],
  });
  protected readonly saving = signal(false);

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.create(this.form.getRawValue()).subscribe({
      next: (exercise) => {
        this.form.reset();
        this.saving.set(false);
        this.exerciseSaved.emit(exercise);
      },
      error: () => this.saving.set(false),
    });
  }
}
```

```typescript
// exercise-form/src/main.ts: register a custom element instead of bootstrapping an app
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { ExerciseForm } from './app/exercise-form';

const TAG = 'exercise-form';

createApplication({
  providers: [
    provideZonelessChangeDetection(), // don't bring a second zone.js into the host
    provideHttpClient(withFetch()),
  ],
})
  .then((app) => {
    // Guard against double registration if the script is loaded twice.
    if (!customElements.get(TAG)) {
      customElements.define(TAG, createCustomElement(ExerciseForm, { injector: app.injector }));
    }
  })
  .catch((error) => console.error('exercise-form failed to start', error));
```

```html
<!-- exercise-form/src/index.html: a standalone harness so the team can develop without the host -->
<body>
  <exercise-form heading="Add an exercise (dev harness)"></exercise-form>
</body>
```

**Why this works:** the component is ordinary Angular. Only `main.ts` changes: instead of `bootstrapApplication()`, it creates an application context and registers `<exercise-form>` as a custom element. The `heading` input is now settable as a property or the `heading` attribute, and `exerciseSaved` is dispatched as a DOM event.

### 2. Real-World Example: Building, serving, and loading it from the host

First, configure the micro frontend's build so the output has a stable file name and no zone.js.

```json
// exercise-form/angular.json (excerpt)
"options": {
  "browser": "src/main.ts",
  "polyfills": [],
  "outputHashing": "none"
}
```

```bash
# Build, then serve the output with CORS so the host (on another port) can load it
ng build
npx http-server dist/exercise-form/browser --cors -p 8080
```

The build produces `main.js` (an ES module) and `styles.css` in `dist/exercise-form/browser/`.

On the host side, a small utility loads a module script once and remembers the result.

```typescript
// host/src/app/core/mfe/load-module-script.ts
const pending = new Map<string, Promise<void>>();

export function loadModuleScript(document: Document, src: string): Promise<void> {
  const existing = pending.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module'; // the Angular application builder outputs ES modules
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => {
      pending.delete(src); // allow a later retry
      reject(new Error(`Could not load ${src}`));
    };
    document.head.appendChild(script);
  });

  pending.set(src, promise);
  return promise;
}
```

```typescript
// host/src/app/features/exercises/exercise-registry-page.ts
import { CUSTOM_ELEMENTS_SCHEMA, Component, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { loadModuleScript } from '../../core/mfe/load-module-script';

interface Exercise {
  id: string;
  description: string;
}

const EXERCISE_FORM_URL = 'http://localhost:8080/main.js';

@Component({
  selector: 'app-exercise-registry-page',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @switch (status()) {
      @case ('loading') {
        <p>Loading the exercise form…</p>
      }
      @case ('error') {
        <p role="alert">The exercise form is unavailable right now. Please try again later.</p>
      }
      @case ('ready') {
        <exercise-form
          [heading]="'Add an exercise to your catalog'"
          (exerciseSaved)="onSaved($event)"
        ></exercise-form>
      }
    }

    @if (lastSaved(); as exercise) {
      <p class="mt-4 text-emerald-700">Saved "{{ exercise.description }}".</p>
    }
  `,
})
export class ExerciseRegistryPage {
  private readonly document = inject(DOCUMENT);

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly lastSaved = signal<Exercise | null>(null);

  constructor() {
    loadModuleScript(this.document, EXERCISE_FORM_URL)
      .then(() => customElements.whenDefined('exercise-form'))
      .then(() => this.status.set('ready'))
      .catch(() => this.status.set('error'));
  }

  protected onSaved(event: Event): void {
    // Outputs arrive as CustomEvents; the emitted value is in `detail`.
    this.lastSaved.set((event as CustomEvent<Exercise>).detail);
  }
}
```

```typescript
// host/src/app/app.routes.ts (excerpt): the micro frontend gets a normal lazy route
{
  path: 'exercises/new',
  loadComponent: () =>
    import('./features/exercises/exercise-registry-page').then((m) => m.ExerciseRegistryPage),
},
```

**Why this works:** the host owns routing and layout, and treats the micro frontend like any other HTML element: it binds the `heading` property and listens for the `exerciseSaved` event. `CUSTOM_ELEMENTS_SCHEMA` tells the compiler that `<exercise-form>` is defined elsewhere. The page has explicit loading and error states, so if the exercise team's server is down, the rest of the app keeps working.

### 3. Best-Practice Example: A typed contract, style isolation, and versioned deploys

Independent deployment only works if both sides agree on a contract and change it carefully. Put the contract in one small file (or a tiny shared npm package) that both teams use.

```typescript
// contracts/exercise-form.contract.ts
/** Tag name. Changing it is a breaking change. */
export const EXERCISE_FORM_TAG = 'exercise-form';

/** Properties the host may set. Adding optional ones is non-breaking. */
export interface ExerciseFormProperties {
  heading?: string;
}

/** Payload of the `exerciseSaved` event. Removing fields is a breaking change. */
export interface ExerciseSavedDetail {
  id: string;
  description: string;
}

export type ExerciseSavedEvent = CustomEvent<ExerciseSavedDetail>;
```

```typescript
// exercise-form/src/app/exercise-form.ts (excerpt): isolate styles in Shadow DOM
import { Component, ViewEncapsulation, input, output } from '@angular/core';
import { ExerciseSavedDetail } from '../../../contracts/exercise-form.contract';

@Component({
  selector: 'app-exercise-form',
  encapsulation: ViewEncapsulation.ShadowDom, // host styles can't leak in, ours can't leak out
  styles: `
    :host { display: block; font-family: var(--ds-font-family, system-ui); }
    button { background: var(--ds-color-primary, #2563eb); color: white; }
  `,
  template: `<!-- same form as before -->`,
})
export class ExerciseForm {
  readonly heading = input('New exercise');
  readonly exerciseSaved = output<ExerciseSavedDetail>();
}
```

```typescript
// host/src/app/features/exercises/exercise-form.config.ts: pin a version on purpose
// Each release of the micro frontend is deployed to its own folder, e.g.
//   https://cdn.example.com/mfe/exercise-form/1.4.0/main.js
// Upgrading or rolling back is a one-line change the host team controls.
export const EXERCISE_FORM_VERSION = '1.4.0';
export const EXERCISE_FORM_URL =
  `https://cdn.example.com/mfe/exercise-form/${EXERCISE_FORM_VERSION}/main.js`;
```

A few rules make the contract hold up over time:

- **Data in through properties, events out.** Never let the micro frontend reach into the host's services or the global `window` for state.
- **The host owns cross-cutting concerns.** Routing, layout, and sign-in stay in the shell. If the micro frontend needs an auth token, pass it as a *property*, not an attribute, so it doesn't appear in the DOM.
- **Theme through CSS custom properties.** Design-system variables like `--ds-color-primary` cross the Shadow DOM boundary, so the element can match the host's theme without sharing stylesheets.
- **Semantic versioning for the contract.** Additions are minor versions. Renames and removals are major versions, deployed side by side until every host has moved.

**Why this is best practice:** the contract file makes the integration surface explicit and reviewable. Shadow DOM stops style collisions in both directions, while CSS variables still allow theming. Versioned URLs turn "the other team deployed and our page broke" into a deliberate upgrade with a one-line rollback.

## Common Mistakes

- **Using micro frontends for one team.** You take on runtime, versioning, and infrastructure costs without gaining any independence. Use feature folders and lazy routes instead.
- **Slicing horizontally.** A "header micro frontend" and a "forms micro frontend" can't ship features alone, so every change needs several teams again.
- **Loading two copies of zone.js.** An Angular host with zone.js plus an element that also includes zone.js fails or behaves strangely. Build elements zoneless.
- **Loading the bundle as a classic script.** The CLI outputs ES modules. Use `<script type="module">`, or the browser will throw syntax errors on `import`.
- **Forgetting `CUSTOM_ELEMENTS_SCHEMA`.** Without it, the host's compiler reports `exercise-form` as an unknown element.
- **Reading outputs as plain values.** The handler receives a `CustomEvent`. The emitted value is `event.detail`.
- **Shared mutable globals.** A `window.appState` that several micro frontends write to recreates the monolith, only harder to debug.
- **Unversioned, cache-forever URLs.** With `outputHashing: none`, a fixed URL plus long cache headers means users keep the old version. Version the path, or use short cache lifetimes.
- **Inconsistent UI.** Without a shared design system, users notice the seams between teams immediately.

## Best Practices

- Choose micro frontends for organizational reasons, such as several teams needing independent deploys, and only after a well-structured single app stops being enough.
- Slice by business capability, so each micro frontend delivers a complete user journey.
- Keep the contract small and typed: a tag name, a few properties, and a few events.
- Build Angular Elements zoneless with signal-based components, and keep a dev harness (`index.html`) so the team can work without the host.
- Let the host own routing, layout, and authentication.
- Give every micro frontend explicit loading and error states in the host, so one failing team doesn't take down the page.
- Deploy to versioned URLs, and treat contract changes with semantic versioning.
- Share a design system and theme through CSS custom properties. Consider `ViewEncapsulation.ShadowDom` for style isolation.
- Measure the bundle cost of each element, and look at Native Federation once several Angular micro frontends duplicate the same runtime.

## Summary

- Micro frontends split a large frontend into independently built and deployed parts, owned by separate teams.
- Their main benefit is organizational. Their costs are performance (duplicated runtimes), consistency, and integration work.
- Slice vertically by business capability. Use feature folders in one app when a single team owns everything.
- Integration options range from build-time packages and iframes to Web Components and Module/Native Federation.
- Angular Elements turns a standalone component into a custom element: inputs become properties and attributes, outputs become `CustomEvent`s.
- Build elements zoneless, load them as ES modules, and use `CUSTOM_ELEMENTS_SCHEMA` in the host.
- A small typed contract, versioned deploys, a shared design system, and graceful failure handling keep independent teams from breaking each other.

## Flash Cards

**Q: What is the main reason to adopt micro frontends?**
A: Organizational independence: letting several teams build, test, and deploy their part of the product on their own schedule.

**Q: How does Angular Elements expose a component's inputs and outputs?**
A: Inputs become properties on the custom element (and dash-case attributes). Outputs are dispatched as DOM `CustomEvent`s, with the emitted value in `event.detail`.

**Q: Why should an Angular Element that runs inside an Angular host be built zoneless?**
A: Only one copy of zone.js can run on a page. Building the element with `provideZonelessChangeDetection()` and no zone.js polyfill avoids conflicts with the host's zone.js.

**Q: What does `CUSTOM_ELEMENTS_SCHEMA` do in the host component?**
A: It tells the Angular compiler to accept unknown dash-case tags like `<exercise-form>` and their properties, because they're defined at runtime by another bundle.

**Q: Why deploy each micro frontend release to a versioned URL?**
A: So the host can pin a known version, upgrade deliberately, and roll back with a one-line change, instead of being broken by another team's deploy or stuck with stale cached files.

## Exercises

**Easy**
Convert a standalone `RatingStars` component (`value = input(0)`, `rated = output<number>()`) into a custom element named `rating-stars`. Build it zoneless with `outputHashing: none`, and use it from a plain `index.html` file. Listen for the `rated` event with `addEventListener` and log `event.detail`.

**Medium**
Load `rating-stars` into an Angular host page with a `loadModuleScript()` utility, `customElements.whenDefined()`, and `CUSTOM_ELEMENTS_SCHEMA`. Show a loading message while it loads and an error message if the script URL is wrong. Bind the `value` property and store each rating the element emits in a signal.

**Challenging**
Write a contract file for `rating-stars` and make both sides use it. Then ship version `2.0.0` with a renamed event (`ratingChanged` instead of `rated`), deployed side by side with `1.x` under versioned URLs. Migrate the host from 1.x to 2.0.0 in a single commit, and write a short note explaining which parts of the change were breaking and why the side-by-side deploy prevented an outage.

## Further Reading

- [Angular: Angular elements overview](https://angular.dev/guide/elements)
- [Angular: Zoneless change detection](https://angular.dev/guide/zoneless)
- [Angular: View encapsulation](https://angular.dev/guide/components/styling#style-scoping)
- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [MDN: Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [Cam Jackson: Micro Frontends (martinfowler.com)](https://martinfowler.com/articles/micro-frontends.html)
- [Native Federation for Angular](https://www.npmjs.com/package/@angular-architects/native-federation)

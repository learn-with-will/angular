# Course review: Angular Learning Portal vs. the two source books

Reviewed 2026-10-25. Scope: the 33 lessons learners see (`public/content/**/lesson-*.md`) and their quizzes (`public/quizzes/*.json`). The authoring copies in `data/` were not reviewed separately.

**How sources are cited**

| Short name | Book | How pages are cited |
|---|---|---|
| **MA** | Armen Vardanyan, *Modern Angular* (Manning, 2025). Covers Angular v12–v18 with notes on v19. | Section number + PDF page (the PDF has no printed page numbers) |
| **PA16** | Adam Freeman, *Pro Angular 16*, 6th ed. (Manning, 2024). Covers Angular 16 (NgModule era, signals in developer preview). | Section number + printed page |

Two other labels appear in the tables:

- **Own knowledge**: not in either book. My own understanding of current Angular, labelled every time it is used.
- **Verified in source**: checked against the Angular 20.3.25 packages installed in this repo's `node_modules` (compiler, core, forms, router).
- **Web**: Angular 21/22 release coverage found by search (links at the end).

Both books predate the version the course targets (it says "Angular 20+" in places and "Angular 22 is current" in others). Many course claims are therefore newer than the books. Those are marked NOT COVERED and judged on their own merits, not marked wrong.

---

## Step 1: Map of both sides

### 1a. Course structure

Every lesson uses the same sections: Learning Objectives → Why This Concept Exists → Concept Explanation → Key Terminology → Syntax Overview → Real World Analogy → Examples (Basic / Real-world / Best-practice) → Common Mistakes → Best Practices → Summary → Flash Cards → Exercises (Easy / Medium / Challenging) → Further Reading. Each lesson has a quiz with 3–6 questions.

| Module | # (order) | Lesson file | Title | Min |
|---|---|---|---|---|
| Beginner | 1 | lesson-01 | Introduction & the Angular CLI | 35 |
| | 2 | lesson-02 | Components & Pages | 45 |
| | 3 | lesson-07 | Templating Syntax: Interpolation & Binding | 35 |
| | 4 | lesson-08 | Introduction to Signals | 30 |
| | 5 | lesson-03 | Data Binding & Signals (3 KB stub) | 25 |
| | 6 | lesson-09 | Control Flow: @if, @for, @switch | 30 |
| | 7 | lesson-10 | Event Binding & User Interactions | 40 |
| | 8 | lesson-11 | Basic Pipes | 25 |
| | 9 | lesson-12 | Template-Driven Forms | 40 |
| Intermediate | 10 | lesson-13 | Component Communication | 40 |
| | 11 | lesson-14 | Lifecycle Hooks | 45 |
| | 12 | lesson-15 | Content Projection | 45 |
| | 13 | lesson-04 | Services & Dependency Injection | 45 |
| | 14 | lesson-16 | Computed Signals & Effects | 45 |
| | 15 | lesson-17 | Observables & RxJS Basics | 45 |
| | 16 | lesson-18 | Reactive Forms & Validation | 50 |
| | 17 | lesson-19 | Route Parameters & Dynamic Routes | 45 |
| | 18 | lesson-30 | TypeScript Patterns | 40 |
| | 19 | lesson-31 | Smart & Presentational Components | 45 |
| | 20 | lesson-32 | Feature-Based Architecture & Lazy Boundaries | 45 |
| Advanced | 21 | lesson-20 | OnPush Change Detection | 55 |
| | 22 | lesson-21 | Web Workers & Pure Pipes | 55 |
| | 23 | lesson-22 | Advanced RxJS Operators | 70 |
| | 24 | lesson-23 | Guards & Resolvers | 55 |
| | 25 | lesson-24 | Custom & Async Validators | 55 |
| | 26 | lesson-25 | ControlValueAccessor | 75 |
| | 27 | lesson-26 | CDK Virtual Scroll & Drag/Drop | 75 |
| | 28 | lesson-27 | NgRx & Component Store | 90 |
| | 29 | lesson-28 | Unit Testing: Jest & Harnesses | 65 |
| | 30 | lesson-29 | E2E Testing with Cypress | 55 |
| | 31 | lesson-33 | Singleton Services & Facade | 55 |
| | 32 | lesson-34 | HTTP Interceptors | 55 |
| | 33 | lesson-35 | Micro Frontends with Angular Elements | 60 |

### 1b. Key concepts in the sources and where they are

| Topic | MA | PA16 |
|---|---|---|
| CLI, project structure, `bootstrapApplication`, `app.config.ts` | §1.3.1–1.3.3, PDF p.32–37 | ch9 p.215–249 (ng serve on 4200 p.226, `ng add` p.224, production build §9.5 p.240) |
| Standalone components, lazy `loadComponent`/`loadChildren`, route providers | ch2 §2.3–2.4, PDF p.59–78 | §27.3 p.752 (feature modules) |
| NgModules and migrating to standalone (`ng generate @angular/core:standalone`) | §2.1–2.2, §2.5, PDF p.49–85 (schematic §2.5.3 p.81) | ch19 p.540–567 |
| Dependency injection, `inject()`, injection context, lookup modifiers | ch3 §3.1–3.2, §3.4.1 PDF p.86–117 | ch18 p.511–539 |
| Functional guards, resolvers, interceptors | §3.3.1–3.3.4, PDF p.107–116 | §26.2 p.726–746 (class-based + `mapToCanActivate`) |
| Required inputs, input transforms, route-param input binding, dynamic-component inputs | §4.1.1–4.1.4, PDF p.123–140 | — |
| Host directives | §4.2, PDF p.140–145 | — |
| Attribute & structural directives, `@HostBinding`/`@HostListener` | — | ch14 p.369–397, ch15 p.399–437 |
| Typed reactive forms, pitfalls, form `events` (v18) | §4.3.1–4.3.5, PDF p.143–152 | ch21–22 p.581–646 (custom validator directive §22.3.1 p.633, cross-field §22.3.2 p.637, async §22.3.3 p.643) |
| Template-driven forms, validation attributes, CSS state classes | — | §13.4 p.347–367 (Table 13.4 p.350, classes p.352) |
| `NgOptimizedImage` | §4.4, PDF p.152–156 | — |
| Fetch-based HttpClient (`withFetch`) | §4.5.2, PDF p.157 | — |
| HttpClient basics (REST verbs, headers, errors, CORS) | — | ch23 p.647–668 |
| RxJS, unsubscribing, `DestroyRef`, `takeUntilDestroyed`, custom operators | ch5, PDF p.161–190 (`takeUntilDestroyed` §5.3.4 p.172–175, custom operators §5.4 p.176–190) | §10.5 p.269 |
| Signals, `computed`, `effect`, effect rules | ch6, PDF p.192–228 (effects §6.5 p.215–222) | §10.4 p.260–268 (dev preview, `mutate()`) |
| RxJS ↔ signals interop (`toSignal`, `toObservable`, `requireSync`) | §6.6 PDF p.222–228, §7.1.4 p.236, §7.3.4 p.254 | — |
| Signal equality, untracked, cleanup, signal state services | ch7 §7.1–7.3, PDF p.229–256 | — |
| Data bindings (property, attribute, class, style, interpolation) | — | ch11 p.275–298 |
| Built-in directives, one-way binding rules | §10.1 (new control flow) | ch12 p.299–328 |
| Event binding, template reference variables, two-way binding | — | ch13 §13.2–13.3 p.332–346 |
| Components, styles, view/content queries, `ng-content` | §10.3.4 PDF p.388 (signal queries) | ch16 p.438–464 (`ng-content` p.455–457), §15.4 p.428 (`@ContentChild`, `descendants`) |
| Pipes (pure/impure, built-ins, locales) | — | ch17 p.465–510 |
| Routing: params, wildcards, child routes | — | ch24–25 p.669–724 |
| Unit testing | ch8, PDF p.265–309 (Jest choice §8.2 p.270–274) | ch29 p.807–833 (Jasmine/Karma) |
| SSR, hydration, HTTP transfer cache, prerendering, `afterNextRender` | ch9 §9.1–9.3, PDF p.310–341 (`afterNextRender` §9.2.3 p.330) | §27.4–27.5 p.759–779, §8.2 p.192 |
| Build (esbuild/Vite), environments, deployment | §9.4, PDF p.342–349 | §9.5 p.240, ch8 p.192–213 |
| New control flow and migration | §10.1, PDF p.350–363 | — |
| Deferrable views (`@defer`) | §10.2, PDF p.364–375 | — |
| Change detection, OnPush, local CD, zoneless scheduler | §10.3, PDF p.376–395 | §10.3 p.256 |
| Angular Material / component libraries | — | ch28 p.780–806 |

Not in either book (the course goes beyond the sources): Web Workers, CDK virtual scroll and drag/drop, NgRx, component harnesses, Cypress, facade pattern, `HttpContextToken`, Angular Elements and micro frontends, Signal Forms, `linkedSignal`, `resource`/`httpResource`, `afterRenderEffect`.

---

## A. Summary

**Overall accuracy: high on concepts, uneven on code and versions.** About 470 substantive claims match the books (counts per module are below). The problems fall into three groups:

1. **Wrong mental models (7).** Each has been confirmed in the books or in the Angular 20.3 source:
   - L04: a component-level token override seems to reach a root service. It doesn't.
   - L15: fallback content supposedly appears when an `@if` hides projected content. It doesn't.
   - L16: effects supposedly run "immediately". They are asynchronous.
   - L17: `takeUntilDestroyed()` is called with no argument in `ngOnInit`. This throws.
   - L23: guard order lists `canActivate` before `canDeactivate`. It's the other way round.
   - L25: `NgControl` self-injection is combined with an `NG_VALIDATORS` provider. This causes a circular-DI error.
   - L26: "keyboard drag-and-drop for free". This is likely wrong (own knowledge).
2. **Code that doesn't compile or doesn't behave as described (≈12).**
   - Missing `RouterLink` (L02) and `CurrencyPipe` (L13) imports.
   - Wrong `viewChild` type (L13).
   - `bootstrapApplication` imported from the wrong package (L20).
   - `[] as const` type error (L27).
   - Several examples update plain fields from timers or subscriptions (L14, L17, L22, L29). Under the zoneless default that L01 teaches, those updates never render.
3. **Version claims that are wrong or already stale, measured against the course's own "Angular 22 is current" (≈15).**
   - Vitest became the default in v21, not v22.
   - `OnPush` has been the default since v22, so L20 still teaches `Default` as the default.
   - "Signals stable since v20" is wrong: `signal`/`computed` were stable in v17.
   - Signal Forms and `httpResource` are stable in v22. L08 promises a `resource()` lesson that doesn't exist.
   - Date-stamped "as of June 2026" lines.

**The 5 most important changes**

1. **Fix the seven wrong-model items and their quiz questions** (C14, C22, C23, C27, C35, C43, C46). Learners are currently graded on wrong answers in quizzes 16, 23 and 24.
2. **Make every example zoneless-safe** (C21): store state that changes asynchronously in signals, and add one short "zoneless rule" callout.
3. **Pick one Angular baseline and update version claims** (C01, C10, C11, C38, C55, C59). Remove date stamps and say "since vXX" instead.
4. **Add the biggest topics the books cover and the course doesn't:** custom directives (no `@Directive` appears anywhere in the course), `@defer`, SSR/hydration/prerendering, and HttpClient fundamentals (G1–G4).
5. **Clean up structure:**
   - Remove L03, which duplicates L07 and L08.
   - Deduplicate L18/L24 and L17/L22.
   - Use one test runner across all code samples.
   - Drop `standalone: true` (written 60 times in 13 lessons, although L01/L02 promise "you will not see it").

**Conflicts between the two books (and with the course)**

| Topic | MA says | PA16 says | Course says | Recommendation |
|---|---|---|---|---|
| `signal.mutate()` | Never uses it | Uses `mutate()` (p.122, p.165) | "There is no `.mutate()`" (L08) | **Course.** `mutate()` was removed in v17 (own knowledge). Add a one-line note for readers of PA16. |
| Writing signals inside `effect()` | Throws NG0600 unless `allowSignalWrites: true` (§6.5.2, PDF p.220) | — | Writes allowed; shown as an anti-pattern (L16) | **Course.** Since v19, writes are allowed and `allowSignalWrites` is deprecated (own knowledge). Add a version note (C24). |
| Conditional `<ng-content>` | — | `<ng-content *ngIf="...">` used as a technique (§16.2 p.456) | Never wrap `<ng-content>` in `@if` (L15) | **Course.** The projected content is still created either way (own knowledge; angular.dev content-projection guide). |
| Host events | — | `@HostBinding`/`@HostListener` (§14.5 p.389–391) | Prefer `host: {}` metadata (L10) | **Course** (current style guide, own knowledge). Mention the decorators because learners will meet them. |
| Route guards | Functional `CanActivateFn` (§3.3.1, PDF p.107–109) | Class guards + `mapToCanActivate` (p.745–746) | Functional (L23) | **MA/course.** |
| Unit-test runner | Jest via the CLI's experimental builder; "Karma is deprecated" (§8.2, PDF p.270–274) | Jasmine/Karma (ch29) | L01 says Vitest; L28 Jest; L33/L34 use Jasmine APIs | **Vitest** (CLI default since v21, web). Needs your decision, see D2. |
| Zoneless API name | `provideExperimentalZonelessChangeDetection()` (§10.3.5, PDF p.393) | — | `provideZonelessChangeDetection()` (L20) | **Course** (stable name since v20.2, own knowledge). |

**Verified claims per module** (matching the books; details are not repeated below)

- **Beginner: 143.** L01 14 · L02 16 · L07 15 · L08 18 · L03 8 · L09 20 · L10 14 · L11 18 · L12 20
- **Intermediate: 193.** L13 18 · L14 17 · L15 16 · L04 22 · L16 20 · L17 22 · L18 24 · L19 20 · L30 10 · L31 10 · L32 14
- **Advanced: 133.** L20 22 · L21 8 · L22 20 · L23 20 · L24 18 · L25 3 · L28 14 · L33 14 · L34 14. L26, L27, L29 and L35 are entirely outside both books. Judged on own knowledge, their content is sound apart from the items listed below.

---

## B. Change list

Priority reflects impact on learners: **High** = teaches something wrong or breaks a graded answer; **Med** = broken/misleading example or important gap; **Low** = polish. Longer replacement text is in the **Drop-in** section after the table (D-numbers).

| # | Location | Type | Current content | Proposed content | Reason | Source | Priority |
|---|---|---|---|---|---|---|---|
| C01 | L01 "What modern Angular generates" (lines 67–82), Summary (391–392) | Fix | "As of **Angular 22** (the current stable release as of June 2026)… Vitest… replaced Karma/Jasmine as the default in Angular 22." "Standalone became the default in Angular 19." | **D1** | Vitest and zoneless became defaults in **v21**. New CLI projects have been standalone since v17; v19 only made `standalone: true` implicit. Date stamps go stale (Angular 23 is due Nov 2026). | Web: Angular v21 announcement; MA §1.3.2, PDF p.34 (v17+ standalone by default) | High |
| C02 | L01 Syntax/Example 3 | Add | — | Tip: "`ng new my-app --defaults` skips the questions and accepts the defaults; `--inline-template` and `--minimal` give a lighter project for experiments. New projects don't include `environment.ts` files; run `ng generate environments` when you need them." | Useful CLI options missing; environments removed from scaffolds since v15. | MA §1.3.1 Table 1.2, PDF p.33; §1.3.2 p.34–35 | Low |
| C03 | L02 Example 3, `ProductDetailPage` (lines 376–390) | Fix | `imports: [], // RouterLink omitted here for brevity; add it to use routerLink` | `imports: [RouterLink],` and add `import { RouterLink } from '@angular/router';` | The "Back to list" link silently does nothing without the directive. | MA §2.3.1, PDF p.60 (standalone components import what they use) | Med |
| C04 | L02 line 462; L19 line 398 | Clarify | "Without it, the input stays `undefined`." | "Without it, nothing is bound: an optional `input()` stays `undefined`, and reading an `input.required()` throws error NG0950 (*input is required but no value is available yet*)." | `input.required()` throws rather than returning undefined. | Own knowledge | Low |
| C05 | L02 line 481 | Remove | "Angular 22 introduces *selectorless components*…" | Delete the box, or: "The Angular team is exploring *selectorless* components (using a component by its class name instead of a selector). It isn't something you need yet." | Could not confirm it shipped in v22. The v22 feature summaries I found don't list it. | Web (v22 coverage); see D5 | Low |
| C06 | L03 (whole lesson) | Remove | 3 KB stub repeating L07 (bindings) and L08 (signals) | Delete the lesson and its quiz. Move its 3 exercises to L08 → Exercises, and quiz items q3 (match-pair) → quiz-07 and q4 (ordering) → quiz-08. | 100% redundant. Its front-matter `order: 3` also contradicts the manifest (5). | — | Med |
| C07 | L07 line 88 comment; Common Mistakes line 296; quiz-07 q3 explanation | Fix | "ARIA, SVG, colspan, etc. have no matching DOM property" / "`[colspan]`, `[aria-label]`… plain property binding silently fails." | **D2** | `[colspan]` is a **compile error** (NG8002), not a silent failure. Since Angular 20 the compiler maps `aria-*` to ARIA properties, so `[aria-label]` works. | PA16 §11.3.3 p.286; verified in source (Angular 20.3 compiler `_ATTR_TO_PROP`, DOM schema `td: #colSpan`) | Med |
| C08 | L07 line 293; Flash card line 330; quiz-07 q2 explanation | Clarify | "sets the attribute to the *string* `"false"`" | "`disabled="{{ isSaving() }}"` is turned into a **property** binding with a *string* value. `disabled` is set to `"false"`, a non-empty string that counts as true, so the button stays disabled. Use `[disabled]="isSaving()"` to bind a real boolean." | The outcome is right; the mechanism is wrong. | PA16 §11.3.2 p.285 (interpolation is a property binding) | Low |
| C09 | L07 line 294; L08 line 349 | Clarify | "`{{ count }}` renders the signal *function* (something like `() => ...`)" | "`{{ count }}` renders the signal itself (text like `[Signal: 0]`) instead of its value, and the compiler warns that the signal wasn't called. Read it with `count()`." | Signals print as `[Signal: value]`; extended diagnostics flag it. | Own knowledge | Low |
| C10 | L08 line 34 | Fix | "The Signals API has been stable since Angular 20… (the current stable release is Angular 22)." | "`signal()` and `computed()` have been stable since Angular 17. `effect()` and the RxJS interop helpers (`toSignal`, `toObservable`) became stable in Angular 20. Signals are the recommended way to manage reactive state in modern Angular." | Core signals were stable two majors earlier. | MA §7.4, PDF p.261 ("signals themselves are only marked stable starting from v17"); own knowledge for v20 | Med |
| C11 | L08 line 32, line 145, Best Practices line 363 | Fix | "zoneless… the default for new projects in Angular 20+ together with `OnPush`" / "in Angular 20+ new components use `OnPush`" | Line 32 ending: "…the foundation for **zoneless** Angular (running without Zone.js), the default for new projects since Angular 21." Line 363: "**Lean into `OnPush` and zoneless.** New apps are zoneless by default since Angular 21, and components use `OnPush` by default since Angular 22. Signals support both naturally." | Wrong version for both defaults. | Web: v21 announcement (zoneless), v22 coverage (OnPush default) | Med |
| C12 | L08 code under "3. Side effects" (lines 89–98), Syntax Overview #5 (lines 167–170), Example 1 comment (line 214) | Fix | `// Logs "Count changed to: 0" immediately, then again on every change.` / "Effect runs once now" | **D3** | Effects are always asynchronous; several synchronous changes produce one run. The top-level snippets would also throw NG0203 outside an injection context. | MA §6.5.1, PDF p.217; §6.5.2 p.218 | Med |
| C13 | L08 line 134 ("…async data with `resource()`/`httpResource()` in later lessons") | Fix / Add | Promise of a later lesson | Either delete the promise, or add **D28** to L17 (or a new lesson). | No later lesson covers it. Per v22 coverage, `resource`/`httpResource` are now stable. | Web (v22); own knowledge (not in either book) | Med |
| C14 | L16 line 100; Summary line 435; Flash card line 450; **quiz-16 q2** | Fix | "Effects **always run at least once**, immediately after being created." / quiz answer "At least once, immediately" | **D12** | Contradicts line 102 ("run asynchronously") and MA. Learners are graded on the wrong answer. | MA §6.5.1, PDF p.217 ("signal effects are always asynchronous") | High |
| C15 | L09 Common Mistakes line 291 | Fix | "To share content across values, use consecutive `@case` blocks." | **D4a** | Each `@case` is its own block. An empty `@case` renders nothing; there is no grouping or fall-through. | MA §10.1.3, PDF p.362; verified in source (Angular 20.3 compiler `createSwitchBlock`) | Med |
| C16 | L09 tip line 283 (`@default never;`) | Clarify | Presented without a version | Add: "(This needs a recent Angular version. Angular 20's compiler rejects parameters on `@default`, so check your version before using it.)" | Not available in v20.3. | Verified in source (Angular 20.3 compiler: "@default block cannot have parameters") | Low |
| C17 | L09 Common Mistakes (new bullet) | Add | — | **D4b** | Migrating `NgSwitch` changes loose equality to strict; the schematic has limits. | MA §10.1.4, PDF p.362–363 | Med |
| C18 | L10 Common Mistakes line 254 | Fix | "(Passing a bare reference is only correct in rare cases like `(click)="someSignal.set(true)"` patterns…)" | "**Forgetting the parentheses on the method call.** `(click)="save"` only *names* the method; it never calls it, so nothing happens. Write the call, `(click)="save()"`, or a full statement such as `(click)="isOpen.set(true)"`." | The parenthetical contradicts itself: `set(true)` is a call. | Own knowledge | Low |
| C19 | L10 (new subsection after Example 2) + objectives | Add | — | **D5** (template reference variables) | Used in L12 (`#f="ngForm"`) but never taught. | PA16 §13.2.3 p.340–342 | Med |
| C20 | L11 Example 2 explanation line 185 | Fix | "…between 2 and 4… actually exactly 2 fraction digits (`min`-`max` both 2)." | "`currency:'USD':'symbol':'1.2-2'` shows `$129.99`. The arguments are the currency code (`USD`), the display (`symbol`, so `$`), and the digit format `1.2-2`: at least **1** integer digit and between **2** and **2** fraction digits (`minIntegerDigits.minFractionDigits-maxFractionDigits`)." | Leftover self-correction in published text. | PA16 §17.4.1 p.481 | Low |
| C21 | L14 Ex 1 (`currentTime`) and Ex 2 (`user`); L17 Ex 1 (`count`) and Ex 3 (`order`); L22 Ex 3 (`isSaving`, `errorMessage`); L29 Ex 2 (`_errorMessage`) | Fix | Plain fields assigned inside `setInterval`, `subscribe`, `tap` or `catchError` | **D8** (signal versions + one callout) | L01 tells learners that new apps are zoneless. Zoneless Angular refreshes the view only for signals read in the template, template events, `async` pipe/`markForCheck`, and `setInput`, so these screens never update. L29's own E2E test ("shows an error message") would fail. | MA §10.3.5, PDF p.392–393 | High |
| C22 | L15 Example 2 (lines 355–365) + explanation (line 377) | Fix | "If `canDelete()` is false, nothing is projected into [modal-footer], so the modal's fallback 'Close' button is shown automatically." | **D9** | Fallback is decided once, when the slot is created. The `@if` block counts as projected content even while false, so the footer ends up **empty**. | Verified in source (Angular 20.3 core `ɵɵprojection`: `isEmpty` computed at creation from static slot assignment) | High |
| C23 | L04 Example 3 (lines 427–448) + Challenging exercise (line 572) | Fix | `BetaPanelComponent` overrides `FEATURE_FLAGS` in its providers and reads it through the root `ThemeService`, expecting `true`. The exercise expects a root `ApiService` to see a component-level override. | **D10** | A root service resolves its dependencies from the root injector, so the override is invisible and the page shows `false`. This is the classic DI trap, taught as best practice. | MA §3.4.1, PDF p.116 (lookup starts where the dependency is requested and walks up); own knowledge | High |
| C24 | L16 anti-pattern block (lines 372–383) | Clarify | (no version note) | Add after the block: "On Angular 17–18 this code doesn't just misbehave: writing a signal inside `effect()` throws NG0600 unless you pass `{ allowSignalWrites: true }`. Since Angular 19 the write is allowed, but it is still an anti-pattern." | Learners reading MA will hit the older rule. | MA §6.5.2, PDF p.220; own knowledge (v19 change) | Low |
| C25 | L04 Syntax Overview (after item 6) | Add | — | **D11** (lookup modifiers) | `optional`/`self`/`skipSelf`/`host` are core DI tools, absent from the course. | MA §3.4.1, PDF p.116–117 | Med |
| C26 | L13 Example 2, `ProductCardComponent` | Fix | Template uses `\| currency`; component has no `imports` | Add `import { CurrencyPipe } from '@angular/common';` and `imports: [CurrencyPipe],` | Compile error NG8004 ("No pipe found with name 'currency'"). L11 itself warns about this. | PA16 ch17; own knowledge | Med |
| C27 | L17 Example 3 (lines 302–319) + explanation (line 324) | Fix | `takeUntilDestroyed()` with no argument inside `ngOnInit`, "as shown, it correctly picks up the DestroyRef" | **D13** | `ngOnInit` is not an injection context, so this throws NG0203. L14 (lines 274–276) states the rule correctly; L17 contradicts it. | MA §5.3.4, PDF p.174–175 + Listing 5.8; verified in source (`takeUntilDestroyed` asserts injection context when no DestroyRef is passed) | High |
| C28 | L13 Syntax Overview line 95 | Fix | `formRef = viewChild<HTMLFormElement>('form');` | `formRef = viewChild<ElementRef<HTMLFormElement>>('form'); // read the element with this.formRef()?.nativeElement` (and import `ElementRef`) | Querying a template reference on an element returns an `ElementRef`, so the stated type is wrong. | MA §10.3.4, PDF p.388 (`viewChild<ElementRef<HTMLDivElement>>('container')`) | Low |
| C29 | L14 line 61 and Summary line 317 | Fix | "**'Check' hooks run repeatedly.** `ngOnChanges`, `ngDoCheck`, `ngAfterContentChecked`, and `ngAfterViewChecked` run on every change detection cycle" | "**'Check' hooks run repeatedly.** `ngDoCheck`, `ngAfterContentChecked`, and `ngAfterViewChecked` run on every change detection cycle. `ngOnChanges` can also run many times, but only when a bound input receives a new value. Keep all four lightweight." | Contradicts the lesson's own table (line 49). | PA16 Table p.381 ("called when the value of an input property has changed"), p.383 | Med |
| C30 | L14 lines 69, 295, 329; quiz-14 q1 explanation | Clarify | "`ngAfterViewInit` — the only safe place to read `@ViewChild`… in `ngOnInit` it is `undefined`" | Append: "(Exception: a query marked `{ static: true }` that isn't inside `@if`/`@for` is already available in `ngOnInit`. The signal-based `viewChild()` simply returns `undefined` until the element exists.)" | Overstated rule. | Own knowledge | Low |
| C31 | L14 (new subsection after Example 3) + objectives | Add | — | **D7** (`afterNextRender` / `afterEveryRender`) | The modern, SSR-safe way to touch the DOM after rendering. Missing. | MA §9.2.3, PDF p.330–331 (names `afterRender`; renamed `afterEveryRender` in v20, own knowledge) | Med |
| C32 | L15 Common Mistakes #3 | Clarify | — | Add: "Older material, such as *Pro Angular 16*, shows `<ng-content *ngIf="show">`. That hides the content, but the projected components are still created and keep running." | Document conflict. | PA16 §16.2 p.456 vs own knowledge | Low |
| C33 | L15 Common Mistakes (new #8) | Add | — | "**Expecting content queries to search nested elements.** `contentChildren(TabComponent)` only finds *direct* children of the projected content. Use `contentChildren(TabComponent, { descendants: true })` if tabs can be wrapped in other elements." | The `descendants` option is not mentioned. | PA16 §15.4 p.430, p.433 | Low |
| C34 | L17 (new subsection before Common Mistakes) | Add | — | **D14** (bridging Observables and signals) | `toSignal`/`toObservable` options and lifetimes are used in L19/L31 but never taught. | MA §6.6.1–6.6.2, PDF p.222–228; §7.3.4 p.254 | Med |
| C35 | L23 navigation lifecycle (lines 41–47), Summary line 498, **quiz-23 q6** | Fix | Order: canMatch → canActivateChild/canActivate → canDeactivate → resolve | **D19** | The router runs `canDeactivate` checks **before** `canActivate` checks. Learners are graded on the wrong order. | Verified in source (Angular 20.3 router `checkGuards`: `runCanDeactivateChecks` then `runCanActivateChecks`) | High |
| C36 | L23 line 44 | Clarify | "if one guard blocks or redirects, the remaining guards… don't need to run" | Included in **D19** step 3: "All guards in one array start together; the router uses the first result, in the order they're listed, that isn't `true`." | Guards in one array run concurrently. | Verified in source (`prioritizedGuardValue` uses `combineLatest`) | Low |
| C37 | L18 Best Practices line 423 | Fix | "…it's more flexible or you can still use constructor injection; both are valid, but `inject()` is the modern idiom…" | "**Inject dependencies with `inject()`**, for example `private fb = inject(FormBuilder)`. Constructor injection still works, but `inject()` is the modern idiom." | Garbled sentence. | — | Low |
| C38 | L12 line 38 and Best Practices line 324; L24 Further Reading line 462; L25 lines 102–106 and 619 | Fix (if baseline is v22) | "Angular is also introducing a newer **Signal Forms** API…" / "experimental… once it stabilizes" | "Angular also has **Signal Forms** (`@angular/forms/signals`), a signal-based forms API. It was experimental in Angular 21 and is stable since Angular 22. Template-driven and reactive forms remain fully supported." | Stale relative to the course's own v22 claim. | Web (v22 coverage) | Low |
| C39 | L18 Best Practices line 427 | Clarify | "Some users submit via Enter key even when a button is disabled" | "Keep the guard in `onSubmit()` anyway: other code can call it, the button state can lag behind async validators, and `[disabled]` is a UX hint, not a guarantee." | Browsers block implicit (Enter) submission when the default submit button is disabled. | Own knowledge (HTML implicit-submission rules) | Low |
| C40 | L18 (new short section after Example 3) | Add | — | **D27** (unified form `events`) | A v18 API that replaces juggling `valueChanges`, `statusChanges` and touched-state tracking. | MA §4.3.5, PDF p.151–152 | Low |
| C41 | L19 Example 3 (lines 356–388) | Fix | `effect()` sets `invalid` signal and navigates | **D15** | Contradicts the course's own L16 rule (derive with `computed`). It would also throw NG0600 on v17–18. | MA §6.5.2, PDF p.220–221; L16 | Med |
| C42 | L19 (new subsection before Common Mistakes) | Add | — | **D16** (child routes and nested outlet) | The Challenging exercise asks for nested routes that the lesson never teaches. Parent params don't flow to child inputs by default. | PA16 §25.4 p.717–724; own knowledge (`paramsInheritanceStrategy`) | Med |
| C43 | L25 Example 3 (lines 472–512), Best Practices line 615, Challenging exercise line 661 | Fix | Component injects `NgControl` (`self: true`) **and** provides `NG_VALIDATORS` with `useExisting` pointing to itself | **D22** | `FormControlName` injects `NG_VALIDATORS` from the same element, which points back to the component while the component is waiting for `NgControl`. Result: circular-dependency error NG0200 at runtime. | Verified in source (Angular 20.3 `FormControlName` factory deps: `NG_VALIDATORS {self:true}`); own knowledge | High |
| C44 | L20 lines 30, 40–42, 72; Best Practices line 344 | Fix (if baseline is v22) | "By default, every component uses `ChangeDetectionStrategy.Default`…" | **D18** | Since v22, `OnPush` is the default and `Default` is renamed `Eager` (deprecated). The lesson contradicts the course's "v22 is current". | Web (v22 coverage); MA §10.3.3 describes the pre-v22 default | High |
| C45 | L20 Syntax Overview line 122 | Fix | `import { bootstrapApplication, provideZonelessChangeDetection } from '@angular/core';` | `import { provideZonelessChangeDetection } from '@angular/core';` and `import { bootstrapApplication } from '@angular/platform-browser';` | Compile error: `bootstrapApplication` isn't exported from core. | MA §1.3.3 Listing 1.4, PDF p.37 | Med |
| C46 | L26 Best-practice bullet line 432, Best Practices line 455, Summary line 469 | Fix | "**Accessibility for free:** `cdkDrag` items are focusable and keyboard-operable by default — … Space to pick up, arrow keys to move…" | **D23** | Own knowledge: CDK drag-and-drop has no built-in keyboard dragging, and no source I could find documents it. Teaching "free" keyboard support leads to inaccessible UIs. **Verify against the current CDK docs before publishing.** | Own knowledge; web search found no documentation of keyboard support | High |
| C47 | L21 naming note line 16 | Clarify | "…drop the `.component`/`.pipe`/`.service` suffixes…" | "…drop the `.component` and `.service` suffixes (e.g. `user-profile.ts` / `class UserProfile`). Pipes, guards and interceptors use a hyphen instead of a dot, e.g. `expensive-format-pipe.ts` with `class ExpensiveFormatPipe`, which is what this lesson uses." | The lesson's own files keep `-pipe`/`Pipe`. | Own knowledge (v20 style guide) | Low |
| C48 | L22 table line 58 | Clarify | "`mergeMap` (`flatMap`)" | "`mergeMap`" | The `flatMap` alias is deprecated in RxJS 7 and removed in RxJS 8. | Own knowledge | Low |
| C49 | L22 (new optional section) | Add | — | "Writing your own operator": `function filterNil<T>() { return (source: Observable<T>) => source.pipe(filter((v): v is NonNullable<T> => v != null)); }` plus a short explanation that an operator is a function from one Observable to another. | A standard advanced RxJS skill. | MA §5.4.1–5.4.3, PDF p.176–190 | Low |
| C50 | L22 Example 1 (typeahead) | Remove / Replace | Typeahead with `debounceTime`/`distinctUntilChanged`/`switchMap` | Point back to L17 Example 2 and replace it with a `mergeMap(upload, 3)` example (parallel uploads with a concurrency limit). | Same example as L17 Example 2; the flattening-operator advice is also repeated from L17 Common Mistakes #3. | — | Low |
| C51 | L24 Example 2 (lines 245–260) + explanation (lines 294–295), Best Practices line 401, Flash card line 432, **quiz-24 q5** | Fix | `of(control.value).pipe(debounceTime(400), distinctUntilChanged(), switchMap(...), first(), catchError(...))`, "switchMap guarantees that only the response for the latest value is used" | **D20** | Each validator call creates a new one-value stream, so `distinctUntilChanged` does nothing and `switchMap` has nothing to cancel. Stale requests are dropped because Angular unsubscribes from the previous validation. | Verified in source (Angular 20.3 forms `_cancelExistingSubscription` before `_runAsyncValidator`) | Med |
| C52 | L24 (new section) | Add | — | **D21** (validator directive for template-driven forms) | The course has no way to use a custom validator with `ngModel` (L12). | PA16 §22.3.1 p.633–636 | Med |
| C53 | L18 Example 3 async part and L24 Examples 2–3 | Remove / Trim | Both lessons teach `ValidatorFn`, the passwords-match group validator, and the async "username taken" validator with `pending` and `updateOn: 'blur'` | L18: keep sync and cross-field validators; cut the async validator to one paragraph ("Async validators are covered in depth in *Custom & Asynchronous Validators*"). L24: replace Example 3's password-match with a `FormArray`-level validator (e.g. "at least one item, at most five, no duplicates"). | Duplicate content across intermediate and advanced. | PA16 §22.3.2–22.3.3 | Med |
| C54 | L25 line 82, Common Mistakes line 598, Flash card line 641, quiz-25 q4 | Clarify | "without `multi: true` you'd replace the list instead of adding to it" | "Without `multi: true`, the forms directive doesn't receive a *list* of accessors, and you get an error at runtime instead of a working control." | It errors; it doesn't silently replace. | Own knowledge | Low |
| C55 | L25 Common Mistakes line 599, Flash card line 637, quiz-25 q3 | Clarify | "Omitting `forwardRef`… throws a runtime error" | "Referring to the class inside its own decorator can fail depending on how the code is compiled. `forwardRef(() => MyComponent)` defers the reference and is the documented, always-safe form." | Overstated. With today's AOT output, omission often works. | MA §2.5.4, PDF p.83–84 (purpose of `forwardRef`); own knowledge | Low |
| C56 | L27 Example 3 lines 568–570 | Fix | `initialValue: { results: [] as const, loading: false, searchTerm: '' }` | `initialValue: { results: [] as Product[], loading: false, searchTerm: '' }` | `readonly []` isn't assignable to `Product[]`, so TS2322 (`toSignal` requires the initial value to fit the stream's type). | Own knowledge | Low |
| C57 | L27 objectives 4–5, Example 3, Best Practices | Trim / Replace (see D3) | 90-min lesson centred on ComponentStore, while the lesson says SignalStore is NgRx's recommended default for new local state | Keep Store + Effects (Examples 1–2). Replace Example 3 with a short `signalStore` (`withState`, `withComputed`, `withMethods`, `rxMethod`) version of the same filter widget. Keep one paragraph on ComponentStore for existing code. Cut the duration to about 70 min. | Time spent doesn't match the lesson's own recommendation. Neither book covers NgRx. | Own knowledge | Med |
| C58 | L28 Common Mistakes line 543, Flash card line 581, quiz-28 q2 explanation | Fix | "Calling `detectChanges()` repeatedly… can trigger `ExpressionChangedAfterItHasBeenCheckedError`" | **D24** | Repeated `detectChanges()` calls don't cause NG0100. NG0100 comes from a value that changes during the dev-mode verification pass. | Own knowledge | Low |
| C59 | L28 tooling note line 32; L33 spec (`jasmine.createSpyObj`, `and.returnValue`); L34 spec (`toBeFalse()`) | Fix | Three runners across the course (Vitest in L01, Jest in L28, Jasmine in L33/L34); L28 says Jasmine APIs throw under Jest | Rewrite every spec for the runner chosen in D2. For Vitest: `vi.fn()`, `vi.spyOn()`, `mockReturnValue()`, `expect(x).toBe(false)`. | Snippets break when copied into the default (Vitest) project. Learners are told mixing APIs throws. | Web (v21: Vitest default; Jest support in the CLI ending); MA §8.2, PDF p.270–274 | Med |
| C60 | L33 Common Mistakes (new bullet) | Add | — | **D25** | A root-service subscription never ends. | MA §7.3.3, PDF p.251–252 | Low |
| C61 | L34 lines 230 and 437; L35 line 213 | Clarify (if baseline is v22) | `provideHttpClient(withFetch(), …)` | Add once in L34: "Since Angular 22, HttpClient uses the Fetch backend by default and `withFetch()` is deprecated. On Angular 20–21, keep `withFetch()`." | Stale relative to the v22 claim. | MA §4.5.2, PDF p.157 (`withFetch` introduced); web (v22 coverage) | Low |
| C62 | L20 (new section "Images") | Add | — | **D26** (`NgOptimizedImage`) | A performance feature with a full section in MA; absent from the course. | MA §4.4.1–4.4.3, PDF p.152–156 | Med |
| C63 | L32 Concept → "Keeping bundles small over time" | Add | One bullet on `@defer` | **D17** | `@defer` appears only in one L32 snippet. MA has a full section on triggers, prefetch and placeholder/loading/error blocks. | MA §10.2.1–10.2.3, PDF p.364–375 | High |
| C64 | Course-wide: `standalone: true` in code (60× in L13, L14, L15, L16, L17, L19, L20, L22, L24, L25, L26, L28, L29); `…Component` class suffixes in ~20 lessons | Fix | e.g. `standalone: true,` / `export class ProductCardComponent` | Delete `standalone: true,` lines. Optionally rename classes to the no-suffix convention taught in L01/L02. | L01/L02: "you will not see `standalone: true` written anywhere"; later lessons contradict this. | MA §2.3 (why); own knowledge (v19 default) | Low |
| C65 | Course-wide version wording (L01 line 67, L02 line 26, L08 line 34, L09 line 38) | Clarify | "the current stable release is Angular 22 (June 2026)" | Replace with feature-relative wording ("since Angular 21…"), plus one sentence in L01: "This course is written for Angular 20 and later. Notes call out changes in later versions." | Date stamps go stale; the portal itself runs Angular 20.3. | — | Med |
| C66 | Course-wide constructor injection in examples (L04 line 446, L14 line 211, L17 lines 151–156) | Fix | `constructor(public theme: ThemeService) {}` etc. | `protected readonly theme = inject(ThemeService);` | Contradicts the course's own "prefer `inject()`" advice. L17's field initializer only works because the CLI's tsconfig sets `useDefineForClassFields: false`. | MA §3.2.3, PDF p.102 ("Why we should always use inject") | Low |
| C67 | `course-manifest.json` vs front-matter | Fix | lesson-19 front-matter `order: 18` (manifest 17); lesson-03 `order: 3` (manifest 5) | Align front-matter with the manifest (or drop `order` from front-matter if the app reads only the manifest). | Metadata drift. | — | Low |

---

## Drop-in content

**D1 (C01): L01 "What modern Angular generates"**

```md
## What modern Angular generates

New projects created with a current Angular CLI use modern defaults you should know about from day one:

- **Standalone components.** New CLI projects have been standalone since Angular 17, and since Angular 19 `standalone: true` is implied, so you no longer write it. Components declare their own dependencies in an `imports` array.
- **Zoneless change detection.** Since Angular 21, new projects don't include `zone.js`. Angular schedules change detection from signals and template events instead.
- **`OnPush` by default.** Since Angular 22, components use `OnPush` change detection unless you choose otherwise. *(Keep this bullet only if the course's baseline is Angular 22.)*
- **A new file-naming convention.** Since Angular 20, generated files no longer add type suffixes like `.component` or `.service`. `ng generate component user` creates `user.ts` with a class named `User` (not `user.component.ts` / `UserComponent`).
- **Vitest as the default unit-test runner.** Since Angular 21, new projects run unit tests with Vitest instead of Karma/Jasmine. Existing Karma projects keep working.
```

Summary bullet: "Modern Angular defaults to **standalone components**, **zoneless change detection** (v21+), **no `.component`/`.service` file suffixes** (v20+), and **Vitest** as the test runner (v21+)."

**D2 (C07): L07 Common Mistakes, replacing the "Confusing attributes and properties" bullet**

```md
- **Binding to an attribute that has no DOM property.** `<td [colspan]="2">` doesn't fail silently. It's a compile error: *Can't bind to 'colspan' since it isn't a known property of 'td'* (the DOM property is called `colSpan`). Use attribute binding instead: `[attr.colspan]="2"`. ARIA attributes are a special case: since Angular 20 you can write `[aria-label]="label()"` directly, but `[attr.aria-label]` works in every version and is what you'll see in most code.
```

Also change the comment at line 88 to `<!-- colspan and most SVG attributes have no matching DOM property -->`, and the quiz-07 q3 explanation to: "colspan and most SVG attributes have no DOM property; binding to them directly is a compile error, so use [attr.*]."

**D3 (C12): L08 effect snippet**

```typescript
import { signal, effect } from '@angular/core';

const count = signal(0);

// Inside a constructor or a field initializer (an injection context):
effect(() => {
  console.log(`Count changed to: ${count()}`);
});
// Logs "Count changed to: 0" shortly after the effect is created
// (during Angular's next change detection), then again after each change.
// Several changes in a row are batched into a single run.
```

Example 1 comment, line 214: `// The effect runs once soon after creation, then again whenever count changes.`

**D4a (C15): L09 Common Mistakes**

```md
- **Expecting `@switch` fallthrough.** There is none, and matching uses strict `===`. Each `@case` has its own block, and an empty `@case` simply renders nothing. If several values need the same content, move that content into a small component or an `<ng-template>` and render it from each case.
```

**D4b (C17): L09 Common Mistakes, new bullet**

```md
- **Assuming the control-flow migration changes nothing.** `ng generate @angular/core:control-flow` turns `NgSwitch` (loose `==`) into `@switch` (strict `===`), so a case like `@case ('1')` no longer matches the number `1`. The schematic only rewrites templates (HTML files and inline templates), and where an `*ngFor` had no `trackBy` it picks a fallback `track` expression. Review every `@switch` and `track` after migrating.
```

**D5 (C19): L10, new subsection "Template reference variables"**

````md
## Reading an element directly: template reference variables

A **template reference variable** (`#name`) gives the template a name for an element, so other bindings in the same template can use it, with no component code needed:

```html
<input #query placeholder="Search…" (keyup.enter)="search(query.value)" />
<button (click)="search(query.value)">Search</button>
```

`query` is the `<input>` element itself, so `query.value` is whatever the user typed. Template variables are only visible inside the template that declares them. On a directive, `#name="exportName"` gives you the directive instead of the element, as in `#f="ngForm"` in the forms lesson.
````

**D7 (C31): L14, new subsection "Running code after the view renders"**

````md
### Running code after the view renders

Some work must wait until Angular has rendered: measuring an element, focusing it, or starting a third-party widget. Modern Angular has two functions for this, called from an injection context such as the constructor:

```typescript
import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';

@Component({
  selector: 'app-search-field',
  template: `<input #box placeholder="Search" />`,
})
export class SearchField {
  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  constructor() {
    // Runs once, after the next render, and only in the browser.
    afterNextRender(() => this.box().nativeElement.focus());
  }
}
```

- `afterNextRender()` runs once after the next render.
- `afterEveryRender()` runs after every render (called `afterRender()` before Angular 20).
- Both run only in the browser, never during server-side rendering, so they're the safe place for DOM APIs.
````

**D8 (C21): zoneless-safe examples**

Add this callout once in L08 → Best Practices (and link to it from L14, L17, L22, L29):

```md
> **Zoneless rule of thumb.** In a zoneless app (the default for new projects since Angular 21), Angular refreshes the view when a signal read by the template changes, when a template event handler runs, when the `async` pipe emits, or when you call `markForCheck()`. Assigning a plain field inside `setTimeout`, `setInterval`, or a `subscribe()` callback does none of these, so the screen doesn't update. Keep that state in a signal.
```

L14 Example 1:

```typescript
import { Component, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  template: `<p>Current time: {{ currentTime() }}</p>`,
})
export class ClockComponent implements OnInit, OnDestroy {
  protected readonly currentTime = signal(new Date().toLocaleTimeString());
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      // Writing a signal tells Angular to refresh the view, with or without zone.js.
      this.currentTime.set(new Date().toLocaleTimeString());
    }, 1000);
  }

  ngOnDestroy(): void {
    // Always clean up anything started in ngOnInit.
    clearInterval(this.intervalId);
  }
}
```

Apply the same pattern to the other examples:

- L14 Ex 2: `user = signal<UserSummary | null>(null)`, then `.subscribe(user => this.user.set(user))`; template `@if (user(); as u)`.
- L17 Ex 1: `count = signal(0)`, then `next: v => this.count.set(v)`.
- L17 Ex 3: see D13.
- L22 Ex 3: `isSaving = signal(false)`, `errorMessage = signal<string | null>(null)`; template `isSaving()` / `errorMessage()`.
- L29 Ex 2: `errorMessage = signal('')`, then `error: () => this.errorMessage.set('Invalid credentials')`.

**D9 (C22): L15 Example 2**

Replace the `@if (canDelete()) { <ng-container ngProjectAs…> }` block in `DeleteConfirmationComponent` with:

```html
<!-- Always project the footer; decide what goes inside it here. -->
<div modal-footer>
  @if (canDelete()) {
    <button type="button" (click)="cancel.emit()">Cancel</button>
    <button type="button" class="danger" (click)="confirmDelete.emit()">Delete</button>
  } @else {
    <button type="button" (click)="cancel.emit()">Close</button>
  }
</div>
```

Replace the explanation sentence with:

> Fallback content is decided once, when the slot is created. It appears only if *nothing at all* is projected into that slot. An `@if` block counts as projected content even while its condition is false, so wrapping the footer content in `@if` would leave the footer empty instead of showing the modal's fallback. Use fallback content for "the caller didn't pass anything" and put conditions inside the projected element.

Move the `ngProjectAs` demonstration to the title slot, where it is unconditional:

```html
<ng-container ngProjectAs="[modal-title]">
  <h2>Delete "{{ itemName() }}"?</h2>
</ng-container>
```

**D10 (C23): L04 Example 3 and exercise**

```typescript
// beta-panel.component.ts
import { Component, inject } from '@angular/core';
import { FEATURE_FLAGS } from './feature-flags.token';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-beta-panel',
  providers: [
    // Provide ThemeService here too, so this subtree gets its own instance.
    // That instance is created by this component's injector, so it sees the override below.
    ThemeService,
    { provide: FEATURE_FLAGS, useValue: { darkModeEnabled: true, betaFeaturesEnabled: true } },
  ],
  template: `<p>Dark mode here: {{ theme.isDarkModeEnabled() }}</p>`,
})
export class BetaPanelComponent {
  protected readonly theme = inject(ThemeService);
}
```

Add after the code:

> **Why `ThemeService` is listed too:** a service gets its own dependencies from the injector that created it. The app-wide `ThemeService` is created by the root injector, so it reads the root default for `FEATURE_FLAGS` and never sees an override placed lower in the tree. Listing `ThemeService` in this component's `providers` creates a separate instance whose `inject(FEATURE_FLAGS)` starts its lookup here, so it picks up the override. If only the component needs the flags, it can simply `inject(FEATURE_FLAGS)` itself.

New Common Mistake #7:

```md
7. **Overriding a token "under" a root service.** If `ApiService` is `providedIn: 'root'` and a component overrides `API_CONFIG` in its `providers`, the root `ApiService` still sees the root value. The override only affects services and components created at or below that component. Provide the service there as well if it must use the override.
```

Challenging exercise, replacing the second half:

> …Then create a feature component that provides **both** `ApiService` and an override of `HTTP_RETRY_CONFIG` (`{ retryAttempts: 0 }`) in its own `providers` array. Inject `ApiService` in a default area of the app and inside the feature component, and confirm that each logs a different retry count. Finally, remove `ApiService` from the feature's `providers` and explain in a comment why the override stops working.

**D11 (C25): L04 lookup modifiers**

````md
### Changing where the injector looks

`inject()` takes an options object that changes the lookup. These options replace the `@Optional()`, `@Self()`, `@SkipSelf()`, and `@Host()` decorators used with constructor injection:

```typescript
// Return null instead of throwing if nothing provides Logger
private readonly logger = inject(Logger, { optional: true });

// Only accept a provider declared on this component or directive itself
private readonly state = inject(EditorState, { self: true });

// Skip this element and start at the parent (e.g. a nested menu finding its parent menu)
private readonly parentMenu = inject(MenuComponent, { skipSelf: true, optional: true });

// Stop the search at the host component
private readonly form = inject(FormGroupDirective, { host: true, optional: true });
```
````

**D12 (C14): L16 effect timing**

- Line 100: "Effects **always run at least once**. The first run is scheduled shortly after the effect is created (during Angular's next change detection), not on the line that creates it."
- Summary line 435: "An **effect** runs at least once, shortly after it's created, and again whenever its signal dependencies change. It always runs **asynchronously**, during change detection."
- Flash card line 450 A: "At least once. The first run is scheduled shortly after creation, during change detection; after that it re-runs whenever a tracked signal changes."
- quiz-16 q2 correct option text: "At least once, shortly after creation (asynchronously)". Explanation: "Effects are scheduled, not run synchronously: the first run happens during the next change detection, and several changes in a row are batched into one run."

**D13 (C27): L17 Example 3**

```typescript
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface Order {
  id: number;
  status: string;
}

@Component({
  selector: 'app-order-tracker',
  template: `
    @if (order(); as current) {
      <p>Order #{{ current.id }}: {{ current.status }}</p>
    } @else {
      <p>Loading order...</p>
    }
  `,
})
export class OrderTrackerComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef); // captured in an injection context
  protected readonly order = signal<Order | null>(null);

  ngOnInit(): void {
    this.http
      .get<Order>('/api/orders/current')
      .pipe(
        catchError((err) => {
          console.error('Failed to load order', err);
          return of(null);
        }),
        // ngOnInit is NOT an injection context, so pass the DestroyRef explicitly.
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((order) => this.order.set(order));
  }
}
```

Line 324:

> By default `takeUntilDestroyed()` must be called in an **injection context**, such as the constructor or a field initializer. `ngOnInit` is *not* one, so calling it there without an argument throws an error. Here we inject `DestroyRef` as a field and pass it in: `takeUntilDestroyed(this.destroyRef)`.

**D14 (C34): L17 "Bridging Observables and signals"**

````md
### Bridging Observables and signals

`@angular/core/rxjs-interop` converts between the two models:

- `toSignal(obs$, { initialValue })` subscribes to an Observable and exposes its latest value as a signal. Without `initialValue`, the signal starts as `undefined`. Use `{ requireSync: true }` only for sources that emit synchronously when subscribed, such as a `BehaviorSubject`.
- `toObservable(sig)` turns a signal into an Observable, so you can apply operators like `debounceTime` and `switchMap` to it.
- `toSignal()` must be called in an injection context, and it unsubscribes when that context (component, directive, or service) is destroyed. In a root service, that means it never unsubscribes.

```typescript
export class ProductSearch {
  private readonly http = inject(HttpClient);
  protected readonly term = signal('');

  protected readonly results = toSignal(
    toObservable(this.term).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => this.http.get<Product[]>('/api/products', { params: { q: term } })),
    ),
    { initialValue: [] },
  );
}
```
````

**D15 (C41): L19 Example 3**

```typescript
import { Component, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-catalog-product',
  template: `
    @if (!invalid()) {
      <h2>Category {{ categoryId() }} — Product #{{ productId() }}</h2>
    }
  `,
})
export class CatalogProductComponent {
  categoryId = input.required<string>();
  productId = input(0, { transform: numberAttribute });

  // Derived state belongs in computed(), not in an effect.
  protected readonly invalid = computed(() => Number.isNaN(this.productId()));
  private readonly router = inject(Router);

  constructor() {
    // The effect only performs the side effect: navigating away.
    effect(() => {
      if (this.invalid()) {
        this.router.navigate(['/not-found']);
      }
    });
  }
}
```

**D16 (C42): L19 "Nested routes and child outlets"**

````md
### 6. Nested routes and child outlets

A route can have `children`. The parent's component renders a `<router-outlet />` of its own, and the matching child renders inside it:

```typescript
export const routes: Routes = [
  {
    path: 'orders/:orderId',
    component: OrderShell, // template: <h2>Order {{ orderId() }}</h2> <router-outlet />
    children: [
      { path: '', component: OrderSummary },
      { path: 'items/:itemId', component: OrderItem },
    ],
  },
];
```

By default, a child's inputs only receive its **own** route's params (`itemId`). To let `OrderItem` also receive the parent's `orderId`, enable inheritance once:

```typescript
provideRouter(
  routes,
  withComponentInputBinding(),
  withRouterConfig({ paramsInheritanceStrategy: 'always' }),
);
```
````

**D17 (C63): L32 "Lazy boundaries inside a template: `@defer`"**

````md
### Lazy boundaries inside a template: `@defer`

Routes split code per page. `@defer` splits code *inside* a page: the deferred component's code is downloaded only when a trigger fires.

```html
@defer (on viewport; prefetch on idle) {
  <app-progress-chart [entries]="store.entries()" />
} @placeholder (minimum 300ms) {
  <div class="h-64 rounded-xl bg-ink-100"></div>
} @loading (after 100ms; minimum 500ms) {
  <p>Loading chart…</p>
} @error {
  <p>The chart couldn't be loaded.</p>
}
```

- **Triggers:** `on idle` (the default), `on viewport`, `on interaction`, `on hover`, `on immediate`, `on timer(2s)`, or `when someCondition()`. `prefetch on …` downloads the code early without rendering it.
- **`@placeholder`** shows until the trigger fires. `on viewport`, `on interaction`, and `on hover` watch the placeholder unless you point them at another element (`on interaction(deleteButton)`).
- **`@loading`** shows while the code downloads; `after` and `minimum` prevent a flicker on fast connections. **`@error`** shows if loading fails.
- Only **standalone** components, directives, and pipes are deferred. If the same component is also used outside the `@defer` block in that file, it ends up in the main bundle anyway.
````

**D18 (C44): L20 change detection defaults**

Line 30:

> Before Angular 22, every component used `ChangeDetectionStrategy.Default` unless it opted out. With that strategy, whenever *any* asynchronous event happens anywhere in the app (a click, an HTTP response, a timer, a promise resolving), Angular walks the **entire component tree** and checks every component's bindings. Since Angular 22, `OnPush` is the default for components, and the old behaviour is called `ChangeDetectionStrategy.Eager` (`Default` still works but is deprecated). `ng update` adds `Eager` to existing components that don't set a strategy, so upgrading doesn't change how they behave.

Lines 40–42:

> - **`Eager`** (called `Default` before Angular 22): the component is checked whenever change detection runs, whether or not anything relevant to it changed.
> - **`OnPush`** (the default for components since Angular 22): the component is checked only when Angular has a specific, trackable reason to believe something changed.

Best Practices line 344:

> - **Use `OnPush` everywhere.** It's the default since Angular 22. On older versions, add `changeDetection: ChangeDetectionStrategy.OnPush` to every new component, and treat `Eager`/`Default` as the exception.

**D19 (C35, C36): L23 navigation lifecycle**

```md
1. **Route matching.** `canMatch` guards run while the router looks for a matching route config. If one returns `false`, the router doesn't block navigation; it tries the next route definition with the same path.
2. **Deactivation guards.** If the navigation leaves a currently active route, that route's `canDeactivate` guards run first. If one returns `false`, nothing else runs.
3. **Activation guards.** `canActivateChild` (inherited from parent routes) and `canActivate` run for the new route hierarchy, parent to child. All guards in one array start together; the router uses the first result, in the order they're listed, that isn't `true`.
4. **Resolvers.** Once every guard has passed, `resolve` functions run, parent to child. A child resolver can read data already produced by a parent resolver.
5. **Activation.** The component is created (or reused) and rendered, with resolved data already available.
```

Summary line 498: "The router evaluates `canMatch` while matching, then `canDeactivate` for the route being left, then `canActivateChild`/`canActivate`, and only then runs resolvers, parent to child."

quiz-23 q6 correct order: canMatch → canDeactivate → canActivate / canActivateChild → resolve → Activation.

**D20 (C51): L24 Example 2 async validator**

```typescript
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';

function uniqueUsernameValidator(usernameService: UsernameService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null); // let Validators.required handle empty values
    }

    // Wait 400 ms before calling the server. If the value changes before then,
    // Angular unsubscribes from this observable and calls the validator again,
    // so the timer (and any request it started) is cancelled automatically.
    return timer(400).pipe(
      switchMap(() => usernameService.checkAvailability(control.value)),
      map((isAvailable) => (isAvailable ? null : { usernameTaken: true })),
      catchError(() => of(null)), // a failed check shouldn't block the user
    );
  };
}
```

Replace the explanation bullets with:

> - **Each validation is a new, short-lived observable.** Angular calls the validator again on every value change and unsubscribes from the previous result first. That built-in cancellation is what discards stale requests.
> - `timer(400)` turns that cancellation into a debounce: while the user keeps typing, the timer never fires, so no request is sent.
> - Operators such as `distinctUntilChanged()` don't help *inside* a validator, because each call creates a stream with a single value.
> - `HttpClient` completes after one response, so the control always leaves `PENDING`. Add `take(1)` only for sources that don't complete on their own.

- Best Practices line 401: "Wrap server calls in `timer(…)` + `switchMap` so typing doesn't fire a request per keystroke, add `catchError`, and consider `updateOn: 'blur'`."
- Flash card line 432 A: "Start the check from `timer(ms)` inside the validator (Angular cancels the previous validation when the value changes), and/or set `updateOn` to `'blur'` or `'submit'`."
- quiz-24 q5: make the correct set **timer before the request · switchMap · catchError · updateOn: 'blur'**, with `distinctUntilChanged` as a distractor. Explanation: "Angular unsubscribes from the previous validation on each change, so a timer debounces and switchMap starts the request; distinctUntilChanged has no effect inside a single-value validator stream."

**D21 (C52): L24 "Custom validators for template-driven forms"**

````md
### Using a custom validator with `ngModel`

Template-driven forms find validators through the `NG_VALIDATORS` token, so a custom rule becomes a directive:

```typescript
import { Directive, forwardRef, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appForbiddenWord]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => ForbiddenWordDirective), multi: true },
  ],
})
export class ForbiddenWordDirective implements Validator {
  readonly appForbiddenWord = input.required<string>();

  validate(control: AbstractControl): ValidationErrors | null {
    const word = this.appForbiddenWord().toLowerCase();
    const value = String(control.value ?? '').toLowerCase();
    return word && value.includes(word) ? { forbiddenWord: { word } } : null;
  }
}
```

```html
<input name="bio" ngModel appForbiddenWord="spam" #bio="ngModel" />
@if (bio.hasError('forbiddenWord')) {
  <p class="error">Please don't use "spam".</p>
}
```

Add the directive to the component's `imports`. The same directive also works on `formControlName` inputs.
````

**D22 (C43): L25 Example 3**

Replace the providers and remove the `NgControl` code:

```typescript
@Component({
  selector: 'app-numeric-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `…unchanged…`,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumericStepperComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => NumericStepperComponent), multi: true },
  ],
})
export class NumericStepperComponent implements ControlValueAccessor, Validator {
  // …same inputs, state, CVA and Validator methods as before…
  // Removed: inject(NgControl, { self: true }) and the constructor assignment.
}
```

Add a warning after "The trade-off…" in the `NgControl` section (Concept → item 2):

> **Don't combine `NgControl` self-injection with `NG_VALIDATORS` or `NG_VALUE_ACCESSOR` providers on the same component.** `formControlName` asks the same element for `NG_VALIDATORS`. If that points back at your component while your component is waiting for `NgControl`, Angular reports a circular dependency (NG0200). Use `NgControl` self-injection for value accessors that don't validate themselves. When the control must also validate, register both tokens as providers as in Example 3.

Change Best Practices line 615 to match, and change the Challenging exercise line 661 to "Register the component with both `NG_VALUE_ACCESSOR` and `NG_VALIDATORS` providers…".

**D23 (C46): L26 accessibility**

Replace the "Accessibility for free" bullet (line 432):

> - **Plan a keyboard alternative.** CDK drag and drop is driven by mouse and touch. It doesn't let keyboard users pick up and move items, so add another way to reorder, for example *Move up* and *Move down* buttons on each row that call the same `moveItemInArray()` logic, and announce the new position with the CDK `LiveAnnouncer`.

- Best Practices line 455: "**Give keyboard users another way to reorder** (buttons or a menu), and test it with the keyboard only."
- Summary line 469: "CDK drag/drop is pointer- and touch-based; provide a keyboard alternative for reordering."

*(Own knowledge. Check the current `@angular/cdk/drag-drop` documentation before publishing.)*

**D24 (C58): L28 Common Mistakes**

> - **Mixing manual `detectChanges()` with zoneless scheduling.** In zoneless suites, prefer `await fixture.whenStable()` after each action so the test waits the same way production does. Forcing extra synchronous passes can hide scheduling bugs, such as state that only updates because the test happened to call `detectChanges()`.

Flash card line 581 A: "`whenStable()` waits for Angular's own scheduling to settle, matching production; `detectChanges()` forces a synchronous pass that can hide scheduling problems." Apply the same edit to the quiz-28 q2 explanation.

**D25 (C60): L33 Common Mistakes**

> - **Subscribing forever from a root service.** `toSignal()` or `subscribe()` inside a `providedIn: 'root'` service lives as long as the app. For a stream like a WebSocket, that keeps the connection open after every component that used it is gone. Let consumers connect and disconnect (for example a `connect(destroyRef)` method that counts listeners), or provide the service at the feature level so it's destroyed with the feature.

**D26 (C62): L20 "Images: `NgOptimizedImage`"**

````md
### Images: `NgOptimizedImage`

Large images are often the slowest part of a page. `NgOptimizedImage` (the `ngSrc` attribute) applies the usual fixes for you:

```typescript
import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product-hero',
  imports: [NgOptimizedImage],
  template: `
    <!-- The main image above the fold: load it first -->
    <img ngSrc="/images/hero.jpg" width="1200" height="600" priority alt="Kettlebells on a rack" />

    <!-- Images further down are lazy-loaded automatically -->
    <img ngSrc="/images/detail.jpg" width="400" height="300" alt="Close-up of the handle" />
  `,
})
export class ProductHero {}
```

- Images are **lazy-loaded** by default; `priority` loads the most important one eagerly.
- `width` and `height` (or `fill`) are required, so the page doesn't jump while images load.
- With an image loader for your CDN, Angular generates `srcset`s so each device downloads a suitable size.
````

**D27 (C40): L18 "One stream for every form change"**

````md
### One stream for every form change

Since Angular 18, every control also has an `events` Observable that reports value, status, touched, pristine, submit, and reset changes in one place:

```typescript
import { StatusChangeEvent, TouchedChangeEvent, ValueChangeEvent } from '@angular/forms';

this.form.events.pipe(takeUntilDestroyed()).subscribe((event) => {
  if (event instanceof ValueChangeEvent) console.log('value', event.value);
  if (event instanceof StatusChangeEvent) console.log('status', event.status); // VALID, INVALID, PENDING…
  if (event instanceof TouchedChangeEvent) console.log('touched', event.touched);
});
```
````

**D28 (C13): async data with `httpResource` (L17 section or new lesson; not in either book)**

````md
### Loading data as a signal: `httpResource`

`httpResource()` makes an HTTP request from a signal-based URL and exposes the result as signals. It re-fetches automatically when the URL's signals change:

```typescript
import { Component, input } from '@angular/core';
import { httpResource } from '@angular/common/http';

@Component({
  selector: 'app-user-profile',
  template: `
    @if (user.isLoading()) {
      <p>Loading…</p>
    } @else if (user.error()) {
      <p role="alert">Couldn't load this user.</p>
    } @else if (user.value(); as u) {
      <h2>{{ u.name }}</h2>
    }
  `,
})
export class UserProfile {
  readonly userId = input.required<string>();
  protected readonly user = httpResource<User>(() => `/api/users/${this.userId()}`);
}
```
````

*(Own knowledge plus web: experimental in v19/v20 and stable in v22 per release coverage. Neither book covers it. State the version your baseline uses.)*

---

## Step 3: Gaps (in the books, missing from the course)

| # | Gap | Rating | Where it should go | Source |
|---|---|---|---|---|
| G1 | **Custom directives**: attribute directives (inputs, host bindings/listeners via `host: {}`, exporting with `exportAs`), structural directives (`TemplateRef`/`ViewContainerRef`), and host directives (`hostDirectives` composition). `@Directive` appears **nowhere** in the course, yet L24/L25 need it. | **High** | New intermediate lesson after L15 (Content Projection). Outline below. | PA16 ch14 p.369–397, ch15 p.399–437; MA §4.2, PDF p.140–145; MA §3.4.2, PDF p.118–120 |
| G2 | **`@defer` deferrable views** (triggers, prefetch, placeholder/loading/error). | **High** | L32 (D17); brief mention in L09 | MA §10.2, PDF p.364–375 |
| G3 | **SSR, hydration, prerendering**: what SSR is, `ng new --ssr`/`ng add @angular/ssr`, browser-only code (`afterNextRender`, `isPlatformBrowser`), HTTP transfer cache, client hydration, prerendering. `ng new` asks about SSR, but nothing explains it. | **High** | New advanced lesson after L20. Outline below. | MA ch9 §9.1–9.3, PDF p.310–341; PA16 §27.4–27.5 p.759–779, §8.2 p.192 |
| G4 | **HttpClient fundamentals**: `get`/`post`/`put`/`delete`, typed responses, `params` and `headers`, error handling with `HttpErrorResponse`, CORS, `withFetch`. Every later lesson uses HttpClient, but no lesson teaches it. | **High–Med** | New intermediate lesson between L04 (DI) and L16, or an expanded L04 Example 2 | PA16 ch23 p.647–668; MA §4.5.2, PDF p.157 |
| G5 | `NgOptimizedImage` | Med | L20 (D26) | MA §4.4, PDF p.152–156 |
| G6 | **NgModules and migrating to standalone**: reading an `@NgModule`, `ng generate @angular/core:standalone`, circular imports. Learners will join NgModule codebases; the course only says "you won't need it". | Med | Optional advanced lesson "Working with legacy Angular", which can also host the control-flow and signal migrations | MA ch2 §2.1–2.2 and §2.5, PDF p.49–85 (schematic §2.5.3 p.81); PA16 ch19 p.540–567 |
| G7 | **Build & environments**: esbuild/Vite builder, `ng generate environments` + `fileReplacements`, preparing a deployment | Med | Short section in L01 + the SSR lesson (G3) | MA §9.4, PDF p.342–349; PA16 §9.5 p.240 |
| G8 | Template reference variables | Med | L10 (D5) | PA16 §13.2.3 p.340–342 |
| G9 | Signals ↔ RxJS interop details | Med | L17 (D14) | MA §6.6, PDF p.222–228; §7.3.4 p.254 |
| G10 | DI lookup modifiers | Med | L04 (D11) | MA §3.4.1, PDF p.116–117 |
| G11 | Validator directive for template-driven forms | Med | L24 (D21) | PA16 §22.3.1 p.633–636 |
| G12 | Child routes and nested outlets | Med | L19 (D16) | PA16 §25.4 p.717–724 |
| G13 | `afterNextRender` / `afterEveryRender` | Med | L14 (D7) | MA §9.2.3, PDF p.330–331 |
| G14 | Input transforms beyond numbers (`booleanAttribute`) and input aliases | Low | L13 Syntax Overview: `disabled = input(false, { transform: booleanAttribute }); // <app-x disabled> works` | MA §4.1.2, PDF p.126–130 |
| G15 | Inputs for dynamic components (`NgComponentOutlet` inputs, `ComponentRef.setInput`) | Low | Optional note in L31 | MA §4.1.4, PDF p.134–140 |
| G16 | Custom RxJS operators | Low | L22 (C49) | MA §5.4, PDF p.176–190 |
| G17 | Unified form `events` | Low | L18 (D27) | MA §4.3.5, PDF p.151–152 |
| G18 | `descendants` option for content queries | Low | L15 (C33) | PA16 §15.4 p.430–433 |

**G1 outline: "Custom Directives" (intermediate, ~50 min)**

- *Objectives:* build an attribute directive with signal inputs and `host` bindings; build a structural directive with `TemplateRef`/`ViewContainerRef`; compose behaviour with `hostDirectives`; export a directive with `exportAs` for `#ref="name"`.
- *Example 1:* `appHighlight`, setting a background colour through `host: { '[style.backgroundColor]': 'color()' }` with `color = input('yellow')`.
- *Example 2:* `*appIfRole="'admin'"`, a structural directive that calls `createEmbeddedView` and `clear()`.
- *Example 3:* a `Tooltip` directive reused through `hostDirectives: [{ directive: Tooltip, inputs: ['tooltip'] }]`.
- *Common mistakes:* manipulating the DOM with `document.querySelector` instead of host bindings; forgetting to import the directive; host-directive inputs not being exposed unless they are listed.

**G3 outline: "Server-Side Rendering, Hydration & Prerendering" (advanced, ~55 min)**

- *Objectives:* explain SSR vs. CSR vs. prerendering; add SSR to a project; write browser-only code safely; avoid double fetching with the HTTP transfer cache; understand hydration and why DOM manipulation outside Angular breaks it; choose routes to prerender.
- *Key snippets:* `provideClientHydration(withHttpTransferCacheOptions(...))`; `afterNextRender(() => window.scrollTo(0, 0))`; prerender configuration.
- *Common mistakes:* touching `window`/`localStorage` in constructors; DOM manipulation that breaks hydration; SSR stability with zoneless (`PendingTasks`).

**Skipped on purpose**

| Skipped | Why |
|---|---|
| HTML/CSS/JS primers (PA16 ch3–4) | Prerequisite knowledge; L30 already covers TypeScript patterns. |
| SportsStore project chapters (PA16 ch2, ch5–8) | Project-based format that doesn't fit this course's concept-per-lesson structure. |
| Angular Material component library (PA16 ch28) | Library-specific; L26 covers the CDK basics. |
| PWA / service workers (PA16 §8.3) and Docker containerising (PA16 §8.6) | Niche and off-objective for a framework course. |
| i18nSelect / i18nPlural pipes (PA16 §17.4.9–17.4.10) | Niche for beginners. |
| JSONP (PA16 §23.5) | Legacy technique. |
| AI-assisted unit testing with ChatGPT/Copilot (MA §8.4) | Dated quickly and off-objective. |
| How Angular evolves: RFCs and the release process (MA §1.4) | Background only. |
| Signals internals: producer/consumer graph (MA §7.2) | Too deep for the course's goals; L16 already names producers and consumers. |
| NgModule-era `SharedModule` hierarchies and SCAMs (MA §2.2) | Only relevant inside G6 if you add it. |

---

## Step 4: Content to cut or trim

| # | What | Action | Why |
|---|---|---|---|
| T1 | **L03 Data Binding & Signals** | Remove (C06) | Fully redundant with L07 and L08; metadata out of sync with the manifest. |
| T2 | Date-stamped version lines ("current stable release… June 2026") in L01, L02, L08, L09 | Trim (C65) | They go stale; replace with "since vXX". |
| T3 | L18 async-validator material and L24 repeated basics (password-match, username-taken) | Trim / replace (C53) | The same two examples are taught twice. |
| T4 | L22 Example 1 typeahead and the flattening-operator explanation repeated from L17 | Trim (C50) | The same example and table appear in L17. |
| T5 | L27 ComponentStore-centred Example 3 (90 min total) | Trim / replace with SignalStore (C57) | The lesson's own advice favours SignalStore; neither book covers NgRx. |
| T6 | L02 "selectorless components" box | Remove unless you can confirm it (C05) | Unverified feature claim. |
| T7 | `standalone: true` in code (60×) and `…Component` suffixes | Trim (C64) | Contradicts the course's own conventions. |
| T8 | Optional: L21 (Web Workers half), L26, L29, L35 | Mark as **optional electives** rather than cut | All sound, but outside both books and long (55–75 min each). Decide based on audience (D3). |

---

## C. Knock-on effects

**Quizzes that must change**

| Quiz | Question | Change |
|---|---|---|
| quiz-16 | q2 | The correct answer "At least once, immediately" is wrong. Use the D12 wording. |
| quiz-23 | q6 (ordering) | Reorder to canMatch → canDeactivate → canActivate/canActivateChild → resolve → activation (D19). Update the explanation. |
| quiz-24 | q5 | `distinctUntilChanged` is not effective inside an async validator. Use the new correct set (D20). |
| quiz-07 | q2, q3 | Explanations: property-with-string mechanism (C08); colspan is a compile error and the ARIA exception (D2). |
| quiz-25 | q3, q4 | Soften the `forwardRef` claim (C55). "Replaces the list" becomes "runtime error" (C54). |
| quiz-28 | q2 | Remove the NG0100 claim from the explanation (D24). |
| quiz-14 | q1 | Optional: add the `{ static: true }` caveat to the explanation (C30). |
| quiz-03 | all | Delete with L03; move q3 to quiz-07 and q4 to quiz-08 (C06). |
| quiz-04 | new | Add a question on the token-override trap (D10): "A root `ThemeService` injects `FEATURE_FLAGS`. A component overrides `FEATURE_FLAGS` in its providers. What does `ThemeService` see?" Answer: the root value, unless `ThemeService` is also provided at that component. |
| quiz-02 | q2, q3 | These test control flow (L09 material), not this lesson. Replace them with questions on `input()`/`output()`, `routerLink` vs `href`, and `withComponentInputBinding()`. |
| quiz-20 | new (if v22 baseline) | Add a question on `OnPush` as the default and the `Eager` rename (D18). |
| quiz-01, quiz-02 | — | Only 3 questions each (others have 6). Optionally add 3 each, e.g. "Which runner does a new v21+ project use?" (Vitest). |

**Exercises**

- **L04 Challenging:** rewrite (D10). The current version can't produce the expected result.
- **L19 Challenging:** needs D16 (nested routes and `paramsInheritanceStrategy`) or a rewording to a single flat route.
- **L24 Medium and Challenging:** they prescribe `debounceTime`/`distinctUntilChanged` inside validators. Switch them to the `timer` + `switchMap` pattern (D20).
- **L25 Challenging:** asks for `NgControl` self-injection combined with `Validator`, which causes the same circular-DI error. Switch it to providers for both tokens (D22).
- **L26 Best Practices / Challenging:** replace "test with a keyboard (Space/arrow keys)" with "build and test a keyboard alternative" (D23).
- **L28 Easy/Challenging, L31 tests, L33 Medium, L34 Medium/Challenging:** rewrite their spec code for the chosen runner (C59).
- **L03 exercises:** move into L08.

**Flash cards and summaries**

L16 (Q2 + Summary), L23 (Summary), L24 (Q4), L25 (Q3, Q4), L28 (Q2), L14 (Summary line 317), L08 (Summary line 376 if the OnPush/zoneless versions change), L20 (Summary and Flash cards: add "`OnPush` is the default since v22").

**Learning objectives**

- **L10:** add "Reference elements in the template with template reference variables (`#name`)."
- **L14:** add "Run DOM work after rendering with `afterNextRender()`."
- **L19:** the existing objective "Build multi-segment and nested dynamic routes" now has matching content (D16).
- **L20:** add "Explain the `Eager` and `OnPush` strategies and which is the default in your Angular version", plus "Optimize images with `NgOptimizedImage`" if D26 is added.
- **L25:** objective 3 should mention the `NgControl` limitation.
- **L27:** objectives 4–5 change if ComponentStore is replaced by SignalStore.
- **L32:** objective 6 gets real coverage of `@defer` (D17).
- **New lessons** (G1 Directives, G3 SSR, G4 HttpClient) need manifest entries, quizzes, and an `order` slot.

**App and manifest side effects (for whoever edits the portal)**

- Removing **lesson-03** changes the beginner order numbers in `course-manifest.json`, and `localStorage` progress may still contain `lesson-03` entries. Check that the dashboard's completion percentage counts only lessons that exist.
- Fix the `order` mismatch for lesson-19 (C67).
- The portal README says "Angular 20" while lessons say "Angular 22 is current". Align them after D1.

---

## D. Questions for you

1. **Which Angular version is the course's baseline?** The portal runs Angular 20.3. L02 says "targets Angular 20+", while L01, L02, L08 and L09 say "the current stable release is Angular 22". The answer decides how to treat `OnPush`-by-default (C44, v22), Signal Forms and `httpResource` being stable (C38, C13, v22), `withFetch()` deprecation (C61, v22), and `@default never;` (C16). My suggestion: write for **v20+**, with short "Since v21/v22" notes.
2. **Which unit-test runner should every code sample use?** Options are Vitest (the CLI default since v21), Jest (L28 today) or Jasmine (L33/L34 today). My suggestion: **Vitest**, keeping a short note on Jest/Jasmine for existing projects (C59).
3. **Audience for the advanced module.** L21 (workers), L26 (CDK), L27 (NgRx), L29 (Cypress) and L35 (micro frontends) are outside both books and run 55–90 minutes each. Should they stay core, become optional electives, or be trimmed? For L27: does your audience mostly maintain ComponentStore code (keep it) or start new projects (switch to SignalStore)?
4. **New lessons.** Adding Directives (G1), HttpClient (G4) and SSR/Hydration (G3) adds about 2.5–3 hours. Do you want them as new lessons (new ids such as lesson-36+, with order slots in the manifest), or folded into existing lessons?
5. **Selectorless components (L02 line 481).** Remove the box, or keep it as a "being explored" note?
6. **CDK keyboard support (C46).** I'm fairly confident CDK drag-and-drop has no built-in keyboard dragging, but CDK isn't installed in this repo, so I couldn't check the source. Can you confirm against the version you teach, or should I phrase the fix more cautiously?
7. **Applying the changes.** Should I apply these edits to `public/content/` and `public/quizzes/` directly? The authoring copies in `data/` are separate and not auto-synced. Should they be updated too, or are they retired?

---

### Web sources used for version facts

- [Announcing Angular v21 (Angular blog)](https://blog.angular.dev/announcing-angular-v21-57946c34f14b): Vitest default and stable; zoneless default for new apps.
- [What's new in Angular 21.0 (Ninja Squad)](https://blog.ninja-squad.com/2025/11/20/what-is-new-angular-21.0)
- [Angular 22: The Most Important New Features at a Glance (ANGULARarchitects)](https://www.angulararchitects.io/en/blog/angular-22-the-most-important-new-features-at-a-glance/): `OnPush` default, `Eager` rename, Signal Forms and `httpResource` stable, Fetch backend default.
- [Announcing Angular v22 (Angular blog)](https://blog.angular.dev/announcing-angular-v22-c52bb83a4664). The page blocked automated fetching; facts were cross-checked through the article above.

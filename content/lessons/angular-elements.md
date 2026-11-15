---
slug: angular-elements
title: "Angular Elements"
topic: architecture
kind: api
summary: "Wrap a standalone component as a custom element, so any page or framework can use it as a tag."
tags: [architecture, angular-elements, web-components, micro-frontends]
related: [micro-frontends-when, mfe-integration-contract, component-communication, input]
---
> **In one line:** `createCustomElement()` turns an Angular component into a standard web component: inputs become attributes and properties, and outputs become DOM events.

## The idea

A **custom element** is a browser-native tag such as `<exercise-form>`. Once registered, any HTML page, or any framework, can use it without knowing Angular exists. `@angular/elements` does the wrapping, so a micro frontend can be delivered as a tag.

The component's public interface maps onto the web platform:

| Angular | Becomes |
|---|---|
| `input()` | an attribute and a property on the element |
| `output()` | a DOM `CustomEvent` the host can listen to |
| the template | the element's content, optionally in a shadow root |
| the selector | the tag name you register with `customElements.define` |

## See it

```typescript
// main.ts of the micro frontend
const app = await createApplication({ providers: [provideZonelessChangeDetection()] });

const ExerciseFormElement = createCustomElement(ExerciseForm, { injector: app.injector });
customElements.define('exercise-form', ExerciseFormElement);
```

```html
<!-- Any host page, with no Angular knowledge -->
<exercise-form exercise="Squat" max-reps="12"></exercise-form>

<script>
  const form = document.querySelector('exercise-form');
  form.addEventListener('saved', (event) => console.log(event.detail));
</script>
```

```typescript
@Component({
  selector: 'app-exercise-form',
  encapsulation: ViewEncapsulation.ShadowDom,    // styles cannot leak in or out
  template: `<button type="button" (click)="saved.emit({ exercise: exercise() })">Save</button>`,
})
export class ExerciseForm {
  readonly exercise = input('');
  readonly maxReps = input(10, { transform: numberAttribute });
  readonly saved = output<{ exercise: string }>();
}
```

## Go deeper

Attributes are always **strings**. That is why `maxReps` uses `numberAttribute`: `max-reps="12"` arrives as `"12"`, and the transform converts it. For rich data, such as an object or array, set a **property** from JavaScript (`form.items = [...]`) rather than an attribute, because attributes cannot carry structure.

Attribute names are the dash-case of the input names: `maxReps` becomes `max-reps`. Output names become event names unchanged, with the payload in `event.detail`.

`ViewEncapsulation.ShadowDom` gives style isolation in both directions: the host page's CSS cannot restyle your component, and yours cannot leak into the page. Without it, global styles from either side collide, which is the most common integration surprise.

Each element needs its own application context. `createApplication()` builds one, with its providers, and passing its `injector` lets services work as usual. If several elements ship from one bundle, they can share that application and its services.

## Watch out

- Passing objects as attributes, which become `[object Object]`.
- Forgetting style isolation, so host and element styles collide.
- Expecting inputs to be numbers or booleans without a transform.

## Remember

- `createCustomElement` plus `customElements.define` registers a tag.
- Inputs are string attributes and properties; outputs are DOM events.
- Use Shadow DOM for style isolation and properties for complex data.

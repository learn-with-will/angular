---
slug: provider-scopes
title: "Where to provide a service"
topic: di
kind: technique
summary: "Choose between root, a route and a component, and get one instance per app, feature or widget."
tags: [di, providers, scope, singleton]
related: [injector-tree, injectable-service, pitfall-second-instance, facade-pattern]
---
> **In one line:** Where you provide a service decides how many instances exist and how long they live: one per app (root), one per feature (route), or one per component.

## The idea

The same service class can behave very differently depending on where it is registered. A shopping cart should be shared by the whole app; a wizard's step state should vanish when the wizard closes. Choosing the scope on purpose avoids both shared state that should be private and private state that should be shared.

| Where it is provided | Instances | Use it for |
|---|---|---|
| `providedIn: 'root'` | one per app | auth, cart, preferences, most facades |
| a route's `providers` | one per route subtree | state shared by one feature's pages, kept out of the root |
| a component's `providers` | one per component instance (and its children) | state private to one widget, reset when it is destroyed |

Start from the default and narrow only when you have a reason:

```tree
How long should the state live?
  As long as the app runs
    [root] providedIn root | one shared instance @blue
  While a feature's pages are in use
    [route] Route providers | gone when the route is left @green
  Only for one widget
    [local] Component providers | a fresh instance each time @amber
```

## See it

```typescript
// App-wide singleton: no providers entry needed
@Injectable({ providedIn: 'root' })
export class CartService { /* ... */ }
```

```typescript
// One instance per feature: provided on the route
export const routes: Routes = [
  {
    path: 'checkout',
    providers: [CheckoutState],
    loadChildren: () => import('./checkout.routes').then(m => m.CHECKOUT_ROUTES),
  },
];
```

```typescript
// One instance per editor: provided on the component
@Component({
  selector: 'app-editor',
  providers: [EditorState],
  template: `…`,
})
export class Editor {
  protected readonly state = inject(EditorState);
}
```

Each editor on the page gets its own `EditorState`, and it is destroyed along with the component.

## Go deeper

Route-level providers also keep services out of the root bundle. A service that only the checkout pages need is created when the user enters checkout and discarded when they leave, which fits lazy-loaded features well.

A service that is not `providedIn: 'root'` needs to be listed in a `providers` array somewhere, or injection fails with "No provider". Providing it in a component's `providers` also means it is created with that component, so it can use `inject()` for the component's own dependencies.

When in doubt, begin with `providedIn: 'root'`. Narrowing later is a small change, while accidentally sharing state is a bug that is hard to find.

## Watch out

- Listing a root service in a component's `providers` out of habit. That silently creates a second instance.
- Expecting component-scoped state to survive navigation. It is destroyed with the component.
- Putting a feature's state in the root when it should reset on leave. Provide it on the route.

## Remember

- Root means one per app, a route means one per feature, a component means one per widget.
- Start at root and narrow deliberately.
- Narrow scope gives automatic cleanup when the route or component goes away.

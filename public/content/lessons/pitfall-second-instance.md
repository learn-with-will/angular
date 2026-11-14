---
slug: pitfall-second-instance
title: "Pitfall: the accidental second instance"
topic: di
kind: pitfall
summary: "Listing a root service in a component's providers creates a separate copy that nothing else shares."
tags: [di, singleton, providers, debugging]
related: [provider-scopes, injector-tree, injectable-service, facade-pattern]
---
> **In one line:** If a service is `providedIn: 'root'` and a component also lists it in `providers`, that component and its children get a second, separate instance, and changes made there never reach the rest of the app.

## The idea

This is the most common singleton bug. A cart service is registered at root, so everyone should share one cart. Then, out of an old habit from the `NgModule` days, someone adds `providers: [CartService]` to a page component "just in case".

Angular obeys. That component's own injector now provides a `CartService`, so the page and everything beneath it gets a **new** instance. The navbar badge, which injects from the root, still holds the original. Click "Add to cart" and the page's cart changes while the badge stays at zero.

Nothing errors, and everything looks wired up correctly, which is why it takes so long to find. The first thing to check when "the badge does not update" is whether the service is provided in more than one place.

| Where it is provided | Who shares an instance |
|---|---|
| root only | the whole app |
| root and a component's `providers` | the component subtree has its own; everything else shares the root's |

## See it

```typescript
// Before: a second CartService is created for this page and its children
@Component({
  selector: 'app-product-page',
  providers: [CartService],                      // the bug
  template: `<button (click)="cart.add(product)">Add to cart</button>`,
})
export class ProductPage {
  protected readonly cart = inject(CartService);  // the page's private copy
}

// After: no providers entry, so it uses the one root instance
@Component({
  selector: 'app-product-page',
  template: `<button (click)="cart.add(product)">Add to cart</button>`,
})
export class ProductPage {
  protected readonly cart = inject(CartService);  // the shared root instance
}
```

Both components inject the same root instance in the "after" version, so the badge updates the instant you click, even though neither knows the other exists.

## Go deeper

The reverse mistake exists too: leaving a service at root when each widget needed its own private state, so two editors on a page overwrite each other. The decision is about intent. Ask "should these two places see each other's changes?" If yes, provide it once at the widest scope that needs it. If no, provide it per component or route.

A quick way to confirm a duplicate instance is to log something unique from the service's constructor, such as a counter. Seeing the constructor run twice means two injectors created it.

## Watch out

- Adding a service to `providers` "just in case". It is rarely harmless: it changes the number of instances.
- Providing at both root and a route, then wondering why two pages disagree.
- Debugging the UI before checking the providers. Look at where the service is provided first.

## Remember

- A service listed in a component's `providers` gets its own instance for that subtree.
- Provide a shared service once, at root; add component providers only to make a private copy on purpose.
- If shared state does not update, check for a second provider.

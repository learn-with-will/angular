---
slug: router-link
title: "routerLink and navigate()"
topic: routing
kind: api
summary: "Navigate without a page reload, from a template with routerLink or from code with the Router."
tags: [routing, routerlink, navigation, links]
related: [route-basics, route-params, query-params, lazy-routes]
---
> **In one line:** Use `routerLink` in templates and `router.navigate()` in code to move between routes without reloading the page.

## The idea

A plain `<a href="/products">` asks the browser to load a new page, so the whole app starts over: state is lost and everything reloads. `routerLink` does the same job inside the single-page app. The router changes the URL, swaps the component in the outlet, and the rest of the page stays alive.

You can give `routerLink` a string for a fixed path or an **array** for a path with dynamic parts. The array form is the one to prefer, because Angular escapes each value and the link stays correct if the route structure changes.

| You write | Navigates to |
|---|---|
| `routerLink="/about"` | `/about` |
| `[routerLink]="['/products', product.id]"` | `/products/42` |
| `[routerLink]="['/products']" [queryParams]="{ sort: 'price' }"` | `/products?sort=price` |
| `routerLink="../sibling"` | a route relative to the current one |

From TypeScript, inject the `Router` and call `navigate()` with the same array form, for example after a form saves.

## See it

```typescript
@Component({
  selector: 'app-products-page',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/products" routerLinkActive="active">All</a>
    </nav>
    <ul>
      @for (p of products(); track p.id) {
        <li><a [routerLink]="['/products', p.id]">{{ p.name }}</a></li>
      }
    </ul>
    <button type="button" (click)="goHome()">Home</button>
  `,
})
export class ProductsPage {
  private readonly router = inject(Router);
  protected readonly products = signal([{ id: 1, name: 'Keyboard' }, { id: 2, name: 'Monitor' }]);

  protected goHome(): void {
    void this.router.navigate(['/']);
  }
}
```

`routerLinkActive` adds a class to the link whose route is currently active, which is how a navigation bar highlights the current page.

## Go deeper

Both `RouterLink` and `RouterLinkActive` are directives, so a component that uses them must list them in `imports`. A `routerLink` without the import is silently an ordinary attribute, which is the silent-directive problem again.

For exact matching on the home link, pass `[routerLinkActiveOptions]="{ exact: true }"`. Otherwise `/` is a prefix of every URL and the home link looks active everywhere.

`navigate()` returns a promise that resolves to whether navigation succeeded, so you can chain work after it. Guards can cancel a navigation, which is why the result is not always `true`.

## Watch out

- Using `href` for in-app links. It reloads the whole app.
- Forgetting to import `RouterLink`. The attribute is then ignored without an error.
- Building a path by string concatenation, as in `'/products/' + id`. Use the array form instead, which escapes values correctly.

## Remember

- `routerLink` and `router.navigate()` navigate without a reload; `href` does not.
- Prefer the array form, `['/products', id]`.
- Import `RouterLink` and `RouterLinkActive` where you use them.

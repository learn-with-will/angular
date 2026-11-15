---
slug: query-params
title: "Query parameters"
topic: routing
kind: concept
summary: "Keep optional state such as filters, sorting and pages in the URL so it survives refresh and sharing."
tags: [routing, query-params, filters, pagination]
related: [route-params, component-input-binding, router-link, activated-route]
---
> **In one line:** Query parameters (`?sort=price&page=2`) hold *optional* view state. Putting filters and pagination there makes a screen shareable, bookmarkable and refresh-proof.

## The idea

A product list with a search box, a sort order and a page number has state. If that state lives only in component fields, a refresh resets it, the back button does not undo it, and you cannot send a colleague the exact view you are looking at.

Put it in the URL instead. Query parameters come after the `?`, are always optional, and do not change which route matches, so `/products` and `/products?sort=price` are the same page with different settings.

| Question | Where it belongs |
|---|---|
| *Which* product is this? | route parameter, `/products/42` |
| *How* should the list look? | query parameter, `?sort=price&page=2` |
| Is it secret or large? | neither, keep it in a service or the request body |

Because the URL is the single source of truth, the component just reads it, and a change of filter becomes a navigation.

## See it

```typescript
@Component({
  selector: 'app-product-list',
  imports: [RouterLink],
  template: `
    <a [routerLink]="[]" [queryParams]="{ sort: 'price' }" queryParamsHandling="merge">By price</a>
    <p>Sorted by {{ sort() }}, page {{ page() }}</p>
  `,
})
export class ProductList {
  // Bound from ?sort=... and ?page=... when withComponentInputBinding() is on
  readonly sort = input('name');
  readonly page = input(1, { transform: numberAttribute });

  private readonly router = inject(Router);

  protected nextPage(): void {
    void this.router.navigate([], {
      queryParams: { page: this.page() + 1 },
      queryParamsHandling: 'merge',
    });
  }
}
```

`[routerLink]="[]"` means "stay on the current route", so only the query string changes.

## Go deeper

`queryParamsHandling: 'merge'` is the detail that matters. By default a navigation *replaces* the whole query string, so clicking "next page" would silently drop the active `sort`. `merge` keeps what is already there and overrides only the keys you pass. `'preserve'` keeps everything and ignores new values.

Pass `null` for a key to remove it: `{ page: null }` clears pagination when a filter changes, which is usually what you want.

For a live search box, avoid pushing a history entry on every keystroke. Navigate with `replaceUrl: true` so the back button leaves the page instead of stepping through each letter.

## Watch out

- Forgetting `queryParamsHandling: 'merge'`, so changing one filter wipes the others.
- Storing identity in the query string, such as `?id=42`. Use a route parameter for *which resource*.
- Trusting values. They are strings and anyone can edit them; validate `page` and `sort`.

## Remember

- Query params carry optional view state; route params carry identity.
- Use `merge` so a change keeps the other keys.
- Read them with signal inputs or `queryParamMap`.

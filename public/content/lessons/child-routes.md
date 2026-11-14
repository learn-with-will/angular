---
slug: child-routes
title: "Child routes and nested outlets"
topic: routing
kind: technique
summary: "Share a layout across several pages by nesting routes, each level with its own router outlet."
tags: [routing, children, layout, nested-outlet]
related: [route-basics, lazy-routes, route-params, can-activate]
---
> **In one line:** A route can have `children`. The parent component renders the shared layout and a nested `<router-outlet />`, and the matched child fills it.

## The idea

Many screens share a frame: an admin area with a sidebar, a settings section with tabs, an account page with a header. Repeating that frame in every page component is wasteful. With **child routes** the frame is written once, as the parent, and only the inside changes.

Each level of nesting has its own outlet. The root outlet shows the parent, and the parent's template contains another outlet where the child appears.

```tree
router-outlet (root) @primary
  AdminLayout | sidebar and header @blue
    router-outlet (nested) @primary
      AdminUsers | path `users` @green
      AdminAudit | path `audit` @green
```

The URL is the concatenation: `/admin/users` matches the `admin` parent, then the `users` child. Navigating between the children keeps `AdminLayout` alive, so the sidebar does not flicker or lose its state.

## See it

```typescript
export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: AdminUsers },
      { path: 'audit', component: AdminAudit },
    ],
  },
];
```

```typescript
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <aside>
      <a routerLink="users">Users</a>
      <a routerLink="audit">Audit log</a>
    </aside>
    <main><router-outlet /></main>
  `,
})
export class AdminLayout {}
```

The links are *relative*: `routerLink="users"` resolves against the current route, so they keep working if the parent path is renamed.

## Go deeper

A parent without a `component` is a **componentless route**. It adds no layout, but it lets you share a path prefix, a guard or providers across its children, which is useful for putting one `canActivate` on a whole section.

Parameters of a parent are not always visible to a child. A child component can read `:id` from its parent route only if you opt in with `paramsInheritanceStrategy: 'always'` in the router options, or read it from `route.parent`. This surprises people in `/users/:id/orders` layouts, so decide on it early.

Combine nesting with lazy loading: `loadChildren` on the parent gives you a whole feature in its own chunk, with its layout and children together.

## Watch out

- Forgetting the nested `<router-outlet />` in the parent. The child matches but has nowhere to render.
- Putting `path: ''` children without a `pathMatch` thought-through, so a redirect loops or matches too much.
- Expecting a child to see the parent's `:id` without inheritance configured.

## Remember

- `children` nest routes; each level needs its own outlet.
- The parent layout stays alive while children swap.
- A componentless parent shares a prefix, guards and providers.

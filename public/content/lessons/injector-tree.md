---
slug: injector-tree
title: "The injector tree"
topic: di
kind: concept
summary: "How Angular walks up a hierarchy of injectors to find a provider."
tags: [di, injector, hierarchy, scope]
related: [provider-scopes, injectable-service, pitfall-second-instance, inject-function]
---
> **In one line:** Angular keeps a hierarchy of injectors that mirrors your component tree. When something asks for a dependency, Angular looks at the nearest injector and walks **up** until it finds a provider.

## The idea

An **injector** creates dependencies and caches them. Angular does not have one injector but a tree of them, in two layers:

- **Environment injectors** hold app-wide singletons. The root injector, plus one for each lazy-loaded route that declares `providers`, belong here. This is where `providedIn: 'root'` services live.
- **Element injectors** exist for each component or directive instance that has its own `providers` array. They let you scope a service to one component and its children.

A request starts at the component asking, goes to its parent, and keeps climbing until some injector can satisfy it. This is **hierarchical dependency injection**, and it is what lets one service class be both an app-wide singleton *and* a private per-component instance.

```tree
Root injector
  [root] App-wide services | providedIn: 'root' @blue
  Route providers
    [route] One feature's services | route `providers` @green
    Component providers
      [local] One component's services | component `providers` @amber
```

The closer an injector is to the component, the more specifically it can answer. A provider near the bottom hides one with the same token higher up, for that subtree only.

## See it

```typescript
@Injectable({ providedIn: 'root' })
export class Counter {
  count = signal(0);
}

@Component({
  selector: 'app-widget',
  providers: [Counter],             // this component and its children get their own Counter
  template: `{{ counter.count() }}`,
})
export class Widget {
  protected readonly counter = inject(Counter);
}
```

Every `<app-widget>` has a private `Counter`, because Angular finds the provider on the widget's own element injector before it climbs to the root.

## Go deeper

The lookup rule also explains what a provider *cannot* do. A service gets its own dependencies from the injector that **created** it. A root service is created by the root injector, so it never sees a provider declared lower in the tree. This catches people out when overriding configuration, and it has its own lesson.

Environment injectors are also why lazy routes can have private services: a route's `providers` create an injector for that route's subtree, and it is discarded with the route.

The options of `inject()` (`self`, `skipSelf`, `host`, `optional`) are controls over this walk: start here only, start at the parent, stop at the host, tolerate a miss.

## Watch out

- Providing a root service again in a component by habit. That creates a second instance for that subtree.
- Expecting a provider to affect services created higher up the tree. It only affects what is created at or below it.
- Assuming one service class means one instance. The number of instances equals the number of injectors that provide it.

## Remember

- Injectors form a tree, and lookup walks up from the asking component.
- Environment injectors hold app-wide and per-route singletons; element injectors scope to a component.
- A service is wired by the injector that created it, not by where it is used.

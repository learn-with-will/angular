---
slug: pitfall-token-override-below-root
title: "Pitfall: overriding a token below a root service"
topic: di
kind: pitfall
summary: "A root service never sees a provider declared lower in the tree, so the override does nothing."
tags: [di, providers, injector, configuration]
related: [injector-tree, injection-token, provider-scopes, pitfall-second-instance]
---
> **In one line:** A service gets its own dependencies from the injector that **created** it. A root service is created by the root injector, so an override placed on a component never reaches it.

## The idea

It sounds reasonable. `ThemeService` is a root singleton that reads a `FEATURE_FLAGS` token. A beta panel wants dark mode on, so it overrides `FEATURE_FLAGS` in its own `providers`. Surely `ThemeService` will pick that up?

It will not. The root injector built `ThemeService`, and when the service called `inject(FEATURE_FLAGS)` it searched from the *root* upward. The override lives lower, in the panel's element injector, which the root cannot see. The override only affects things created at or below the panel.

The rule to remember is: dependencies are resolved where the thing was *created*, not where it is *used*.

| Thing | Created by | Reads the token from | Sees the panel's override? |
|---|---|---|---|
| root `ThemeService` | the root injector | the root | no |
| `ThemeService` listed in the panel's `providers` | the panel's injector | the panel, then up | yes |
| the panel component itself | the panel's injector | the panel, then up | yes |

## See it

```typescript
@Component({
  selector: 'app-beta-panel',
  providers: [
    // A separate ThemeService, created by THIS injector, so it sees the override below
    ThemeService,
    { provide: FEATURE_FLAGS, useValue: { darkModeEnabled: true, betaFeaturesEnabled: true } },
  ],
  template: `<p>Dark mode here: {{ theme.isDarkModeEnabled() }}</p>`,
})
export class BetaPanel {
  protected readonly theme = inject(ThemeService);
}
```

Without `ThemeService` in that `providers` list, the panel would inject the root service and show the root's default, no matter what the override says.

## Go deeper

There are three ways out, depending on what you want:

- Provide the *service* in the same scope as the override, as above, so a copy is created there. That makes a separate instance, so it also has its own state.
- Let the component read the token itself with `inject(FEATURE_FLAGS)` and pass what the service needs as an argument. Often simpler when only the component cares.
- Reconsider the design. If a root service must behave differently per place, a global singleton may be the wrong shape for it.

The same reasoning explains why a service listed in a lazy route's `providers` sees overrides provided on that route: the route's injector created it.

## Watch out

- Overriding a token in a component and expecting an existing root service to change. Only what is created below the override sees it.
- Fixing it by providing the service twice and forgetting that it is now a second instance with its own state.
- Debugging by logging in the component. Log in the service to see which value it actually received.

## Remember

- Dependencies are resolved by the injector that created the consumer.
- An override helps only things created at or below the place it is provided.
- To make a root service see an override, provide the service in that scope too, or pass the value in.

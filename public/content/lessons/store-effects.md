---
slug: store-effects
title: "Effects: side effects outside reducers"
topic: state
kind: api
summary: "Listen for actions, call the API, and dispatch the result, with catchError on the inner request."
tags: [state, ngrx, effects, http]
related: [store-redux-flow, action-groups, catch-error-placement, flattening-operators]
---
> **In one line:** An effect listens for an action, does the impure work, and dispatches a new action with the result. Catch errors on the inner request so the effect survives.

## The idea

Reducers must be pure, so something else has to talk to the network. That something is an **effect**: an injectable class whose properties are streams of actions. It filters for the ones it cares about with `ofType`, runs the side effect, and maps the outcome to a new action.

The component never calls the API itself. It dispatches `Load Products`, and the story is traceable: the action caused the request, and the request produced exactly one success or failure action.

```sequence
actor comp: Component
actor eff: Effect
actor api: Server
actor red: Reducer
comp -> eff: `Load Products` action
eff -> api: GET `/api/products`
api --> eff: products
eff -> red: `Load Success` action
note red: State updated, view re-renders @green
```

## See it

```typescript
@Injectable()
export class ProductsEffects {
  private readonly actions$ = inject(Actions);
  private readonly productsService = inject(ProductsService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsPageActions.loadProducts),
      switchMap(() =>
        this.productsService.getAll().pipe(
          map((products) => ProductsApiActions.loadSuccess({ products })),
          catchError((error: Error) => of(ProductsApiActions.loadFailure({ error: error.message }))),
        ),
      ),
    ),
  );
}
```

## Go deeper

The effect is an ordinary RxJS pipeline, so the flattening-operator rules apply. `switchMap` suits a *load* where only the latest matters, `concatMap` fits writes that must happen in order, and `exhaustMap` suits an action that should be ignored while one is running.

`catchError` belongs **inside** the inner pipe and must return an Observable of an action. An effect is one long-lived stream. If an error escapes the inner pipe, the effect completes, and from that moment actions of that type are never handled again, with no visible error. `tapResponse` from `@ngrx/operators` packages the safe pattern.

Effects can also be non-dispatching, such as navigating or logging: `createEffect(() => ..., { dispatch: false })`. Use that for effects that return nothing, or NgRx will treat any value they emit as an action.

Keep effects small and testable. They only transform actions into API calls and results, and the service owns the HTTP detail.

## Watch out

- Putting `catchError` after the flattening operator, which kills the effect on the first error.
- Calling services from components instead of through effects.
- Forgetting `dispatch: false` on an effect that returns nothing useful.

## Remember

- `ofType`, side effect, result action.
- Inner `catchError` returning an action, or `tapResponse`.
- Choose the flattening operator by the concurrency you need.

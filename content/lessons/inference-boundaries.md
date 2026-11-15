---
slug: inference-boundaries
title: "Annotate the boundaries, infer the rest"
topic: architecture
kind: technique
summary: "Let TypeScript infer local values, and write types where data crosses a function, class or module boundary."
tags: [typescript, inference, annotations, api-design]
related: [types-erased-at-runtime, interface-type-class, utility-types-and-satisfies, data-service]
---
> **In one line:** Annotate public signatures and exported values. Let inference handle local variables and obvious initialisers.

## The idea

Typing everything is noise, and typing nothing at the edges is risk. The balance: **annotate where a value enters or leaves a unit, infer inside it.**

| Place | Annotate? | Why |
|---|---|---|
| public method parameters and return types | yes | it is the contract callers read |
| exported constants and class fields others use | yes | the type documents intent and survives refactors |
| a local `const total = items.length * 2` | no | the type is obvious and cannot be wrong |
| `signal(0)`, `new FormControl('')` | usually no | inferred from the initial value |
| an empty array or `null` start | yes | `signal<Product[]>([])`, otherwise `never[]` |

A return type is the most valuable annotation. Without it, a change inside the function can silently change what callers receive, and the error shows up in the caller, far from the cause.

## See it

```typescript
@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  // Annotated boundary: callers can rely on this
  list(search = ''): Observable<Product[]> {
    const params = { q: search };          // inferred: { q: string }
    return this.http.get<Product[]>('/api/products', { params });
  }
}

// Empty initial value: say what it will hold
protected readonly products = signal<Product[]>([]);
protected readonly selected = signal<Product | null>(null);
// Obvious initial value: no annotation needed
protected readonly count = signal(0);
protected readonly name = new FormControl('', { nonNullable: true });
```

## Go deeper

Inference can be too clever in one direction: a literal widens. `const mode = 'edit'` is typed as the literal `'edit'`, but `let mode = 'edit'` is `string`, so a function expecting `'edit' | 'view'` rejects it. Annotate such variables, or use `as const`.

Prefer annotating the **return type** of exported functions even when the body makes it obvious. It acts as a test: if you change the body so it no longer returns what you promised, the compiler complains inside the function.

Turn on `strict`, specifically `noImplicitAny`, so a parameter you forgot to annotate is an error rather than a silent `any`. Angular projects are generated with strict mode on, and turning it off to make an error disappear trades one failure for many later ones.

For callbacks, parameters are inferred from context (`items.map((item) => item.id)`), so adding types there is just noise.

## Watch out

- Leaving public methods without return types.
- An empty array or `null` initial value with no annotation.
- Disabling `strict` to silence errors.

## Remember

- Annotate boundaries; infer locals.
- Always type empty or `null` initial values.
- Keep `strict` and `noImplicitAny` on.

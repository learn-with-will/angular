---
slug: types-erased-at-runtime
title: "Types disappear at runtime"
topic: architecture
kind: concept
summary: "TypeScript checks your code before it runs. Nothing a type says is verified against real data."
tags: [typescript, types, runtime, validation]
related: [narrowing-unknown, interface-type-class, http-verbs, discriminated-unions]
---
> **In one line:** `http.get<Order>(...)` does not guarantee the server sent an `Order`. Types are erased when the code is compiled, so they promise nothing about runtime data.

## The idea

TypeScript is a checker that runs at build time. It compiles to plain JavaScript, and every annotation is removed. The browser never sees `Order`, `User` or `Product`.

That makes a type a **promise you make to the compiler**, not a check on the world. It is a good promise for your own code, which the compiler can follow, and a risky one at the edges, where data arrives from outside.

| Source of the value | Is the type checked at runtime? |
|---|---|
| a function you call with typed arguments | the compiler checks the call |
| `http.get<Order>(...)` | **no**, the generic is an assertion |
| `JSON.parse(text)` | no, it returns `any` |
| `localStorage.getItem(...)` | no, it is `string | null` |
| a route or query parameter | no, always a string |

At each of those boundaries the type can be wrong, and the compiler will not say so.

## See it

```typescript
// The compiler is happy. The server might send anything.
this.http.get<Order>('/api/orders/1').subscribe((order) => {
  console.log(order.total.toFixed(2));   // TypeError if the server omitted "total"
});

// Safer: treat the boundary as unknown, check, then use
const raw: unknown = JSON.parse(text);
if (isOrder(raw)) {
  console.log(raw.total.toFixed(2));
}
```

## Go deeper

The practical rule is **validate at the boundary, trust inside it**. Once data has been checked and turned into your own types, the rest of the app can rely on them, and the compiler's guarantees are real again. That is the reason to map server responses into a domain model in the data service, as the HTTP topic suggested.

How strict to be is a judgment call. For an API you control and test against, a typed generic is a fair trade. For input from users, third parties, local storage or anything an attacker or a stale client can influence, check it. A schema library (such as Zod or Valibot) writes the check and infers the type from one definition, so the two cannot drift apart.

This also explains `any`. It switches the checker off for that value, and the unchecked-ness spreads: anything derived from an `any` is `any` too. Prefer `unknown`, which forces a check before use, and the next lessons show how.

## Watch out

- Believing a generic on `http.get<T>` proves the response shape.
- Using `as Order` to silence an error instead of checking.
- Letting `any` spread from `JSON.parse` through the app.

## Remember

- Types vanish at compile time; they check code, not data.
- Validate at boundaries, then trust your own types.
- Prefer `unknown` to `any` for outside data.

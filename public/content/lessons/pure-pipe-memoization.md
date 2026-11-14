---
slug: pure-pipe-memoization
title: "Pure pipes as memoization"
topic: performance
kind: concept
summary: "A pure pipe re-runs only when its input changes by value or reference, and it remembers exactly one result."
tags: [performance, pipes, memoization, computed]
related: [heavy-work-tools, pure-and-impure-pipes, pitfall-onpush-mutation, web-worker-basics]
---
> **In one line:** Angular calls a pure pipe's `transform()` only when its inputs changed, and reuses the previous output otherwise. The cache holds a single entry.

## The idea

Every pipe is pure by default. On each change detection pass, Angular compares the pipe's inputs with the last call:

| Input type | Compared | A change means |
|---|---|---|
| `string`, `number`, `boolean` | by value | a different value |
| object or array | **by reference** | a different reference |

If nothing changed, `transform()` is skipped. Because arrays and objects are compared by reference, mutating one in place changes nothing the pipe can see: `items.push(x)` leaves the reference the same, so the pipe keeps its stale output. That is the most common "my pipe is not updating" bug.

The cache is **one entry, the most recent call**. It is not a table keyed by every input you ever passed. If a template alternates between two values, the pipe recomputes each time.

`computed()` gives the same lazy, memoized behaviour anywhere in TypeScript, not only in templates, and it tracks dependencies automatically.

| Use | When |
|---|---|
| pure pipe | a transformation needed only at the point of display in a template |
| `computed()` | a derived value your component logic also needs |

## See it

```typescript
@Pipe({ name: 'expensiveFormat' })
export class ExpensiveFormatPipe implements PipeTransform {
  transform(value: number): string {
    console.log('recalculating…');
    let checksum = 0;
    for (let i = 0; i < 2_000_000; i++) checksum += Math.sqrt(i) % (value || 1);
    return `${value.toLocaleString()} (checksum: ${checksum.toFixed(2)})`;
  }
}
```

```html
<p>Formatted: {{ inputValue() | expensiveFormat }}</p>
<button (click)="unrelated.update(n => n + 1)">Unrelated: {{ unrelated() }}</button>
<button (click)="inputValue.update(n => n + 1)">Change input</button>
```

Click "Unrelated" and the console stays quiet. Click "Change input" and it logs every time.

## Go deeper

Pair pure pipes with immutable data: replace arrays instead of mutating them, and the reference change is exactly what the pipe watches. A filter pipe given `items` and `term` re-runs only when one of them is genuinely new.

A pure pipe still runs its work **on the main thread, once per change of input**. If that single run is long, the frame is blocked the first time, and a worker is the better tool. Memoization reduces repetition, not cost per run.

Prefer `computed()` when the value is also used in the class, or when it depends on several signals, since you do not have to pass them all as pipe arguments. Reserve an impure pipe for the rare case that truly must run every cycle, and treat it as a performance liability.

## Watch out

- Mutating an array that feeds a pure pipe.
- Expecting the pipe to cache many different inputs.
- Calling a method in the template instead of using a pipe or `computed()`.

## Remember

- Pure pipes re-run on a changed input: by value for primitives, by reference for objects.
- The cache is one entry.
- `computed()` is the same idea for TypeScript code.

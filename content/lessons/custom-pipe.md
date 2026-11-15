---
slug: custom-pipe
title: "Custom pipes"
topic: directives-pipes
kind: api
summary: "Write your own pure pipe to reuse a formatting rule across templates."
tags: [pipes, custom, pipetransform, reuse]
related: [pipe-basics, pure-and-impure-pipes, builtin-pipes, pipes-in-typescript]
---
> **In one line:** A custom pipe is a class with `@Pipe({ name })` and a `transform()` method. Use it when the same display formatting repeats in many places.

## The idea

When you catch yourself writing the same formatting in several templates, extract it. A custom pipe packages that rule once, names it, and lets every template use it with the familiar `|` syntax.

A pipe is a class that implements `PipeTransform`. Its `transform()` method receives the value on the left of the `|`, then any arguments after the colons, and returns what to display. Like components and directives, pipes are standalone: the component that uses it adds it to `imports`.

> **Tip:** Keep a custom pipe pure and free of side effects. A pure function of its inputs is easy to test and cheap to run, because Angular only calls it when the input changes.

## See it

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })               // standalone and pure by default
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength = 20): string {
    return value.length <= maxLength ? value : value.slice(0, maxLength) + '…';
  }
}
```

```typescript
@Component({
  selector: 'app-summary',
  imports: [TruncatePipe],
  template: `<p>{{ description | truncate:50 }}</p>`,
})
export class Summary {
  description = 'A very long description that would not fit on one line of a card.';
}
```

`truncate:50` passes `50` as `maxLength`. With no argument it uses the default of 20.

## Go deeper

Test a pipe like a plain function, because that is all it is. There is no template or `TestBed` needed:

```typescript
it('truncates long text and keeps short text', () => {
  const pipe = new TruncatePipe();
  expect(pipe.transform('short', 20)).toBe('short');
  expect(pipe.transform('a'.repeat(30), 10)).toBe('aaaaaaaaaa…');
});
```

A pipe takes the input type it declares, so type `value` as narrowly as you can and handle `null` and `undefined` if templates may pass them. Several built-in pipes accept `null` and return an empty result, which is a good model for yours.

## Watch out

- Putting side effects, such as a service call, in `transform()`. Pure pipes may run more or less often than you expect.
- Marking the pipe `pure: false` to make it refresh after a mutation. Replace the data instead.
- Writing a pipe for a rule that belongs to business logic. Pipes are for display; rules live in the class or a service.

## Remember

- A custom pipe is `@Pipe({ name })` plus a `transform()` method, imported where it is used.
- Keep it pure; test it as a plain function.
- Extract a pipe when the same formatting repeats, not before.

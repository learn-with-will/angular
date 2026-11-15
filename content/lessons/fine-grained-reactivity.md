---
slug: fine-grained-reactivity
title: "Fine-grained reactivity"
topic: signals
kind: concept
summary: "Why signals update only the exact consumers of a change, instead of re-checking everything."
tags: [signals, change-detection, zoneless]
related: [signal, computed, signals-in-templates, untracked]
---
> **In one line:** A signal knows exactly which templates and computations read it, so when it changes Angular updates only those, with no full-tree checking.

## The idea

Every UI framework must answer one question: when state changes, how do we update only the parts of the screen that depend on it?

For most of Angular's history the answer was **Zone.js**. It patched timers, events and HTTP, and after almost any async event told Angular to re-check the whole component tree. That works, and it is simple to use, but it is coarse: Angular often re-evaluates parts of the page that did not change, and it can be hard to see *why* something updated.

Signals flip this around. Reading a signal records a dependency, so each signal ends up holding a list of its consumers. A change walks that list and nothing else.

| | Zone.js change detection | Signals |
|---|---|---|
| Trigger | almost any async event | a signal's value changed |
| Work done | re-check the component tree | update only the consumers that read it |
| Why did it update? | hard to trace | follow the dependency graph |

Think of a spreadsheet: change `A1` and only the cells whose formulas reference `A1` recalculate, not the whole workbook. Here is the same idea for a small cart. Each arrow means "reads":

```flow
price: `price` | signal @primary
qty: `quantity` | signal @primary
total: `total` | computed @blue
items: `items` | computed @blue
t-total: Template | shows the total @green
t-items: Template | shows the item count @green
price -> total
qty -> total
qty -> items
total -> t-total
items -> t-items
```

Change `price` and only `total` and the total in the template update. The item count never notices. Change `quantity` and both branches update, because both read it.

## See it

```typescript
const price = signal(10);
const qty = signal(2);

const total = computed(() => price() * qty());   // reads price and qty
const items = computed(() => qty());             // reads qty only

price.set(12);   // only `total` is marked dirty; `items` is untouched
qty.set(3);      // now both `total` and `items` are dirty
```

The same graph in a component. Clicking the button changes `price`, so Angular re-evaluates `{{ total() }}` and leaves `{{ items() }}` alone:

```typescript
@Component({
  selector: 'app-cart-summary',
  template: `
    <p>Total: {{ total() }}</p>
    <p>Items: {{ items() }}</p>
    <button (click)="price.update(p => p + 1)">Raise price</button>
  `,
})
export class CartSummary {
  protected readonly price = signal(10);
  protected readonly qty = signal(2);
  protected readonly total = computed(() => this.price() * this.qty());
  protected readonly items = computed(() => this.qty());
}
```

## Go deeper

This precision is what makes **zoneless** Angular possible. Without Zone.js watching every async callback, Angular needs another way to learn that something changed, and signals provide it: a signal that a template reads *is* the notification. Zoneless is the default for new projects since Angular 21.

It also pairs naturally with `OnPush` components, which already skip checking when nothing they depend on has changed.

A useful habit when something does not update, or updates too often, is to ask "who reads this signal?". The answer is the whole story: the readers are exactly the things that will refresh. A binding that never calls the signal will never refresh, and a computed that reads one more signal than you meant will refresh more than you wanted.

## Watch out

- Dependencies are recorded by *reading*. A signal read outside a reactive context, in a plain method or a timeout callback, is just a read and re-runs nothing.
- In a zoneless app, assigning a plain field inside `setTimeout`, `setInterval` or `subscribe()` does not refresh the view. Keep that state in a signal.

## Remember

- Reading a signal in a template, `computed()` or `effect()` registers a dependency.
- A change updates only those consumers, not the whole tree.
- This is the foundation for zoneless Angular, the default for new projects since Angular 21.

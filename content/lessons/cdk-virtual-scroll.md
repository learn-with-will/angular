---
slug: cdk-virtual-scroll
title: "CDK virtual scrolling"
topic: performance
kind: technique
summary: "Render only the rows in view, so a list of 100,000 scrolls like a list of 20."
tags: [performance, cdk, virtual-scroll, lists]
related: [onpush-triggers, change-detection-strategies, ng-optimized-image, pitfall-onpush-mutation]
---
> **In one line:** `cdk-virtual-scroll-viewport` renders only the visible rows plus a small buffer, and a spacer fakes the full scroll height.

## The idea

Rendering 10,000 `<div>` elements creates 10,000 real DOM nodes for the browser to lay out, paint and keep in memory, although the user sees about twenty. The result is janky scrolling, slow first render and high memory use.

Virtual scrolling ("windowing") keeps the DOM small. From the scroll offset and the row height it works out which slice of the array is visible, renders only that slice, and recycles nodes as new rows come into view.

```tree
cdk-virtual-scroll-viewport | fixed height, scrolls @primary
  spacer | fakes the full height, 100,000 x 48 px @amber
  rendered rows | visible slice plus buffer, about 30 nodes @green
    Row 4,010 | visible @blue
    Row 4,011 | visible @blue
    Row 4,012 | visible @blue
```

It is behaviour only: the CDK ships no styles. The default strategy, `FixedSizeVirtualScrollStrategy`, assumes **every row has the same, known height**, which covers most lists.

## See it

```typescript
@Component({
  selector: 'app-big-list',
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="48" class="viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackById" class="row">
        Row #{{ item }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 400px; width: 100%; }
    .row { height: 48px; box-sizing: border-box; }
  `],
})
export class BigList {
  protected readonly items = Array.from({ length: 100_000 }, (_, i) => i + 1);
  protected trackById(_: number, item: number): number { return item; }
}
```

## Go deeper

Two details cause most problems. First, `itemSize` must match the **real rendered row height** in pixels, or scrolling jumps and jitters. Second, the viewport needs an **explicit height** in CSS. Without bounded dimensions there is nothing to scroll, and the list renders as empty or as a single row.

`minBufferPx` and `maxBufferPx` control how much extra content is pre-rendered outside the view. A larger buffer gives smoother fast scrolling at the cost of more nodes.

For rows of varying height you need a custom `VirtualScrollStrategy`, which is advanced; if you can make rows a uniform height with truncation, do that instead. Programmatic control is available through the viewport instance: `viewport.scrollToIndex(0, 'smooth')`.

Remember virtualisation changes behaviour, not just speed. Browser find-in-page cannot see rows that are not in the DOM, and keyboard focus can be lost when a focused row scrolls out and is recycled, so check accessibility for interactive rows. Also, `trackBy` lets rows be reused when the range shifts, which keeps scrolling smooth.

## Watch out

- An `itemSize` that does not match the real row height.
- A viewport with no explicit CSS height.
- Variable-height rows with the fixed-size strategy.

## Remember

- Only visible rows are in the DOM; a spacer fakes the height.
- `itemSize` must equal the real row height, and the viewport needs a height.
- Check find-in-page and focus behaviour for interactive rows.

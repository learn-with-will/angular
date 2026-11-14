---
slug: ng-optimized-image
title: "NgOptimizedImage"
topic: performance
kind: api
summary: "Lazy loading, a priority image and required dimensions: the standard image fixes with one attribute."
tags: [performance, images, ngoptimizedimage, lcp]
related: [change-detection-strategies, ssr-render-modes, lazy-routes, zoneless-and-signals]
---
> **In one line:** Use `ngSrc` instead of `src`. Images load lazily by default, `priority` loads the hero image first, and required dimensions stop the page from jumping.

## The idea

Large images are often the slowest part of a page, and no change detection strategy fixes that. `NgOptimizedImage` applies the usual remedies for you, and warns in development when you forget one.

| Feature | What it does |
|---|---|
| lazy loading by default | images below the fold load only when needed |
| `priority` | the key image loads eagerly with a high fetch priority |
| required `width` and `height` (or `fill`) | the browser reserves space, so there is no layout shift |
| an image loader for your CDN | generates a `srcset` so each device downloads a suitable size |

Layout shift and a late hero image are exactly what the Core Web Vitals measure, so this is the cheapest performance win on most pages.

## See it

```typescript
@Component({
  selector: 'app-product-hero',
  imports: [NgOptimizedImage],
  template: `
    <!-- The main image above the fold: load it first -->
    <img ngSrc="/images/hero.jpg" width="1200" height="600" priority alt="Kettlebells on a rack" />

    <!-- Images further down are lazy-loaded automatically -->
    <img ngSrc="/images/detail.jpg" width="400" height="300" alt="Close-up of the handle" />
  `,
})
export class ProductHero {}
```

## Go deeper

Mark exactly **one** image as `priority`: the one that will be the largest visible element on first paint (the LCP image). Marking many cancels the benefit, because the browser can no longer tell which matters most, and Angular warns when more than one competes.

`width` and `height` are the *intrinsic* size used for the aspect ratio. They do not force the displayed size, which CSS still controls. For an image that fills a container of unknown size, use `fill` and give the container `position: relative` and a size.

Configure a loader once, such as `provideImgixLoader(url)` or `provideCloudinaryLoader(url)`, and every `ngSrc` is rewritten into a CDN URL with sized variants. Add `sizes` so the browser picks the right `srcset` entry for the layout.

On a server-rendered page the hero image can even be preloaded, because the `priority` flag emits a preload link in the HTML head.

## Watch out

- Omitting `width` and `height`, which causes layout shift (and a dev warning).
- Marking several images as `priority`.
- Forgetting to import `NgOptimizedImage`, so `ngSrc` is just an unknown attribute.

## Remember

- `ngSrc` gives lazy loading, `priority` for the hero, and fixed dimensions.
- One priority image per page.
- A loader plus `sizes` serves the right file to each device.

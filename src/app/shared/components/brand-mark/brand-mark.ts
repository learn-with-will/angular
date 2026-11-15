import { Component } from '@angular/core';

let uid = 0;

/**
 * The Angular Learn mark: a circle with a bite taken out of it, filled with
 * Angular's red → magenta → purple gradient. The gradient appears nowhere else
 * in the UI, which keeps the mark recognisable.
 */
@Component({
  selector: 'app-brand-mark',
  template: `
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" class="h-full w-full">
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E40035" />
          <stop offset="50%" stop-color="#F20089" />
          <stop offset="100%" stop-color="#6002EE" />
        </linearGradient>
        <mask [attr.id]="maskId">
          <rect width="32" height="32" fill="#fff" />
          <circle cx="27" cy="6" r="7" fill="#000" />
        </mask>
      </defs>
      <circle cx="15" cy="17" r="14" [attr.fill]="'url(#' + gradientId + ')'" [attr.mask]="'url(#' + maskId + ')'" />
    </svg>
  `,
  host: { class: 'block' },
})
export class BrandMark {
  private readonly id = uid++;
  protected readonly gradientId = `bite-gradient-${this.id}`;
  protected readonly maskId = `bite-mask-${this.id}`;
}

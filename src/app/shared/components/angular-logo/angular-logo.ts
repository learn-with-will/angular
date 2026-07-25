import { Component, input } from '@angular/core';

let uid = 0;

/** The Angular shield, filled with the brand gradient (red → magenta → purple). */
@Component({
  selector: 'app-angular-logo',
  template: `
    <svg viewBox="0 0 250 250" aria-hidden="true" focusable="false" class="h-full w-full">
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E40035" />
          <stop offset="48%" stop-color="#F20089" />
          <stop offset="100%" stop-color="#6002EE" />
        </linearGradient>
      </defs>
      <polygon
        [attr.fill]="fill"
        points="125,30 31.9,63.2 46.1,186.3 125,230 203.9,186.3 218.1,63.2"
      />
      <path
        fill="#fff"
        d="M125,52.1L66.8,182.6h21.7l11.7-29.2h49.4l11.7,29.2h21.7L125,52.1z M142,135.4H108l17-40.9L142,135.4z"
      />
    </svg>
  `,
  host: { class: 'block' },
})
export class AngularLogo {
  /** Render the shield flat in the current text colour instead of the gradient. */
  readonly flat = input(false);

  protected readonly gradientId = `ng-shield-${uid++}`;

  protected get fill(): string {
    return this.flat() ? 'currentColor' : `url(#${this.gradientId})`;
  }
}

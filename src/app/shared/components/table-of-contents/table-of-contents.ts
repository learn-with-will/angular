import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TocEntry } from '../../../core/models/lesson.model';

@Component({
  selector: 'app-table-of-contents',
  imports: [RouterLink],
  template: `
    @if (entries().length) {
      <nav class="text-sm" aria-label="On this page">
        <p class="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-wider text-ink-400 uppercase">
          <span class="gradient-rule h-0.5 w-3 shrink-0"></span>
          On this page
        </p>
        <ul class="space-y-0.5 border-l-2 border-ink-200 dark:border-ink-800">
          @for (entry of entries(); track entry.id) {
            <li>
              <!-- routerLink + fragment, not a bare href: with <base href="/">
                   a plain "#id" resolves to the homepage. -->
              <a
                [routerLink]="[]"
                [fragment]="entry.id"
                class="focusable -ml-0.5 block border-l-2 border-transparent py-1.5 font-medium text-ink-500 transition hover:border-brand-500 hover:text-brand-600 dark:text-ink-400 dark:hover:text-brand-300"
                [class.pl-4]="entry.level === 1"
                [class.pl-6]="entry.level === 2"
                [class.pl-8]="entry.level === 3"
              >
                {{ entry.text }}
              </a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
})
export class TableOfContents {
  readonly entries = input.required<TocEntry[]>();
}

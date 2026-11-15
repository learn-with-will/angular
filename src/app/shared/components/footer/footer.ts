import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandMark } from '../brand-mark/brand-mark';

@Component({
  selector: 'app-footer',
  imports: [BrandMark, RouterLink],
  template: `
    <footer class="mx-auto w-full max-w-7xl px-4 pt-20 pb-28 sm:px-6 lg:pb-12">
      <div
        class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-ink-200 pt-7 text-sm text-ink-500 dark:border-ink-800 dark:text-ink-400"
      >
        <a routerLink="/" class="flex items-center gap-2.5 rounded-lg font-semibold text-ink-900 dark:text-white">
          <app-brand-mark class="h-5.5 w-5.5" />
          Angular Learn
        </a>
        <p>One idea per lesson. Free and open, no account needed.</p>
        <nav aria-label="Footer" class="flex gap-5">
          <a routerLink="/lessons" class="rounded hover:text-ink-900 dark:hover:text-white">All bites</a>
          <a routerLink="/quiz" class="rounded hover:text-ink-900 dark:hover:text-white">Quiz</a>
          <a routerLink="/random" class="rounded hover:text-ink-900 dark:hover:text-white">Surprise me</a>
        </nav>
      </div>
    </footer>
  `,
})
export class Footer {}

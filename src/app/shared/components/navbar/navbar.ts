import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AccountMenu } from '../account-menu/account-menu';
import { BrandMark } from '../brand-mark/brand-mark';

/** The id of the search box on the lessons page, which Ctrl/⌘ K focuses. */
export const LESSON_SEARCH_ID = 'lesson-search';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, BrandMark, AccountMenu],
  templateUrl: './navbar.html',
  // `contents`: a sticky element only sticks within its parent box. As a block,
  // this host would be exactly the header's height, so the header would scroll
  // away with it; without a box of its own the header sticks to the page.
  host: { class: 'contents', '(document:keydown)': 'onKeydown($event)' },
})
export class Navbar {
  protected readonly theme = inject(ThemeService);
  private readonly course = inject(CourseService);
  private readonly router = inject(Router);

  protected readonly total = computed(() => this.course.lessons().length);

  /** Shown on the search button; Mac users expect ⌘ rather than Ctrl. */
  protected readonly shortcut =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

  protected readonly links = [
    { path: '/', label: 'Home', icon: 'M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z' },
    { path: '/lessons', label: 'Lessons', icon: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5ZM4 19a2 2 0 0 1 2-2h13' },
    {
      path: '/quiz',
      label: 'Quiz',
      icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1.1.8-1.1 1.5M12 16.6v.01',
    },
    { path: '/dashboard', label: 'Progress', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
    { path: '/bookmarks', label: 'Saved', icon: 'M6 4h12v16l-6-4-6 4V4Z' },
  ];

  /** Opens the lessons page with its search box focused. */
  protected openSearch(): void {
    const focus = () => document.getElementById(LESSON_SEARCH_ID)?.focus();
    if (document.getElementById(LESSON_SEARCH_ID)) {
      focus();
      return;
    }
    void this.router.navigate(['/lessons']).then(() => setTimeout(focus));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }
}

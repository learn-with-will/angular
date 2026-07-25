import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';

import { CourseService } from '../../core/services/course.service';
import { LessonService } from '../../core/services/lesson.service';
import { ProgressService } from '../../core/services/progress.service';
import { Lesson, LEVEL_BADGES, LEVEL_LABELS } from '../../core/models/lesson.model';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { TableOfContents } from '../../shared/components/table-of-contents/table-of-contents';
import { LessonNavigation } from '../../shared/components/lesson-navigation/lesson-navigation';

@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, MarkdownComponent, Sidebar, TableOfContents, LessonNavigation],
  templateUrl: './lesson.html',
})
export class LessonPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly course = inject(CourseService);
  private readonly lessonService = inject(LessonService);
  protected readonly progress = inject(ProgressService);

  protected readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' },
  );

  protected readonly lesson = signal<Lesson | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  protected readonly neighbours = computed(() => this.course.neighbours(this.slug()));
  protected readonly completed = computed(() => {
    const l = this.lesson();
    return l ? this.progress.isCompleted(l.meta.id) : false;
  });
  protected readonly bookmarked = computed(() => {
    const l = this.lesson();
    return l ? this.progress.isBookmarked(l.meta.id) : false;
  });

  protected readonly levelLabel = computed(() => {
    const l = this.lesson();
    return l ? LEVEL_LABELS[l.meta.level] : '';
  });
  protected readonly badgeClass = computed(() => {
    const l = this.lesson();
    return l ? LEVEL_BADGES[l.meta.level] : 'badge';
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      // Depend on `loaded` so we retry once the manifest arrives.
      this.course.loaded();
      if (slug) void this.loadLesson(slug);
    });
  }

  private async loadLesson(slug: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    await this.course.load();

    const meta = this.course.getBySlug(slug);
    if (!meta) {
      this.lesson.set(null);
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    const lesson = await this.lessonService.loadLesson(meta);
    this.lesson.set(lesson);
    this.progress.setLastOpened(meta.id);
    this.loading.set(false);
  }

  onMarkdownReady(): void {
    const container = this.host.nativeElement.querySelector('.lesson-content');
    if (!container) return;
    this.assignHeadingIds(container);
    this.enhanceFlashcards(container);
  }

  /** marked doesn't emit heading ids; assign them so TOC anchors resolve. */
  private assignHeadingIds(container: Element): void {
    const seen = new Map<string, number>();
    container.querySelectorAll('h1, h2, h3').forEach((el: Element) => {
      const text = (el.textContent ?? '').trim();
      const base = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      el.id = count === 0 ? base : `${base}-${count}`;
    });
  }

  /**
   * Turns the "Flash Cards" markdown section into a grid of interactive flip
   * cards — click/Enter reveals the answer. Handles every Q/A format the
   * lessons use: bulleted (`- **Q:** … **A:** …`), bold paragraphs
   * (`**Q:** …` / `**A:** …`), and plain paragraphs (`Q: …` / `A: …`).
   */
  private enhanceFlashcards(container: Element): void {
    const heading = Array.from(container.querySelectorAll('h1, h2, h3')).find(
      (h) => (h.textContent ?? '').trim().toLowerCase() === 'flash cards',
    );
    if (!heading) return;

    // Gather the section's block elements (up to the next heading) and reduce
    // them to one "unit" per card: a <li> for lists, else a <p>.
    const blocks: Element[] = [];
    const units: Element[] = [];
    for (
      let n = heading.nextElementSibling;
      n && !/^H[1-3]$/.test(n.tagName);
      n = n.nextElementSibling
    ) {
      blocks.push(n);
      if (n.tagName === 'UL' || n.tagName === 'OL') {
        n.querySelectorAll(':scope > li').forEach((li) => units.push(li));
      } else if (n.tagName === 'P') {
        units.push(n);
      }
    }
    if (!units.length) return;

    const grid = document.createElement('div');
    grid.className = 'flashcard-grid';
    for (const unit of units) {
      const card = this.buildFlashcard(unit);
      if (card) grid.appendChild(card);
    }
    if (!grid.childElementCount) return;

    // Swap the original section body for the grid.
    blocks[0].replaceWith(grid);
    blocks.slice(1).forEach((b) => b.remove());
  }

  private buildFlashcard(unit: Element): HTMLElement | null {
    const split = this.splitQuestionAnswer(unit);
    if (!split) return null;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'flashcard';
    card.setAttribute('aria-pressed', 'false');
    card.innerHTML = `
      <span class="flashcard-inner">
        <span class="flashcard-face flashcard-front">
          <span class="flashcard-tag">Q</span>
          <span class="flashcard-body" data-role="q"></span>
          <span class="flashcard-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <path d="M4 4v6h6M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 10a8 8 0 0 0-14.3-3.7M4 14a8 8 0 0 0 14.3 3.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Tap to reveal
          </span>
        </span>
        <span class="flashcard-face flashcard-back">
          <span class="flashcard-tag">A</span>
          <span class="flashcard-body" data-role="a"></span>
        </span>
      </span>`;

    const q = card.querySelector('[data-role="q"]')!;
    const a = card.querySelector('[data-role="a"]')!;
    split.question.forEach((n) => q.appendChild(n));
    split.answer.forEach((n) => a.appendChild(n));
    // Drop a stray leading ": " left when a marker is written `**Q**:`.
    [q, a].forEach((el) => {
      const first = el.firstChild;
      if (first?.nodeType === Node.TEXT_NODE) {
        first.textContent = (first.textContent ?? '').replace(/^[\s:]+/, '');
      }
    });

    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    });
    return card;
  }

  /** Splits one card unit into question/answer node lists (cloned, ready to insert). */
  private splitQuestionAnswer(
    unit: Element,
  ): { question: Node[]; answer: Node[] } | null {
    const kids = Array.from(unit.childNodes);
    const isMarker = (n: Node, letter: string): boolean =>
      n.nodeType === Node.ELEMENT_NODE &&
      (n as Element).tagName === 'STRONG' &&
      new RegExp(`^${letter}\\s*:?$`, 'i').test((n.textContent ?? '').trim());

    // Bold markers: <strong>Q:</strong> … <strong>A:</strong> …
    const aStrong = kids.findIndex((n) => isMarker(n, 'A'));
    if (aStrong !== -1) {
      const qStrong = kids.findIndex((n) => isMarker(n, 'Q'));
      return {
        question: kids.slice(qStrong + 1, aStrong).map((n) => n.cloneNode(true)),
        answer: kids.slice(aStrong + 1).map((n) => n.cloneNode(true)),
      };
    }

    // Plain-text markers: a text node holds "Q: …\nA: …".
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.nodeType !== Node.TEXT_NODE) continue;
      const text = n.textContent ?? '';
      const m = /(^|\n)\s*A\s*:\s*/.exec(text);
      if (!m) continue;

      const before = text.slice(0, m.index);
      const after = text.slice(m.index + m[0].length);
      const question = kids.slice(0, i).map((k) => k.cloneNode(true));
      if (before.trim()) question.push(document.createTextNode(before));
      const answer: Node[] = [];
      if (after) answer.push(document.createTextNode(after));
      kids.slice(i + 1).forEach((k) => answer.push(k.cloneNode(true)));

      const firstText = question.find((k) => k.nodeType === Node.TEXT_NODE);
      if (firstText) {
        firstText.textContent = (firstText.textContent ?? '').replace(/^\s*Q\s*:?\s*/i, '');
      }
      return { question, answer };
    }
    return null;
  }

  toggleComplete(): void {
    const l = this.lesson();
    if (l) this.progress.toggleCompleted(l.meta.id);
  }

  toggleBookmark(): void {
    const l = this.lesson();
    if (l) this.progress.toggleBookmark(l.meta.id);
  }

  goToQuiz(): void {
    const l = this.lesson();
    if (l) void this.router.navigate(['/lesson', l.meta.slug, 'quiz']);
  }
}

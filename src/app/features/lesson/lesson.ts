import {
  ApplicationRef,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  computed,
  createComponent,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';

import { CourseService } from '../../core/services/course.service';
import { LessonService } from '../../core/services/lesson.service';
import { ProgressService } from '../../core/services/progress.service';
import { KIND_CHIPS, KIND_LABELS, Lesson } from '../../core/models/lesson.model';
import { RelatedLessons } from '../../shared/components/related-lessons/related-lessons';
import { Diagram } from '../../shared/diagram/diagram';
import { DiagramSpec, isDiagramKind, parseDiagram } from '../../shared/diagram/diagram-parser';

/** Callout labels (the bold lead-in of a blockquote) → the tone they are drawn in. */
const CALLOUTS: Record<string, string> = {
  'in one line': 'dg-tone-primary',
  tip: 'dg-tone-green',
  note: 'dg-tone-blue',
  'watch out': 'dg-tone-amber',
};

/** Section headings whose bullet list is drawn as a stack of cards, and how. */
const LIST_SECTIONS: Record<string, string[]> = {
  'watch out': ['dg-list', 'dg-list-warn', 'dg-tone-amber'],
  remember: ['dg-list', 'dg-list-remember', 'dg-tone-blue'],
};

@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, MarkdownComponent, RelatedLessons],
  templateUrl: './lesson.html',
})
export class LessonPage {
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly title = inject(Title);
  private readonly lessonService = inject(LessonService);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  protected readonly course = inject(CourseService);
  protected readonly progress = inject(ProgressService);

  protected readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' },
  );

  protected readonly lesson = signal<Lesson | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  protected readonly learned = computed(() => {
    const l = this.lesson();
    return l ? this.progress.isLearned(l.meta.slug) : false;
  });
  protected readonly bookmarked = computed(() => {
    const l = this.lesson();
    return l ? this.progress.isBookmarked(l.meta.slug) : false;
  });
  protected readonly topicTitle = computed(() => {
    const l = this.lesson();
    return l ? (this.course.getTopic(l.meta.topic)?.title ?? '') : '';
  });
  protected readonly kindLabel = computed(() => {
    const l = this.lesson();
    return l ? KIND_LABELS[l.meta.kind] : '';
  });
  protected readonly kindClass = computed(() => {
    const l = this.lesson();
    return l ? KIND_CHIPS[l.meta.kind] : 'badge';
  });

  /** Diagram components mounted into the rendered markdown; destroyed when it re-renders. */
  private diagrams: ComponentRef<Diagram>[] = [];

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (slug) void this.loadLesson(slug);
    });
    inject(DestroyRef).onDestroy(() => this.destroyDiagrams());
  }

  private async loadLesson(slug: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    await this.course.load().catch(() => undefined);
    if (this.slug() !== slug) return; // navigated away while the manifest loaded

    const meta = this.course.getBySlug(slug);
    if (!meta) {
      this.lesson.set(null);
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    const lesson = await this.lessonService.loadLesson(meta);
    if (this.slug() !== slug) return;
    this.lesson.set(lesson);
    this.progress.setLastOpened(meta.slug);
    this.title.setTitle(`${meta.title} · Angular Learn`);
    this.loading.set(false);
  }

  /** ngx-markdown finished rendering: decorate callouts and draw any diagrams. */
  onMarkdownReady(): void {
    const container = this.host.nativeElement.querySelector('.lesson-content');
    if (!container) return;
    this.enhanceCallouts(container);
    this.enhanceTables(container);
    this.enhanceSections(container);
    this.mountDiagrams(container);
  }

  /** Wraps each table in a panel that scrolls sideways on narrow screens. */
  private enhanceTables(root: Element): void {
    root.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('dg-table')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'dg-table';
      table.replaceWith(wrapper);
      wrapper.appendChild(table);
    });
  }

  /** Draws the bullets under "Watch out" and "Remember" as cards, by what they mean. */
  private enhanceSections(root: Element): void {
    root.querySelectorAll('h2').forEach((heading) => {
      const classes = LIST_SECTIONS[(heading.textContent ?? '').trim().toLowerCase()];
      const list = heading.nextElementSibling;
      if (classes && list?.tagName === 'UL') list.classList.add(...classes);
    });
  }

  /** Tags `> **In one line:** …`, `> **Tip:** …` etc. so CSS can colour them. */
  private enhanceCallouts(root: Element): void {
    root.querySelectorAll('blockquote').forEach((quote) => {
      const lead = quote.firstElementChild?.firstElementChild;
      if (lead?.tagName !== 'STRONG') return;
      const label = (lead.textContent ?? '').replace(/[:.]\s*$/, '').trim().toLowerCase();
      const cls = CALLOUTS[label];
      if (cls) quote.classList.add('callout', cls);
    });
  }

  /**
   * Swaps each ```sequence / ```tree / ```flow block for a live <app-diagram>.
   * A block that fails to parse is left as plain code, so a typo never blanks a
   * lesson (the validator catches it before it ships).
   */
  private mountDiagrams(root: Element): void {
    this.destroyDiagrams();

    root.querySelectorAll('pre > code').forEach((code) => {
      const lang = Array.from(code.classList)
        .find((c) => c.startsWith('language-'))
        ?.slice('language-'.length);
      if (!isDiagramKind(lang)) return;

      let spec: DiagramSpec;
      try {
        spec = parseDiagram(lang, code.textContent ?? '');
      } catch {
        return;
      }

      const host = document.createElement('div');
      code.parentElement?.replaceWith(host);
      const ref = createComponent(Diagram, { environmentInjector: this.injector, hostElement: host });
      ref.setInput('spec', spec);
      this.appRef.attachView(ref.hostView);
      this.diagrams.push(ref);
    });
  }

  private destroyDiagrams(): void {
    this.diagrams.forEach((ref) => ref.destroy());
    this.diagrams = [];
  }

  toggleLearned(): void {
    const l = this.lesson();
    if (l) this.progress.toggleLearned(l.meta.slug);
  }

  toggleBookmark(): void {
    const l = this.lesson();
    if (l) this.progress.toggleBookmark(l.meta.slug);
  }
}

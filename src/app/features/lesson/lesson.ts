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

interface TocEntry {
  id: string;
  text: string;
}

/** Turns a heading into a URL-safe id: "Go deeper" → "go-deeper". */
function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

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
  host: { '(window:scroll)': 'onScroll()', '(window:resize)': 'onScroll()' },
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

  /** Every bite in this lesson's topic, A–Z, for the side outline and prev/next. */
  protected readonly topicLessons = computed(() => {
    const l = this.lesson();
    return l ? this.course.byTopic(l.meta.topic) : [];
  });
  protected readonly topicLearned = computed(() => {
    const learned = this.progress.learned();
    return this.topicLessons().filter((l) => l.slug in learned).length;
  });
  private readonly position = computed(() => {
    const slug = this.lesson()?.meta.slug;
    return this.topicLessons().findIndex((l) => l.slug === slug);
  });
  protected readonly prev = computed(() => {
    const i = this.position();
    return i > 0 ? this.topicLessons()[i - 1] : undefined;
  });
  protected readonly next = computed(() => {
    const i = this.position();
    return i >= 0 ? this.topicLessons()[i + 1] : undefined;
  });

  /** The lesson's sections, read from its rendered h2s, for "On this page". */
  protected readonly toc = signal<TocEntry[]>([]);
  protected readonly activeSection = signal<string | null>(null);
  /** 0–100: how far through the article the reader has scrolled. */
  protected readonly readProgress = signal(0);
  private scrollFrame = 0;

  /** Diagram components mounted into the rendered markdown; destroyed when it re-renders. */
  private diagrams: ComponentRef<Diagram>[] = [];

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (slug) void this.loadLesson(slug);
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyDiagrams();
      cancelAnimationFrame(this.scrollFrame);
    });
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
    this.toc.set([]);
    this.activeSection.set(null);
    this.readProgress.set(0);
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
    this.enhanceCode(container);
    this.collectToc(container);
    this.onScroll();
  }

  /** Gives each h2 a stable id and lists them for "On this page". */
  private collectToc(root: Element): void {
    const used = new Set<string>();
    const entries: TocEntry[] = [];
    root.querySelectorAll('h2').forEach((heading) => {
      const text = (heading.textContent ?? '').trim();
      let id = heading.id || slugify(text);
      for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
      used.add(id);
      heading.id = id;
      entries.push({ id, text });
    });
    this.toc.set(entries);
  }

  /** Adds a Copy button to every highlighted code block. */
  private enhanceCode(root: Element): void {
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('code-block')) return;
      const code = pre.querySelector('code');
      if (!code) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.replaceWith(wrapper);
      wrapper.appendChild(pre);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? '');
          button.textContent = 'Copied';
          button.setAttribute('data-copied', '');
        } catch {
          button.textContent = 'Press Ctrl+C';
        }
        setTimeout(() => {
          button.textContent = 'Copy';
          button.removeAttribute('data-copied');
        }, 1600);
      });
      wrapper.appendChild(button);
    });
  }

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(history.state, '', `${location.pathname}${location.search}#${id}`);
  }

  /** Updates the reading bar and the highlighted section, at most once a frame. */
  protected onScroll(): void {
    if (this.scrollFrame) return;
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = 0;
      const article = this.host.nativeElement.querySelector('article');
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const pct = span <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / span) * 100));
      this.readProgress.set(Math.round(pct));

      let active: string | null = this.toc()[0]?.id ?? null;
      for (const entry of this.toc()) {
        const el = document.getElementById(entry.id);
        if (el && el.getBoundingClientRect().top <= 140) active = entry.id;
      }
      this.activeSection.set(active);
    });
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

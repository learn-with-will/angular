import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CourseService } from './course.service';
import { CourseManifest, LessonMeta, letterOf, sortKey } from '../models/lesson.model';

const lesson = (slug: string, title: string, topic = 'signals', related: string[] = []): LessonMeta => ({
  slug, title, topic, kind: 'api', summary: `${title}.`, tags: [], related, minutes: 3, file: `lessons/${slug}.md`,
});

const MANIFEST: CourseManifest = {
  topics: [
    { id: 'signals', title: 'Signals', blurb: '', order: 1, count: 3 },
    { id: 'templates', title: 'Templates', blurb: '', order: 2, count: 2 },
    { id: 'routing', title: 'Routing', blurb: '', order: 3, count: 0 },
  ],
  lessons: [
    lesson('signal', 'signal()', 'signals', ['computed', 'gone']),
    lesson('computed', 'computed()', 'signals', ['signal']),
    lesson('effect', 'effect()', 'signals'),
    lesson('if-block', '@if, @else', 'templates'),
    lesson('two-way', '[(ngModel)] two-way', 'templates'),
  ],
  legacy: [
    { id: 'lesson-08', slug: 'introduction-to-signals', title: 'Introduction to Signals', lessons: ['signal', 'computed'], topic: 'signals' },
    { id: 'lesson-99', slug: 'not-migrated', title: 'Not migrated', lessons: [] },
  ],
};

describe('lesson title helpers', () => {
  it('ignores leading symbols when sorting', () => {
    expect(sortKey('@if, @else')).toBe('if, @else');
    expect(sortKey('[(ngModel)] two-way')).toBe('ngmodel)] two-way');
    expect(sortKey('computed()')).toBe('computed()');
  });

  it('buckets by first letter, digits under #', () => {
    expect(letterOf('@if')).toBe('I');
    expect(letterOf('computed()')).toBe('C');
    expect(letterOf('3 ways to bind')).toBe('#');
  });
});

describe('CourseService', () => {
  let service: CourseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CourseService);
    const loading = service.load();
    TestBed.inject(HttpTestingController).expectOne('content/course-manifest.json').flush(MANIFEST);
    await loading;
  });

  it('lists lessons A–Z, ignoring leading symbols', () => {
    // "[(ngModel)] two-way" sorts under N, between @if (I) and signal() (S).
    expect(service.lessons().map((l) => l.slug)).toEqual(['computed', 'effect', 'if-block', 'two-way', 'signal']);
  });

  it('groups lessons under their letter', () => {
    expect(service.alphabetical().map((g) => g.letter)).toEqual(['C', 'E', 'I', 'N', 'S']);
  });

  it('only exposes topics that have lessons', () => {
    expect(service.topics().map((t) => t.id)).toEqual(['signals', 'templates']);
  });

  it('finds lessons by slug and by topic', () => {
    expect(service.getBySlug('effect')?.title).toBe('effect()');
    expect(service.getBySlug('nope')).toBeUndefined();
    expect(service.byTopic('templates').map((l) => l.slug)).toEqual(['if-block', 'two-way']);
  });

  it('resolves related lessons and skips ones that no longer exist', () => {
    expect(service.related('signal').map((l) => l.slug)).toEqual(['computed']);
    expect(service.related('missing')).toEqual([]);
  });

  describe('sample / random', () => {
    it('returns distinct lessons and honours the count', () => {
      const picked = service.sample(3);
      expect(picked.length).toBe(3);
      expect(new Set(picked.map((l) => l.slug)).size).toBe(3);
    });

    it('prefers lessons that are not learned yet', () => {
      const learned = new Set(['signal', 'computed', 'effect']);
      const picked = service.sample(2, { learned }).map((l) => l.slug).sort();
      expect(picked).toEqual(['if-block', 'two-way']);
    });

    it('falls back to learned lessons when there are not enough new ones', () => {
      const learned = new Set(['signal', 'computed', 'effect', 'if-block']);
      const picked = service.sample(3, { learned }).map((l) => l.slug);
      expect(picked[0]).toBe('two-way');
      expect(picked.length).toBe(3);
    });

    it('can exclude the lesson being read', () => {
      for (let i = 0; i < 20; i++) {
        expect(service.random({ exclude: 'signal' })?.slug).not.toBe('signal');
      }
    });

    it('is deterministic for a given random source', () => {
      const a = service.sample(5, { rng: () => 0.3 }).map((l) => l.slug);
      const b = service.sample(5, { rng: () => 0.3 }).map((l) => l.slug);
      expect(a).toEqual(b);
    });
  });

  describe('legacy', () => {
    it('maps an old slug and id to their entry', () => {
      expect(service.legacyBySlug('introduction-to-signals')?.lessons).toEqual(['signal', 'computed']);
      expect(service.legacyById('lesson-08')?.topic).toBe('signals');
      expect(service.legacyBySlug('nope')).toBeUndefined();
    });

    it('keeps entries that are not migrated yet', () => {
      expect(service.legacyBySlug('not-migrated')?.lessons).toEqual([]);
    });
  });
});

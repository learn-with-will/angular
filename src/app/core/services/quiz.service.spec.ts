import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { QuizService } from './quiz.service';
import {
  BankQuestion,
  FillBlankQuestion,
  MatchPairQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  SingleChoiceQuestion,
} from '../models/quiz.model';

const BANK: BankQuestion[] = [
  { id: 'signals-01', topic: 'signals', type: 'fill-blank', prompt: 'p1', answer: ['computed'] },
  { id: 'signals-02', topic: 'signals', type: 'fill-blank', prompt: 'p2', answer: ['effect'] },
  { id: 'templates-01', topic: 'templates', type: 'fill-blank', prompt: 'p3', answer: ['track'] },
  { id: 'templates-02', topic: 'templates', type: 'fill-blank', prompt: 'p4', answer: ['empty'] },
  { id: 'templates-03', topic: 'templates', type: 'fill-blank', prompt: 'p5', answer: ['as'] },
];

/** Deterministic "random": cycles through the given values. */
const cycle = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe('QuizService', () => {
  let service: QuizService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(QuizService);
    const http = TestBed.inject(HttpTestingController);

    const loading = service.load();
    http.expectOne('quiz/questions.json').flush(BANK);
    await loading;
  });

  describe('load', () => {
    it('exposes the bank and per-topic counts', () => {
      expect(service.bank().length).toBe(5);
      expect(service.countByTopic().get('signals')).toBe(2);
      expect(service.countByTopic().get('templates')).toBe(3);
    });

    it('fetches only once', async () => {
      await service.load();
      TestBed.inject(HttpTestingController).expectNone('quiz/questions.json');
      expect(service.bank().length).toBe(5);
    });
  });

  describe('pick', () => {
    it('quick mode draws from the whole bank without repeats', () => {
      const picked = service.pick({ mode: 'quick', count: 5 });
      expect(picked.length).toBe(5);
      expect(new Set(picked.map((q) => q.id)).size).toBe(5);
    });

    it('never returns more questions than the pool holds', () => {
      expect(service.pick({ mode: 'quick', count: 50 }).length).toBe(5);
    });

    it('topic mode restricts the pool to the chosen topics', () => {
      const picked = service.pick({ mode: 'topic', count: 10, topics: ['signals'] });
      expect(picked.map((q) => q.topic)).toEqual(['signals', 'signals']);

      const both = service.pick({ mode: 'topic', count: 10, topics: ['signals', 'templates'] });
      expect(both.length).toBe(5);
    });

    it('topic mode with no topics falls back to the whole bank', () => {
      expect(service.pick({ mode: 'topic', count: 10, topics: [] }).length).toBe(5);
    });

    it('missed mode draws only from the missed ids', () => {
      const picked = service.pick({ mode: 'missed', count: 10, missed: new Set(['signals-02', 'templates-03']) });
      expect(picked.map((q) => q.id).sort()).toEqual(['signals-02', 'templates-03']);
    });

    it('missed mode with nothing missed returns nothing', () => {
      expect(service.pick({ mode: 'missed', count: 10 })).toEqual([]);
    });

    it('is deterministic for a given random source', () => {
      const a = service.pick({ mode: 'quick', count: 5 }, cycle(0.1, 0.9, 0.4, 0.7));
      const b = service.pick({ mode: 'quick', count: 5 }, cycle(0.1, 0.9, 0.4, 0.7));
      expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    });
  });

  describe('check', () => {
    const single: SingleChoiceQuestion = {
      id: 's', type: 'single-choice', prompt: '', answer: 'b',
      options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
    };
    const multiple: MultipleChoiceQuestion = {
      id: 'm', type: 'multiple-choice', prompt: '', answer: ['a', 'c'],
      options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }],
    };
    const fill: FillBlankQuestion = { id: 'f', type: 'fill-blank', prompt: '', answer: ['asReadonly', '.asReadonly()'] };
    const ordering: OrderingQuestion = {
      id: 'o', type: 'ordering', prompt: '', answer: ['x', 'y', 'z'],
      items: [{ id: 'x', text: 'X' }, { id: 'y', text: 'Y' }, { id: 'z', text: 'Z' }],
    };
    const match: MatchPairQuestion = {
      id: 'p', type: 'match-pair', prompt: '',
      pairs: [{ left: 'signal()', right: 'writable' }, { left: 'computed()', right: 'read-only' }],
    };

    it('grades single choice', () => {
      expect(service.check(single, 'b')).toBeTrue();
      expect(service.check(single, 'a')).toBeFalse();
    });

    it('treats a missing answer as wrong', () => {
      for (const q of [single, multiple, fill, ordering, match]) {
        expect(service.check(q, undefined)).toBeFalse();
      }
    });

    it('grades multiple choice regardless of order, and rejects partial or extra picks', () => {
      expect(service.check(multiple, ['c', 'a'])).toBeTrue();
      expect(service.check(multiple, ['a'])).toBeFalse();
      expect(service.check(multiple, ['a', 'b', 'c'])).toBeFalse();
    });

    it('grades fill-blank case-insensitively after trimming', () => {
      expect(service.check(fill, '  ASREADONLY ')).toBeTrue();
      expect(service.check(fill, '.asReadonly()')).toBeTrue();
      expect(service.check(fill, 'readonly')).toBeFalse();
    });

    it('grades ordering by exact sequence', () => {
      expect(service.check(ordering, ['x', 'y', 'z'])).toBeTrue();
      expect(service.check(ordering, ['x', 'z', 'y'])).toBeFalse();
    });

    it('grades match-pair only when every pair is right', () => {
      expect(service.check(match, { 'signal()': 'writable', 'computed()': 'read-only' })).toBeTrue();
      expect(service.check(match, { 'signal()': 'writable', 'computed()': 'writable' })).toBeFalse();
      expect(service.check(match, { 'signal()': 'writable' })).toBeFalse();
    });
  });

  describe('shuffleOrder', () => {
    it('never returns the correct order for two or more items', () => {
      const correct = ['a', 'b', 'c', 'd'];
      for (let i = 0; i < 50; i++) {
        expect(service.shuffleOrder(correct, correct)).not.toEqual(correct);
      }
    });

    it('keeps every item exactly once', () => {
      const out = service.shuffleOrder(['a', 'b', 'c'], ['a', 'b', 'c']);
      expect([...out].sort()).toEqual(['a', 'b', 'c']);
    });

    it('copes with a single item', () => {
      expect(service.shuffleOrder(['a'], ['a'])).toEqual(['a']);
    });
  });
});

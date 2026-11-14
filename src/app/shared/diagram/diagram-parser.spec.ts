import {
  DiagramError,
  FlowSpec,
  SequenceSpec,
  TreeSpec,
  diagramText,
  isDiagramKind,
  parseDiagram,
  richText,
} from './diagram-parser';

const parse = <T>(kind: string, src: string) => parseDiagram(kind, src) as T;
const failure = (kind: string, src: string): DiagramError => {
  try {
    parseDiagram(kind, src);
  } catch (e) {
    return e as DiagramError;
  }
  throw new Error('expected the diagram to be rejected');
};

describe('diagram parser', () => {
  it('knows the three kinds', () => {
    expect(isDiagramKind('sequence')).toBeTrue();
    expect(isDiagramKind('tree')).toBeTrue();
    expect(isDiagramKind('flow')).toBeTrue();
    expect(isDiagramKind('mermaid')).toBeFalse();
    expect(isDiagramKind(undefined)).toBeFalse();
  });

  it('rejects an unknown kind', () => {
    expect(failure('chart', 'a').message).toContain('unknown diagram kind');
  });

  describe('sequence', () => {
    const SRC = `
      # a comment
      actor user: User | admin or vendor
      actor app: App | runs the page @blue
      actor api: API
      user -> app: Opens the page | shows a button
      app --> user: Replies
      note app..api: Keep a state | single use @amber
      note user: Alone
    `.replace(/^ {6}/gm, '');

    it('reads actors, arrows and notes, numbering every step', () => {
      const s = parse<SequenceSpec>('sequence', SRC);
      expect(s.actors.map((a) => [a.id, a.tone])).toEqual([['user', 'neutral'], ['app', 'blue'], ['api', 'neutral']]);
      expect(s.actors[0].subtitle).toBe('admin or vendor');
      expect(s.steps.map((x) => x.n)).toEqual([1, 2, 3, 4]);

      const [open, reply, span, alone] = s.steps;
      expect(open).toEqual(jasmine.objectContaining({ kind: 'message', from: 0, to: 1, dashed: false, title: 'Opens the page', subtitle: 'shows a button' }));
      expect(reply).toEqual(jasmine.objectContaining({ kind: 'message', from: 1, to: 0, dashed: true }));
      expect(span).toEqual(jasmine.objectContaining({ kind: 'note', from: 1, to: 2, tone: 'amber' }));
      expect(alone).toEqual(jasmine.objectContaining({ kind: 'note', from: 0, to: 0, tone: 'neutral' }));
    });

    it('normalises a note written right to left', () => {
      const s = parse<SequenceSpec>('sequence', 'actor a: A\nactor b: B\nnote b..a: Both');
      expect(s.steps[0]).toEqual(jasmine.objectContaining({ from: 0, to: 1 }));
    });

    it('reports the line of a bad statement', () => {
      const e = failure('sequence', 'actor a: A\nactor b: B\na -> c: Hi');
      expect(e.line).toBe(3);
      expect(e.message).toContain('unknown actor "c"');
    });

    it('rejects arrows to self, late actors, duplicates and unknown tones', () => {
      expect(failure('sequence', 'actor a: A\nactor b: B\na -> a: Hi').message).toContain('two different actors');
      expect(failure('sequence', 'actor a: A\nactor b: B\na -> b: Hi\nactor c: C').message).toContain('before the first step');
      expect(failure('sequence', 'actor a: A\nactor a: B').message).toContain('duplicate actor');
      expect(failure('sequence', 'actor a: A @pink').message).toContain('unknown tone');
      expect(failure('sequence', 'actor a: A\nactor b: B\na -> b: Hi @blue').message).toContain('cannot take a tone');
    });

    it('needs two actors and a step, and respects the size limits', () => {
      expect(failure('sequence', 'actor a: A').message).toContain('at least two actors');
      expect(failure('sequence', 'actor a: A\nactor b: B').message).toContain('at least one step');
      const many = Array.from({ length: 7 }, (_, i) => `actor a${i}: A${i}`).join('\n');
      expect(failure('sequence', `${many}\na0 -> a1: x`).message).toContain('max 6');
    });
  });

  describe('tree', () => {
    const SRC = `
Where the user starts
  In a browser
    On a PC
      [W1] Desktop QR | scan and confirm @blue
    On a phone
      [W2] Mobile browser | switch and back @green
  In the app
    Plain leaf
    `.trim();

    it('builds the hierarchy from indentation', () => {
      const t = parse<TreeSpec>('tree', SRC);
      expect(t.root.title).toBe('Where the user starts');
      expect(t.root.children.map((c) => c.title)).toEqual(['In a browser', 'In the app']);
      const pc = t.root.children[0].children[0];
      expect(pc.title).toBe('On a PC');
      expect(pc.card).toBeFalse();
      expect(pc.children[0]).toEqual(jasmine.objectContaining({ badge: 'W1', card: true, tone: 'blue', subtitle: 'scan and confirm' }));
    });

    it('makes a card of anything with a badge or subtitle, defaulting its tone to blue', () => {
      const t = parse<TreeSpec>('tree', 'Root\n  [!] Warning\n  Titled | with a subtitle\n  Plain');
      expect(t.root.children.map((c) => [c.card, c.tone])).toEqual([[true, 'blue'], [true, 'blue'], [false, 'neutral']]);
    });

    it('rejects bad indentation and structure', () => {
      expect(failure('tree', 'Root\n   odd').message).toContain('steps of two spaces');
      expect(failure('tree', 'Root\n\t tab').message).toContain('tabs');
      expect(failure('tree', 'Root\n    skipped').message).toContain('more than one level');
      expect(failure('tree', 'Root\n  a\nSecond root').message).toContain('exactly one root');
      expect(failure('tree', 'Only a root').message).toContain('at least one child');
    });
  });

  describe('flow', () => {
    it('layers nodes by their longest path from a source', () => {
      const f = parse<FlowSpec>('flow', `
        price: price @primary
        qty: quantity
        total: total | computed @blue
        view: view
        count: count
        price -> total
        qty -> total
        total -> view: re-renders
        qty -> count
      `.replace(/^ {8}/gm, ''));
      expect(f.layers.map((l) => l.map((n) => n.id))).toEqual([['price', 'qty'], ['total', 'count'], ['view']]);
      expect(f.edges).toContain({ from: 'total', to: 'view', label: 're-renders' });
      expect(f.layers[0][0].tone).toBe('primary');
    });

    it('pushes a node right of every one that feeds it', () => {
      const f = parse<FlowSpec>('flow', 'a: A\nb: B\nc: C\na -> b\nb -> c\na -> c');
      expect(f.layers.map((l) => l.map((n) => n.id))).toEqual([['a'], ['b'], ['c']]);
    });

    it('rejects cycles, unknown nodes, self loops and duplicates', () => {
      expect(failure('flow', 'a: A\nb: B\na -> b\nb -> a').message).toContain('cycle');
      expect(failure('flow', 'a: A\nb: B\na -> z').message).toContain('unknown node "z"');
      expect(failure('flow', 'a: A\nb: B\na -> a').message).toContain('itself');
      expect(failure('flow', 'a: A\na: Again\na -> a').message).toContain('duplicate node');
      expect(failure('flow', 'a: A\nb: B').message).toContain('at least one edge');
    });
  });

  describe('text helpers', () => {
    it('splits inline code from plain text', () => {
      expect(richText('Call `count()` now')).toEqual([
        { text: 'Call ', code: false },
        { text: 'count()', code: true },
        { text: ' now', code: false },
      ]);
      expect(richText('plain')).toEqual([{ text: 'plain', code: false }]);
    });

    it('collects every readable string of a diagram', () => {
      const s = parseDiagram('flow', 'a: A | first\nb: B\na -> b: go');
      expect(diagramText(s)).toEqual(['A', 'first', 'B', 'go']);
    });
  });
});

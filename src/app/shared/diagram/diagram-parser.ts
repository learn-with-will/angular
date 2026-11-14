// The lesson diagram language.
//
// Diagrams are optional: use one only when the information really is a sequence
// of steps, a choice, or a dependency graph. A table or a callout is often the
// better visual (see CONTENT_GUIDE.md, "Choose the visual from the shape of the
// information").
//
// A fenced block whose language is `sequence`, `tree` or `flow` is parsed here
// and drawn by <app-diagram>. This file is plain TypeScript with no imports and
// only erasable syntax, so scripts/validate-course.mjs can run it under Node's
// type stripping and report broken diagrams at validate time, not in the browser.
//
// Shared conventions
//   • one statement per line; blank lines and lines starting with `#` are ignored
//   • `Title | subtitle` gives a bold title and a muted second line
//   • a trailing `@tone` colours the box (neutral, primary, blue, green, amber, red)
//   • `inline code` in a title or subtitle is rendered as code
//
// sequence — actors across the top, numbered steps down the page
//   actor user: User | admin or vendor
//   actor app: App | runs the page @blue
//   user -> app: Opens the page | it shows a button     (solid arrow)
//   app --> user: Shows the result                      (dashed reply)
//   note app: Remember the state | single use @amber    (box on one actor)
//   note user..app: Both sides now agree                (box spanning actors)
//
// tree — indentation (two spaces per level) builds a left-to-right decision tree
//   Where the user starts
//     On a PC
//       [W1] Desktop QR | scan and confirm @blue        ([BADGE] or a subtitle makes a card)
//     On a phone
//       [W2] Mobile browser | switch and back @green
//
// flow — a small acyclic graph, laid out in columns from sources to sinks
//   price: price | signal @primary
//   total: total | computed @blue
//   price -> total
//   total -> view: re-renders                           (optional edge label)
//   view: Template | reads total() @green

export const DIAGRAM_KINDS = ['sequence', 'tree', 'flow'] as const;
export type DiagramKind = (typeof DIAGRAM_KINDS)[number];

export const TONES = ['neutral', 'primary', 'blue', 'green', 'amber', 'red'] as const;
export type Tone = (typeof TONES)[number];

export const MAX_ACTORS = 6;
export const MAX_STEPS = 12;
export const MAX_TREE_NODES = 30;
export const MAX_TREE_DEPTH = 5;
export const MAX_FLOW_NODES = 12;

export interface SequenceActor {
  id: string;
  title: string;
  subtitle?: string;
  tone: Tone;
}

export interface SequenceMessage {
  kind: 'message';
  /** 1-based step number shown in the margin. */
  n: number;
  /** Actor indexes: the arrow runs from `from` to `to`. */
  from: number;
  to: number;
  title: string;
  subtitle?: string;
  dashed: boolean;
}

export interface SequenceNote {
  kind: 'note';
  n: number;
  /** Leftmost and rightmost actor index the box covers (inclusive). */
  from: number;
  to: number;
  title: string;
  subtitle?: string;
  tone: Tone;
}

export interface SequenceSpec {
  type: 'sequence';
  actors: SequenceActor[];
  steps: (SequenceMessage | SequenceNote)[];
}

export interface TreeNode {
  title: string;
  badge?: string;
  subtitle?: string;
  tone: Tone;
  /** Cards (with a badge or subtitle) are drawn bigger than plain labels. */
  card: boolean;
  children: TreeNode[];
}

export interface TreeSpec {
  type: 'tree';
  root: TreeNode;
}

export interface FlowNode {
  id: string;
  title: string;
  subtitle?: string;
  tone: Tone;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowSpec {
  type: 'flow';
  /** Columns, left to right; each holds its nodes top to bottom. */
  layers: FlowNode[][];
  edges: FlowEdge[];
}

export type DiagramSpec = SequenceSpec | TreeSpec | FlowSpec;

export class DiagramError extends Error {
  line: number;

  constructor(message: string, line: number) {
    super(line > 0 ? `line ${line}: ${message}` : message);
    this.line = line;
  }
}

export function isDiagramKind(value: string | undefined): value is DiagramKind {
  return (DIAGRAM_KINDS as readonly string[]).includes(value ?? '');
}

/** Parses a diagram block. Throws DiagramError (with a line number) when it is malformed. */
export function parseDiagram(kind: string, source: string): DiagramSpec {
  switch (kind) {
    case 'sequence':
      return parseSequence(source);
    case 'tree':
      return parseTree(source);
    case 'flow':
      return parseFlow(source);
    default:
      throw new DiagramError(`unknown diagram kind "${kind}"`, 0);
  }
}

/** Splits text into plain and `code` segments, for rendering inline code. */
export interface TextSegment {
  text: string;
  code: boolean;
}

export function richText(text: string): TextSegment[] {
  const out: TextSegment[] = [];
  text.split('`').forEach((part, i) => {
    if (part) out.push({ text: part, code: i % 2 === 1 });
  });
  return out;
}

/** Every human-readable string in a diagram, used to estimate reading time. */
export function diagramText(spec: DiagramSpec): string[] {
  const out: string[] = [];
  const add = (title?: string, subtitle?: string) => {
    if (title) out.push(title);
    if (subtitle) out.push(subtitle);
  };
  if (spec.type === 'sequence') {
    spec.actors.forEach((a) => add(a.title, a.subtitle));
    spec.steps.forEach((s) => add(s.title, s.subtitle));
  } else if (spec.type === 'tree') {
    const walk = (n: TreeNode): void => {
      add(n.title, n.subtitle);
      n.children.forEach(walk);
    };
    walk(spec.root);
  } else {
    spec.layers.flat().forEach((n) => add(n.title, n.subtitle));
    spec.edges.forEach((e) => add(e.label));
  }
  return out;
}

// ---------------------------------------------------------------------------
// shared helpers

const ID = '[a-z][a-z0-9-]*';

interface Parts {
  title: string;
  subtitle?: string;
  tone?: Tone;
}

/** Reads `Title | subtitle @tone`. */
function parseParts(text: string, line: number): Parts {
  let rest = text.trim();
  let tone: Tone | undefined;

  const t = /(?:^|\s)@([a-z]+)$/.exec(rest);
  if (t) {
    if (!(TONES as readonly string[]).includes(t[1])) {
      throw new DiagramError(`unknown tone "@${t[1]}" (use ${TONES.join(', ')})`, line);
    }
    tone = t[1] as Tone;
    rest = rest.slice(0, t.index).trim();
  }

  const pieces = rest.split('|').map((s) => s.trim());
  if (pieces.length > 2) throw new DiagramError('at most one "|" (title | subtitle)', line);
  if (!pieces[0]) throw new DiagramError('missing title', line);
  return { title: pieces[0], subtitle: pieces[1] || undefined, tone };
}

/** Yields `[lineNumber, text]` for every non-blank, non-comment line. */
function significantLines(source: string): [number, string][] {
  const out: [number, string][] = [];
  source.split(/\r?\n/).forEach((raw, i) => {
    const text = raw.trimEnd();
    if (text.trim() && !text.trim().startsWith('#')) out.push([i + 1, text]);
  });
  return out;
}

// ---------------------------------------------------------------------------
// sequence

function parseSequence(source: string): SequenceSpec {
  const actors: SequenceActor[] = [];
  const steps: (SequenceMessage | SequenceNote)[] = [];
  const indexOf = (id: string, line: number): number => {
    const i = actors.findIndex((a) => a.id === id);
    if (i === -1) throw new DiagramError(`unknown actor "${id}" (declare it with "actor ${id}: Title")`, line);
    return i;
  };

  for (const [line, text] of significantLines(source)) {
    const t = text.trim();

    const actor = new RegExp(`^actor\\s+(${ID})\\s*:\\s*(.+)$`).exec(t);
    if (actor) {
      if (steps.length) throw new DiagramError('declare every actor before the first step', line);
      if (actors.some((a) => a.id === actor[1])) throw new DiagramError(`duplicate actor "${actor[1]}"`, line);
      const p = parseParts(actor[2], line);
      actors.push({ id: actor[1], title: p.title, subtitle: p.subtitle, tone: p.tone ?? 'neutral' });
      continue;
    }

    const note = new RegExp(`^note\\s+(${ID})(?:\\s*\\.\\.\\s*(${ID}))?\\s*:\\s*(.+)$`).exec(t);
    if (note) {
      const a = indexOf(note[1], line);
      const b = note[2] ? indexOf(note[2], line) : a;
      const p = parseParts(note[3], line);
      steps.push({
        kind: 'note',
        n: steps.length + 1,
        from: Math.min(a, b),
        to: Math.max(a, b),
        title: p.title,
        subtitle: p.subtitle,
        tone: p.tone ?? 'neutral',
      });
      continue;
    }

    const msg = new RegExp(`^(${ID})\\s*(-->|->)\\s*(${ID})\\s*:\\s*(.+)$`).exec(t);
    if (msg) {
      const from = indexOf(msg[1], line);
      const to = indexOf(msg[3], line);
      if (from === to) throw new DiagramError('an arrow needs two different actors (use "note" for a single actor)', line);
      const p = parseParts(msg[4], line);
      if (p.tone) throw new DiagramError('arrows cannot take a tone; use a note', line);
      steps.push({ kind: 'message', n: steps.length + 1, from, to, title: p.title, subtitle: p.subtitle, dashed: msg[2] === '-->' });
      continue;
    }

    throw new DiagramError(`cannot read "${t}" (expected an actor, note or arrow)`, line);
  }

  if (actors.length < 2) throw new DiagramError('a sequence needs at least two actors', 0);
  if (actors.length > MAX_ACTORS) throw new DiagramError(`${actors.length} actors (max ${MAX_ACTORS})`, 0);
  if (steps.length === 0) throw new DiagramError('a sequence needs at least one step', 0);
  if (steps.length > MAX_STEPS) throw new DiagramError(`${steps.length} steps (max ${MAX_STEPS})`, 0);
  return { type: 'sequence', actors, steps };
}

// ---------------------------------------------------------------------------
// tree

function parseTree(source: string): TreeSpec {
  let root: TreeNode | undefined;
  const stack: TreeNode[] = []; // stack[d] is the latest node at depth d
  let count = 0;

  for (const [line, text] of significantLines(source)) {
    if (/^\t/.test(text)) throw new DiagramError('indent with spaces, not tabs', line);
    const indent = text.length - text.trimStart().length;
    if (indent % 2 !== 0) throw new DiagramError('indent in steps of two spaces', line);
    const depth = indent / 2;
    if (depth > MAX_TREE_DEPTH) throw new DiagramError(`nested deeper than ${MAX_TREE_DEPTH} levels`, line);
    if (depth > stack.length) throw new DiagramError('indented more than one level below its parent', line);

    let body = text.trim();
    let badge: string | undefined;
    const b = /^\[([^\]]{1,8})\]\s*(.+)$/.exec(body);
    if (b) {
      badge = b[1];
      body = b[2];
    }
    const p = parseParts(body, line);
    const card = !!badge || !!p.subtitle;
    const node: TreeNode = {
      title: p.title,
      badge,
      subtitle: p.subtitle,
      tone: p.tone ?? (card ? 'blue' : 'neutral'),
      card,
      children: [],
    };

    if (depth === 0) {
      if (root) throw new DiagramError('a tree has exactly one root (indent the other lines)', line);
      root = node;
    } else {
      stack[depth - 1].children.push(node);
    }
    stack.length = depth;
    stack[depth] = node;
    if (++count > MAX_TREE_NODES) throw new DiagramError(`more than ${MAX_TREE_NODES} nodes`, line);
  }

  if (!root) throw new DiagramError('an empty tree', 0);
  if (root.children.length === 0) throw new DiagramError('a tree needs at least one child', 0);
  return { type: 'tree', root };
}

// ---------------------------------------------------------------------------
// flow

function parseFlow(source: string): FlowSpec {
  const nodes: FlowNode[] = [];
  const edges: (FlowEdge & { line: number })[] = [];
  const edgeRe = new RegExp(`^(${ID})\\s*->\\s*(${ID})\\s*(?::\\s*(.+))?$`);
  const nodeRe = new RegExp(`^(${ID})\\s*:\\s*(.+)$`);

  for (const [line, text] of significantLines(source)) {
    const t = text.trim();
    const e = edgeRe.exec(t);
    if (e) {
      edges.push({ from: e[1], to: e[2], label: e[3]?.trim() || undefined, line });
      continue;
    }
    const n = nodeRe.exec(t);
    if (n) {
      if (nodes.some((x) => x.id === n[1])) throw new DiagramError(`duplicate node "${n[1]}"`, line);
      const p = parseParts(n[2], line);
      nodes.push({ id: n[1], title: p.title, subtitle: p.subtitle, tone: p.tone ?? 'neutral' });
      continue;
    }
    throw new DiagramError(`cannot read "${t}" (expected "id: Title" or "a -> b")`, line);
  }

  if (nodes.length < 2) throw new DiagramError('a flow needs at least two nodes', 0);
  if (nodes.length > MAX_FLOW_NODES) throw new DiagramError(`${nodes.length} nodes (max ${MAX_FLOW_NODES})`, 0);
  if (edges.length === 0) throw new DiagramError('a flow needs at least one edge', 0);

  const ids = new Set(nodes.map((n) => n.id));
  for (const e of edges) {
    if (!ids.has(e.from)) throw new DiagramError(`unknown node "${e.from}"`, e.line);
    if (!ids.has(e.to)) throw new DiagramError(`unknown node "${e.to}"`, e.line);
    if (e.from === e.to) throw new DiagramError('a node cannot point to itself', e.line);
  }

  // Layer = length of the longest path from any source; also detects cycles.
  const layerOf = new Map<string, number>();
  const visiting = new Set<string>();
  const layer = (id: string): number => {
    const known = layerOf.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) throw new DiagramError(`a cycle through "${id}" (flows must be acyclic; use a sequence for loops)`, 0);
    visiting.add(id);
    const incoming = edges.filter((e) => e.to === id).map((e) => layer(e.from));
    visiting.delete(id);
    const value = incoming.length ? Math.max(...incoming) + 1 : 0;
    layerOf.set(id, value);
    return value;
  };

  const layers: FlowNode[][] = [];
  for (const n of nodes) {
    const l = layer(n.id);
    (layers[l] ??= []).push(n);
  }
  return {
    type: 'flow',
    layers: layers.filter(Boolean),
    edges: edges.map(({ from, to, label }) => ({ from, to, label })),
  };
}

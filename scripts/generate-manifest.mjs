// Generates public/content/course-manifest.json from the micro-lessons.
//
// Sources (all under public/content):
//   lessons/*.md   one bite per file; YAML front-matter carries the metadata
//   topics.json    the ~14 topics, in display order
//   legacy.json    map from the 35 old long lessons to the bites that replaced them
//
// Output: { topics, lessons, legacy }. `minutes` is computed here from the body
// (never hand-written), and topic counts are filled in. Run: `npm run manifest`.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// The diagram language is TypeScript shared with the app; Node strips the types.
import { DIAGRAM_KINDS, diagramText, parseDiagram } from '../src/app/shared/diagram/diagram-parser.ts';

/** Fence languages that draw a diagram (sequence, tree, flow) instead of showing code. */
export const DIAGRAM_LANGS = new Set(DIAGRAM_KINDS);

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const contentDir = resolve(root, 'public', 'content');
export const lessonsDir = resolve(contentDir, 'lessons');
export const manifestPath = resolve(contentDir, 'course-manifest.json');

/**
 * Reading speed used for the estimate: prose words per minute and code lines per minute.
 * The total is rounded to the nearest minute (not up), so "3 min" means about 2.5–3.5.
 */
const WORDS_PER_MINUTE = 180;
const CODE_LINES_PER_MINUTE = 20;

/** Splits a markdown file into its raw front-matter block and the body after it. */
export function splitFrontMatter(raw) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(raw);
  if (!m) throw new Error('missing front-matter');
  return { block: m[1], body: raw.slice(m[0].length) };
}

/**
 * Minimal YAML subset: `key: scalar`, `key: [a, b]` and block lists (`- item`).
 * Quoted strings are unquoted; trailing ` # comments` on unquoted values are dropped.
 */
export function parseFrontMatter(block) {
  const meta = {};
  const lines = block.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, rest] = kv;
    const value = stripComment(rest.trim());

    if (value === '') {
      const items = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const item = /^\s*-\s+(.*)$/.exec(lines[j]);
        if (!item) break;
        items.push(unquote(stripComment(item[1].trim())));
      }
      meta[key] = items.length ? items : '';
      if (items.length) i = j - 1;
      continue;
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
      continue;
    }
    meta[key] = unquote(value);
  }
  return meta;
}

function stripComment(s) {
  if (s.startsWith('"') || s.startsWith("'")) {
    const end = s.lastIndexOf(s[0]);
    return end > 0 ? s.slice(0, end + 1) : s;
  }
  const m = /\s#.*$/.exec(s);
  return m ? s.slice(0, m.index).trim() : s;
}

function unquote(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/** Blanks every line inside a fenced block (keeping line count) so `#` in code is never a heading. */
export function maskFences(text) {
  let inFence = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? '' : line;
    })
    .join('\n');
}

/** Returns fenced blocks as `{ lang, lines, text }` (lines = number of lines of code). */
export function extractCodeBlocks(body) {
  const blocks = [];
  const lines = body.split('\n');
  let current = null;
  for (const line of lines) {
    const fence = /^\s*```(\S*)/.exec(line);
    if (fence) {
      if (current) {
        blocks.push({ lang: current.lang, lines: current.body.length, text: current.body.join('\n') });
        current = null;
      } else {
        current = { lang: fence[1], body: [] };
      }
      continue;
    }
    if (current) current.body.push(line.replace(/\r$/, ''));
  }
  return blocks;
}

/** Counts words in `text`. Tokens with no letter/digit — table rules, `>`, `->` — are ignored. */
export function countTokens(text) {
  return (text.match(/\S+/g) ?? []).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/** Counts prose words (outside code fences). */
export function countWords(body) {
  return countTokens(maskFences(body));
}

export function estimateMinutes(words, codeLines) {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE));
}

/**
 * Measures a lesson body: words, code lines and the derived reading time.
 * A diagram's labels are read like prose, so they count as words; its markup does not.
 */
export function analyzeBody(body) {
  const blocks = extractCodeBlocks(body);
  let diagramWords = 0;
  for (const b of blocks.filter((b) => DIAGRAM_LANGS.has(b.lang))) {
    try {
      diagramWords += countTokens(diagramText(parseDiagram(b.lang, b.text)).join(' '));
    } catch {
      /* a malformed diagram is reported by the validator */
    }
  }
  const words = countWords(body) + diagramWords;
  const codeLines = blocks
    .filter((b) => !DIAGRAM_LANGS.has(b.lang))
    .reduce((n, b) => n + b.text.split('\n').filter((l) => l.trim()).length, 0);
  return { words, blocks, codeLines, minutes: estimateMinutes(words, codeLines) };
}

export function readJson(name) {
  return JSON.parse(readFileSync(resolve(contentDir, name), 'utf8'));
}

/** Reads every lesson file. Returns `{ file, slug, meta, body, stats }[]` sorted by filename. */
export function readLessonFiles() {
  let files = [];
  try {
    files = readdirSync(lessonsDir).filter((f) => f.endsWith('.md'));
  } catch {
    /* no lessons yet */
  }
  return files.sort().map((file) => {
    const raw = readFileSync(resolve(lessonsDir, file), 'utf8');
    try {
      const { block, body } = splitFrontMatter(raw);
      const meta = parseFrontMatter(block);
      return { file, meta, body, stats: analyzeBody(body), error: null };
    } catch (e) {
      return { file, meta: {}, body: '', stats: null, error: e.message };
    }
  });
}

export function buildManifest() {
  const lessons = readLessonFiles()
    .filter((l) => !l.error)
    .map(({ file, meta, stats }) => {
      const entry = {
        slug: meta.slug,
        title: meta.title,
        topic: meta.topic,
        kind: meta.kind,
        summary: meta.summary,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        related: Array.isArray(meta.related) ? meta.related : [],
        minutes: stats.minutes,
        file: `lessons/${file}`,
      };
      if (meta.since) entry.since = String(meta.since);
      return entry;
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const counts = new Map();
  for (const l of lessons) counts.set(l.topic, (counts.get(l.topic) ?? 0) + 1);
  const topicByLesson = new Map(lessons.map((l) => [l.slug, l.topic]));

  const topics = readJson('topics.json')
    .map((t) => ({ ...t, count: counts.get(t.id) ?? 0 }))
    .sort((a, b) => a.order - b.order);

  const legacy = readJson('legacy.json').map((entry) => {
    const topic = topicByLesson.get(entry.lessons[0]);
    return topic ? { ...entry, topic } : entry;
  });

  return { topics, lessons, legacy };
}

// Only run when invoked directly (not when imported by the validator).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = buildManifest();
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `generate-manifest: ${manifest.lessons.length} lessons, ${manifest.topics.filter((t) => t.count).length} topics → ${manifestPath}`,
  );
}

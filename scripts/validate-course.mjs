// Validates the course before build/ship: micro-lesson rules, manifest sync,
// legacy mapping and the question bank. Exits non-zero (listing every problem)
// if anything is off.
//
//   npm run validate             # migration mode: unmigrated topics/legacy entries are warnings
//   npm run validate -- --strict # release mode: they are errors (used by the deploy workflow)
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DIAGRAM_LANGS,
  buildManifest,
  manifestPath,
  maskFences,
  readJson,
  readLessonFiles,
  root,
} from './generate-manifest.mjs';
import { parseDiagram } from '../src/app/shared/diagram/diagram-parser.ts';

const STRICT = process.argv.includes('--strict');

const KINDS = ['concept', 'api', 'technique', 'pattern', 'pitfall', 'tool'];
const SECTIONS = ['The idea', 'See it', 'Go deeper', 'Watch out', 'Remember'];
const REQUIRED_SECTIONS = ['The idea', 'See it', 'Remember'];
const ALLOWED_FENCES = new Set(['typescript', 'html', 'css', 'bash', 'json', 'text', ...DIAGRAM_LANGS]);
const MAX_WORDS = 700;
const MAX_CODE_BLOCKS = 3; // diagrams (sequence / tree / flow) are counted separately (max 1)
const MAX_CODE_LINES = 25;
// A bite should take 3–5 minutes: long enough to teach the idea properly, short enough to finish in one go.
const MIN_MINUTES = 3;
const MAX_MINUTES = 5;
const EXPECTED_LEGACY = 35;
const MIN_QUESTIONS_PER_TOPIC = 8;
const QUESTION_TYPES = ['single-choice', 'multiple-choice', 'fill-blank', 'ordering', 'match-pair'];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors = [];
const warnings = [];
const fail = (where, msg) => errors.push(`[${where}] ${msg}`);
/** A problem that only blocks a release: a warning while topics are being migrated. */
const pending = (where, msg) => (STRICT ? fail(where, msg) : warnings.push(`[${where}] ${msg}`));

// ---- Topics --------------------------------------------------------------
const topics = readJson('topics.json');
const topicIds = new Set(topics.map((t) => t.id));
if (topicIds.size !== topics.length) fail('topics.json', 'duplicate topic id');
for (const t of topics) {
  for (const key of ['id', 'title', 'blurb', 'order']) {
    if (t[key] === undefined || t[key] === '') fail('topics.json', `${t.id ?? '?'}: missing ${key}`);
  }
}

// ---- Lessons -------------------------------------------------------------
const files = readLessonFiles();
const slugs = new Set();
const titles = new Map();
const lessonBySlug = new Map();

for (const f of files) {
  if (f.error) {
    fail(`lessons/${f.file}`, `front-matter: ${f.error}`);
    continue;
  }
  const where = `lessons/${f.file}`;
  const { meta, body, stats } = f;
  lessonBySlug.set(meta.slug, meta);

  for (const key of ['slug', 'title', 'topic', 'kind', 'summary']) {
    if (!meta[key]) fail(where, `missing front-matter: ${key}`);
  }
  if (meta.slug) {
    if (!SLUG_RE.test(meta.slug)) fail(where, `slug "${meta.slug}" must be kebab-case`);
    if (`${meta.slug}.md` !== f.file) fail(where, `slug "${meta.slug}" != filename`);
    if (slugs.has(meta.slug)) fail(where, `duplicate slug ${meta.slug}`);
    slugs.add(meta.slug);
  }
  if (meta.title) {
    const key = meta.title.toLowerCase();
    if (titles.has(key)) fail(where, `duplicate title "${meta.title}" (also ${titles.get(key)})`);
    titles.set(key, f.file);
    if (!/[A-Za-z0-9]/.test(meta.title)) fail(where, 'title needs at least one letter or digit (used to sort A–Z)');
  }
  if (meta.topic && !topicIds.has(meta.topic)) fail(where, `unknown topic "${meta.topic}"`);
  if (meta.kind && !KINDS.includes(meta.kind)) fail(where, `kind "${meta.kind}" not one of ${KINDS.join('|')}`);
  if (meta.summary) {
    if (meta.summary.length > 160) fail(where, `summary is ${meta.summary.length} chars (max 160)`);
    if (!/[.!?]$/.test(meta.summary.trim())) fail(where, 'summary should end with punctuation');
  }
  if (!Array.isArray(meta.tags) || meta.tags.length < 1 || meta.tags.length > 6)
    fail(where, `tags: need 1–6 (got ${Array.isArray(meta.tags) ? meta.tags.length : 0})`);
  if (!Array.isArray(meta.related) || meta.related.length < 2 || meta.related.length > 4)
    fail(where, `related: need 2–4 slugs (got ${Array.isArray(meta.related) ? meta.related.length : 0})`);
  if (Array.isArray(meta.related) && meta.related.includes(meta.slug)) fail(where, 'related lists itself');
  if (meta.since !== undefined && !/^\d+(\.\d+)?$/.test(String(meta.since)))
    fail(where, `since "${meta.since}" must be a version like "17"`);

  // ---- body rules ----
  const prose = maskFences(body);

  if (/^# .+$/m.test(prose)) fail(where, 'no H1 in the body — the title comes from front-matter');
  if (!/^\s*> \*\*In one line:\*\*/.test(body)) fail(where, 'body must open with the "> **In one line:** …" callout');

  const h2s = [...prose.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
  let last = -1;
  for (const h of h2s) {
    const idx = SECTIONS.indexOf(h);
    if (idx === -1) fail(where, `unknown section "## ${h}" (allowed: ${SECTIONS.join(', ')})`);
    else if (idx < last) fail(where, `section out of order: "## ${h}"`);
    else last = idx;
  }
  for (const s of REQUIRED_SECTIONS) if (!h2s.includes(s)) fail(where, `missing section "## ${s}"`);

  const section = (name) => {
    const m = new RegExp(`^## ${name}\\s*$`, 'm').exec(prose);
    if (!m) return null;
    const rest = prose.slice(m.index + m[0].length);
    const next = /^## .+$/m.exec(rest);
    return next ? rest.slice(0, next.index) : rest;
  };
  const bullets = (text) => (text.match(/^\s{0,1}(?:[-*]|\d+\.)\s+\S/gm) ?? []).length;

  const remember = section('Remember');
  if (remember !== null && bullets(remember) !== 3) fail(where, `"## Remember" needs exactly 3 bullets (got ${bullets(remember)})`);
  const watch = section('Watch out');
  if (watch !== null && (bullets(watch) < 1 || bullets(watch) > 3))
    fail(where, `"## Watch out" needs 1–3 bullets (got ${bullets(watch)})`);

  if (stats.words > MAX_WORDS) fail(where, `${stats.words} words (max ${MAX_WORDS}) — split the lesson`);
  if (stats.minutes > MAX_MINUTES) fail(where, `${stats.minutes} min (max ${MAX_MINUTES}) — split the lesson`);
  if (stats.minutes < MIN_MINUTES)
    fail(where, `${stats.minutes} min (min ${MIN_MINUTES}) — add depth: a second example, a "Go deeper" section, or a diagram`);

  const code = stats.blocks.filter((b) => !DIAGRAM_LANGS.has(b.lang));
  const diagrams = stats.blocks.filter((b) => DIAGRAM_LANGS.has(b.lang));
  for (const d of diagrams) {
    try {
      parseDiagram(d.lang, d.text);
    } catch (e) {
      fail(where, `${d.lang} diagram: ${e.message}`);
    }
  }
  if (code.length > MAX_CODE_BLOCKS) fail(where, `${code.length} code blocks (max ${MAX_CODE_BLOCKS})`);
  if (diagrams.length > 1) fail(where, `${diagrams.length} diagrams (max 1)`);
  if (code.length === 0) fail(where, 'needs at least one code block');
  for (const b of code) {
    if (b.lines > MAX_CODE_LINES) fail(where, `a ${b.lang || 'plain'} code block has ${b.lines} lines (max ${MAX_CODE_LINES})`);
  }
  for (const b of stats.blocks) {
    if (b.lang === '') fail(where, 'code fence without a language');
    else if (!ALLOWED_FENCES.has(b.lang)) fail(where, `disallowed code fence: \`\`\`${b.lang}`);
  }

  // At least one visual element beyond the mandatory "In one line" callout. Which one is up to the
  // author: pick it from the shape of the information (CONTENT_GUIDE.md). A diagram is just one of
  // the accepted forms, never required.
  const hasTable = /^\s*\|.*\|\s*$\n^\s*\|[\s:|-]+\|\s*$/m.test(prose);
  const hasDiagram = diagrams.length > 0;
  const hasCallout = /^\s*> \*\*(?:Tip|Note|Watch out)[:.]?\*\*/m.test(prose);
  const hasBeforeAfter = code.some((b) => /\bBefore\b/.test(b.text) && /\bAfter\b/.test(b.text));
  if (!(hasTable || hasDiagram || hasCallout || hasBeforeAfter))
    fail(
      where,
      'needs at least one visual that fits the information: a table, a Tip/Note/Watch out callout, a Before/After code block, or (when it is a sequence, a choice or a dependency graph) a diagram. See CONTENT_GUIDE.md',
    );
}

// Cross references (needs the full slug set).
for (const f of files) {
  if (f.error) continue;
  for (const r of f.meta.related ?? []) {
    if (!slugs.has(r)) fail(`lessons/${f.file}`, `related "${r}" does not exist`);
  }
}

// ---- Topic coverage ------------------------------------------------------
const lessonsPerTopic = new Map();
for (const m of lessonBySlug.values()) lessonsPerTopic.set(m.topic, (lessonsPerTopic.get(m.topic) ?? 0) + 1);
for (const t of topics) {
  if (!lessonsPerTopic.get(t.id)) pending('topics', `"${t.id}" has no lessons yet`);
}

// ---- Legacy mapping ------------------------------------------------------
const legacy = readJson('legacy.json');
if (legacy.length !== EXPECTED_LEGACY) fail('legacy.json', `expected ${EXPECTED_LEGACY} entries, found ${legacy.length}`);
const legacyIds = new Set();
const legacySlugs = new Set();
for (const e of legacy) {
  for (const key of ['id', 'slug', 'title']) if (!e[key]) fail('legacy.json', `${e.id ?? '?'}: missing ${key}`);
  if (legacyIds.has(e.id)) fail('legacy.json', `duplicate id ${e.id}`);
  if (legacySlugs.has(e.slug)) fail('legacy.json', `duplicate slug ${e.slug}`);
  legacyIds.add(e.id);
  legacySlugs.add(e.slug);
  if (!Array.isArray(e.lessons)) {
    fail('legacy.json', `${e.id}: lessons must be an array`);
    continue;
  }
  if (e.lessons.length === 0) pending('legacy', `${e.id} (${e.slug}) is not migrated yet`);
  for (const s of e.lessons) if (!slugs.has(s)) fail('legacy.json', `${e.id}: lesson "${s}" does not exist`);
}

// ---- Manifest ------------------------------------------------------------
if (!existsSync(manifestPath)) {
  fail('manifest', 'course-manifest.json missing (run `npm run manifest`)');
} else {
  const onDisk = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (JSON.stringify(buildManifest()) !== JSON.stringify(onDisk))
    fail('manifest', 'out of sync with the lessons (run `npm run manifest`)');
}

// ---- Question bank -------------------------------------------------------
const bankPath = resolve(root, 'public', 'quiz', 'questions.json');
let bank = [];
if (!existsSync(bankPath)) {
  fail('quiz', 'public/quiz/questions.json missing');
} else {
  try {
    bank = JSON.parse(readFileSync(bankPath, 'utf8'));
  } catch (e) {
    fail('quiz', `invalid JSON: ${e.message}`);
  }
  if (!Array.isArray(bank)) {
    fail('quiz', 'questions.json must be an array');
    bank = [];
  }
}

const ids = new Set();
const perTopic = new Map();
for (const q of bank) {
  const where = `quiz/${q.id ?? '?'}`;
  if (!q.id || !/^[a-z0-9-]+$/.test(q.id)) fail(where, 'id must be lowercase kebab-case');
  if (ids.has(q.id)) fail(where, 'duplicate question id');
  ids.add(q.id);
  if (!topicIds.has(q.topic)) fail(where, `unknown topic "${q.topic}"`);
  else perTopic.set(q.topic, (perTopic.get(q.topic) ?? 0) + 1);
  if (q.lesson !== undefined) {
    const l = lessonBySlug.get(q.lesson);
    if (!l) fail(where, `lesson "${q.lesson}" does not exist`);
    else if (l.topic !== q.topic) fail(where, `lesson "${q.lesson}" is in topic "${l.topic}", not "${q.topic}"`);
  }
  if (!QUESTION_TYPES.includes(q.type)) fail(where, `bad type "${q.type}"`);
  if (!q.prompt) fail(where, 'missing prompt');
  if (!q.explanation) fail(where, 'missing explanation');
  const optIds = Array.isArray(q.options) ? q.options.map((o) => o.id) : [];
  switch (q.type) {
    case 'single-choice':
      if (!q.options || q.options.length < 2) fail(where, 'needs ≥2 options');
      if (new Set(optIds).size !== optIds.length) fail(where, 'duplicate option id');
      if (!optIds.includes(q.answer)) fail(where, 'answer is not an option id');
      break;
    case 'multiple-choice':
      if (!q.options || q.options.length < 2) fail(where, 'needs ≥2 options');
      if (new Set(optIds).size !== optIds.length) fail(where, 'duplicate option id');
      if (!Array.isArray(q.answer) || q.answer.length < 1) fail(where, 'answer must be a non-empty array');
      else if (!q.answer.every((a) => optIds.includes(a))) fail(where, 'answer has an unknown option id');
      break;
    case 'fill-blank':
      if (!Array.isArray(q.answer) || q.answer.length < 1) fail(where, 'answer must be a non-empty array');
      break;
    case 'ordering': {
      const itemIds = Array.isArray(q.items) ? q.items.map((o) => o.id) : [];
      if (itemIds.length < 2) fail(where, 'needs ≥2 items');
      if (!Array.isArray(q.answer) || q.answer.length !== itemIds.length) fail(where, 'answer must order every item');
      else if ([...q.answer].sort().join() !== [...itemIds].sort().join())
        fail(where, 'answer is not a permutation of the item ids');
      break;
    }
    case 'match-pair':
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) fail(where, 'needs ≥2 pairs');
      else if (!q.pairs.every((p) => p.left && p.right)) fail(where, 'each pair needs left and right');
      // The UI keys rows by `left` and lists every `right` as a dropdown option, so both must be unique.
      else if (new Set(q.pairs.map((p) => p.left)).size !== q.pairs.length) fail(where, 'duplicate left value');
      else if (new Set(q.pairs.map((p) => p.right)).size !== q.pairs.length) fail(where, 'duplicate right value');
      break;
  }
}
for (const t of topics) {
  const n = perTopic.get(t.id) ?? 0;
  if (!lessonsPerTopic.get(t.id)) {
    if (n === 0) pending('quiz', `topic "${t.id}" has no questions yet`);
  } else if (n < MIN_QUESTIONS_PER_TOPIC) {
    fail('quiz', `topic "${t.id}" has ${n} questions (need ≥ ${MIN_QUESTIONS_PER_TOPIC})`);
  }
}

// ---- Report --------------------------------------------------------------
const minutes = files.filter((f) => !f.error).map((f) => f.stats.minutes);
const avg = minutes.length ? (minutes.reduce((a, b) => a + b, 0) / minutes.length).toFixed(1) : '0';

if (warnings.length) {
  console.warn(`\n⚠ ${warnings.length} item(s) still to migrate (errors with --strict):`);
  const shown = warnings.slice(0, 12);
  for (const w of shown) console.warn('  - ' + w);
  if (warnings.length > shown.length) console.warn(`  … and ${warnings.length - shown.length} more`);
}
if (errors.length) {
  console.error(`\n✗ Course validation FAILED with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error('  - ' + e);
  console.error('');
  process.exit(1);
} else {
  console.log(
    `\n✓ Course validation passed${STRICT ? ' (strict)' : ''}: ${files.length} lessons (avg ${avg} min), ${bank.length} questions, ${legacy.length} legacy entries, manifest in sync.\n`,
  );
}

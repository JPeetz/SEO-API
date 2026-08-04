# AEO Engine Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three Answer-Engine-Optimization (AEO) checks to the SEO-API engine in `lib/geo-utils.ts`, expose them via a new `/api/geo/aeo-audit` endpoint, and verify against the BetterLife Woebot post.

**Architecture:** Three pure functions in `lib/geo-utils.ts` (schema validation, Q→A adjacency, direct-answer block), all side-effect-free like the existing engine. A new Next.js API route aggregates them into a combined AEO score. Vitest provides the TDD test harness (repo currently has none).

**Tech Stack:** TypeScript, Next.js 14 (app router), Vitest, Node 26.

---

## File Structure

- `vitest.config.ts` — Vitest config (ESM, TS path alias `@/*`)
- `tests/geo-aeo.test.ts` — TDD tests for the three new functions
- `lib/geo-utils.ts` — MODIFY: add `analyzeSchema`, `analyzeQAPairing`, `analyzeDirectAnswerBlock`, and a `buildAEOScore` aggregator
- `app/api/geo/aeo-audit/route.ts` — CREATE: POST endpoint calling the new functions
- `package.json` — MODIFY: add `test` script + vitest devDependency

---

### Task 1: Set up Vitest test harness

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the test config**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 2: Add test script + devDependency to package.json**

Add to `scripts`: `"test": "vitest run"`.
Add to `devDependencies`: `"vitest": "^2.1.0"`.

- [ ] **Step 3: Install vitest**

Run: `npm install`
Expected: vitest installed, no errors.

---

### Task 2: RED — write failing tests for the three AEO functions

**Files:**
- Create: `tests/geo-aeo.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import {
  analyzeSchema,
  analyzeQAPairing,
  analyzeDirectAnswerBlock,
  buildAEOScore,
} from '@/lib/geo-utils';

const GOOD_FAQ_HTML = `<article>
<h1>Woebot Alternative Guide</h1>
<p>The best Woebot alternative depends on whether you want memory.</p>
<h2>FAQ</h2>
<div class="faq">
<p><strong>Q: What is the best Woebot alternative?</strong></p>
<p>A: Wysa and MindShift CBT are strong options, but BetterLife remembers you across sessions.</p>
<p><strong>Q: Is Woebot still available?</strong></p>
<p>A: No, the consumer app retired on June 30 2025.</p>
</div>
<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type":"Question","name":"What is the best Woebot alternative?","acceptedAnswer":{"@type":"Answer","text":"Wysa and MindShift CBT are strong options."}},
    {"@type":"Question","name":"Is Woebot still available?","acceptedAnswer":{"@type":"Answer","text":"No, the consumer app retired."}}
  ]
}</script>
</article>`;

describe('analyzeSchema', () => {
  it('detects a valid FAQPage schema with matching Q/A pairs', () => {
    const r = analyzeSchema(GOOD_FAQ_HTML);
    expect(r.hasSchema).toBe(true);
    expect(r.schemaTypes).toContain('FAQPage');
    expect(r.valid).toBe(true);
    expect(r.faqQuestionCount).toBe(2);
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it('reports schema absent when content has none', () => {
    const r = analyzeSchema('<p>no schema here at all</p>');
    expect(r.hasSchema).toBe(false);
    expect(r.valid).toBe(false);
  });

  it('flags generic BlogPosting as weaker than FAQPage for AEO', () => {
    const r = analyzeSchema('<script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","headline":"x"}</script>');
    expect(r.schemaTypes).toEqual(['BlogPosting']);
    expect(r.score).toBeLessThan(80);
  });
});

describe('analyzeQAPairing', () => {
  it('counts questions with an answer within close proximity', () => {
    const r = analyzeQAPairing(GOOD_FAQ_HTML);
    expect(r.questionCount).toBeGreaterThanOrEqual(2);
    expect(r.pairedCount).toBeGreaterThanOrEqual(2);
    expect(r.adjacencyScore).toBeGreaterThanOrEqual(80);
  });

  it('scores low when a question has no nearby answer', () => {
    const r = analyzeQAPairing('<p>What is the best Woebot alternative?</p><p>some unrelated filler paragraph.</p><p>more filler.</p><p>a third far away paragraph with no answer.</p>');
    expect(r.pairedCount).toBe(0);
    expect(r.adjacencyScore).toBeLessThan(40);
  });
});

describe('analyzeDirectAnswerBlock', () => {
  it('detects a concise direct answer near the top', () => {
    const r = analyzeDirectAnswerBlock('<article><h1>Title</h1><p>The best Woebot alternative is BetterLife because it remembers you across health, career, and relationships.</p><p>More detail here.</p></article>');
    expect(r.hasDirectAnswer).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(70);
  });

  it('scores low when the opening is a question with no answer', () => {
    const r = analyzeDirectAnswerBlock('<article><h1>Title</h1><p>What is the best Woebot alternative?</p></article>');
    expect(r.hasDirectAnswer).toBe(false);
    expect(r.score).toBeLessThan(40);
  });
});

describe('buildAEOScore', () => {
  it('combines all three dimensions into one score', () => {
    const s = buildAEOScore(GOOD_FAQ_HTML);
    expect(typeof s.composite).toBe('number');
    expect(s.composite).toBeGreaterThanOrEqual(0);
    expect(s.composite).toBeLessThanOrEqual(100);
    expect(s.dimensions).toHaveProperty('schema');
    expect(s.dimensions).toHaveProperty('qaPairing');
    expect(s.dimensions).toHaveProperty('directAnswer');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/geo-aeo.test.ts`
Expected: FAIL — `analyzeSchema`, `analyzeQAPairing`, `analyzeDirectAnswerBlock`, `buildAEOScore` are not exported from `lib/geo-utils.ts`.

---

### Task 3: GREEN — implement the three AEO functions in `lib/geo-utils.ts`

**Files:**
- Modify: `lib/geo-utils.ts` (append at end)

- [ ] **Step 1: Implement the functions**

Append to `lib/geo-utils.ts`:

```ts
// ── AEO — Answer Engine Optimization ────────────────────────────

export interface SchemaAnalysisResult {
  hasSchema: boolean;
  schemaTypes: string[];
  valid: boolean;           // JSON-LD parseable + required fields
  faqQuestionCount: number; // Questions inside FAQPage/QA schema
  score: number;            // 0-100
  issues: string[];
}

export function analyzeSchema(content: string): SchemaAnalysisResult {
  const blocks = content.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  const issues: string[] = [];
  let hasSchema = false;
  let faqQuestionCount = 0;
  const schemaTypes: string[] = [];
  let valid = false;
  let jsonLdCount = 0;

  for (const block of blocks) {
    const raw = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
      const parsed = JSON.parse(raw);
      jsonLdCount++;
      hasSchema = true;
      const type = Array.isArray(parsed['@type']) ? parsed['@type'][0] : parsed['@type'];
      if (type) schemaTypes.push(String(type));
      if (String(type) === 'FAQPage' || String(type) === 'QAPage') {
        const mainEntity = parsed['mainEntity'] || [];
        const entities = Array.isArray(mainEntity) ? mainEntity : [mainEntity];
        faqQuestionCount += entities.filter((e: any) => e && (e['@type'] === 'Question' || (e['@type'] as any) === undefined)).length;
      }
    } catch {
      issues.push('One or more JSON-LD blocks is not valid JSON');
    }
  }

  if (!hasSchema) {
    issues.push('No JSON-LD schema found — add FAQPage or QAPage');
  } else {
    const hasFaq = schemaTypes.includes('FAQPage') || schemaTypes.includes('QAPage');
    valid = jsonLdCount > 0 && (hasFaq || schemaTypes.includes('Article'));
    if (!hasFaq) issues.push('Schema present but no FAQPage/QAPage type — use FAQPage for AEO');
    if (hasFaq && faqQuestionCount === 0) issues.push('FAQPage present but no Question entries found');
  }

  let score = 0;
  if (hasSchema) score += 40;
  if (valid) score += 20;
  if (schemaTypes.includes('FAQPage') || schemaTypes.includes('QAPage')) score += 25;
  if (faqQuestionCount > 0) score += Math.min(15, faqQuestionCount * 5);
  if (issues.length === 0) score += 10;
  score = Math.round(Math.min(100, score));

  return { hasSchema, schemaTypes, valid, faqQuestionCount, score, issues };
}

export interface QAPairingResult {
  questionCount: number;
  pairedCount: number;
  adjacencyScore: number;   // 0-100
  unpaired: string[];
}

export function analyzeQAPairing(content: string): QAPairingResult {
  const sentences = getSentences(content);
  const questionPattern = /\?/;
  const answerMarker = /(^|\s)(a:|the answer is|answer:|yes|no|it depends|that depends)/i;
  let questionCount = 0;
  let pairedCount = 0;
  const unpaired: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    if (!questionPattern.test(sentences[i])) continue;
    questionCount++;
    const window = sentences.slice(i + 1, i + 4).join(' ');
    const isList = /^\s*[-*]\s/.test(sentences[i + 1] || '');
    if (answerMarker.test(window) || isList || /\b(?:because|it is|that is)\b/i.test(window)) {
      pairedCount++;
    } else {
      unpaired.push(sentences[i].slice(0, 60));
    }
  }

  const adjacencyScore = questionCount > 0
    ? Math.round((pairedCount / questionCount) * 100)
    : 0;

  return { questionCount, pairedCount, adjacencyScore, unpaired };
}

export interface DirectAnswerResult {
  hasDirectAnswer: boolean;
  answerPreview: string;
  wordCount: number;
  score: number;            // 0-100
}

export function analyzeDirectAnswerBlock(content: string): DirectAnswerResult {
  // Look at the first 2 sentences after the H1 for a concise declarative answer.
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const bodyAfterH1 = h1Match ? content.slice(h1Match.index! + h1Match[0].length) : content;
  const sentences = getSentences(bodyAfterH1).slice(0, 2).join(' ');
  const wordCount = getWords(sentences).length;
  const isQuestion = /\?/.test(bodyAfterH1.split(/[.!?]+/)[0] || '');

  const isDeclarative = !isQuestion && wordCount >= 8 && wordCount <= 60;
  const hasDirectAnswer = isDeclarative;

  let score = 0;
  if (hasDirectAnswer) score += 60;
  if (wordCount >= 10 && wordCount <= 60) score += 20;
  if (!isQuestion) score += 10;
  if (/\b(because|is|are|the|best|most)\b/i.test(sentences)) score += 10;
  score = Math.round(Math.min(100, score));

  return { hasDirectAnswer, answerPreview: sentences.slice(0, 200), wordCount, score };
}

export interface AEOScoreResult {
  composite: number;                 // 0-100
  rating: 'poor' | 'moderate' | 'good' | 'excellent';
  dimensions: {
    schema: number;
    qaPairing: number;
    directAnswer: number;
  };
  gaps: string[];
}

export function buildAEOScore(content: string): AEOScoreResult {
  const schema = analyzeSchema(content);
  const qa = analyzeQAPairing(content);
  const direct = analyzeDirectAnswerBlock(content);

  const dimensions = {
    schema: schema.score,
    qaPairing: qa.adjacencyScore,
    directAnswer: direct.score,
  };
  const composite = Math.round((dimensions.schema + dimensions.qaPairing + dimensions.directAnswer) / 3);
  const rating: AEOScoreResult['rating'] =
    composite >= 80 ? 'excellent' : composite >= 60 ? 'good' : composite >= 40 ? 'moderate' : 'poor';

  const gaps: string[] = [];
  if (schema.score < 60) gaps.push(...schema.issues);
  if (qa.adjacencyScore < 60) gaps.push('Some questions lack an answer in close proximity — tighten Q/A pairing');
  if (direct.score < 60) gaps.push('No concise direct answer block under the H1 — add one');

  return { composite, rating, dimensions, gaps };
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/geo-aeo.test.ts`
Expected: PASS (all tests).

---

### Task 4: GREEN — add the AEO audit API route

**Files:**
- Create: `app/api/geo/aeo-audit/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { buildAEOScore } from '@/lib/geo-utils';
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

  try {
    const { content } = await req.json();
    if (!content || typeof content !== 'string')
      return NextResponse.json({ error: '`content` (string) is required' }, { status: 400 });
    return NextResponse.json({ success: true, data: buildAEOScore(content) });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
```

- [ ] **Step 2: Verify full build + tests**

Run: `npm run build && npx vitest run`
Expected: build exit 0, all tests pass, `/api/geo/aeo-audit` appears in route table.

- [ ] **Step 3: Commit**

```bash
git add lib/geo-utils.ts app/api/geo/aeo-audit/route.ts tests/geo-aeo.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: add AEO audit engine (schema validation, Q/A pairing, direct-answer block)"
```

---

### Task 5: Deploy + verify against Woebot post

**Files:**
- Deploy: `vercel --prod --yes`
- Verify: curl the new endpoint with the Woebot post body.

- [ ] **Step 1: Deploy**

Run: `vercel --prod --yes`

- [ ] **Step 2: Verify live**

Run a POST to `https://seo-api-nu.vercel.app/api/geo/aeo-audit` with the Woebot post HTML body and an `X-API-Key`.
Expected: HTTP 200, JSON with `composite`, `rating`, `dimensions`, `gaps`.

- [ ] **Step 3: Update workflow docs**

Note the new `/api/geo/aeo-audit` endpoint in the nightly blog prompt (Step 5.5) and the `social-growth-campaign` skill as an additional GEO/AEO gate (target `composite >= 60`, i.e. `good` or `excellent`).

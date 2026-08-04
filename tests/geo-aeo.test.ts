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

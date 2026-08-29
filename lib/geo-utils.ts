// ─────────────────────────────────────────────────────────────
//  lib/geo-utils.ts  —  Generative Engine Optimization engine
//  Pure computation. No LLM calls. No external dependencies.
// ─────────────────────────────────────────────────────────────

import { getWords, getSentences } from './seo-utils';

// ── Entity Density ────────────────────────────────────────────

export interface EntityDensityResult {
  totalWords: number;
  namedEntityCount: number;
  statisticCount: number;
  factMarkerCount: number;
  citationMarkerCount: number;
  dateReferenceCount: number;
  entityDensityPer100: number;   // named entities per 100 words
  statDensityPer100: number;     // statistics per 100 words
  score: number;                 // 0–100
  rating: 'low' | 'moderate' | 'good' | 'strong';
  topEntities: string[];
}

const CITATION_MARKERS = [
  'according to','research shows','studies show','study found','data shows',
  'survey found','report found','experts say','researchers found','evidence shows',
  'statistics show','analysis shows','findings show','published in','cited by',
];

const FACT_MARKERS = [
  ' is ',' are ',' was ',' were ',' means ',' refers to ',' defined as ',
  ' consists of ',' includes ',' contains ',' equals ',' represents ',
];

export function analyzeEntityDensity(content: string): EntityDensityResult {
  const words = getWords(content);
  const sentences = getSentences(content);
  const totalWords = words.length;
  const lower = content.toLowerCase();

  // Named entities: capitalized words not at sentence start, not stopwords
  const stopwords = new Set(['The','A','An','In','On','At','To','For','Of','And','Or','But','Is','Are','Was','Were','It','Its','This','That','I','We','You','He','She','They']);
  const namedEntities: string[] = [];
  const entitySet = new Set<string>();

  sentences.forEach(sent => {
    const sentWords = sent.trim().split(/\s+/);
    sentWords.slice(1).forEach(w => {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (clean.length > 2 && /^[A-Z]/.test(clean) && !stopwords.has(clean)) {
        entitySet.add(clean);
        namedEntities.push(clean);
      }
    });
  });

  // Statistics: numbers with context (%, $, numbers followed by units)
  const statMatches = content.match(/\b\d+(?:\.\d+)?(?:\s*%|\s*percent|\s*million|\s*billion|\s*thousand|\s*x|\s*times|\s*kb|\s*mb|\s*gb|\s*ms|\s*px|\s*rpm|\s*usd|\s*\$)/gi) || [];
  const rawNumbers = content.match(/\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|\d{4}|\d{1,3}(?:,\d{3})+)\b/gi) || [];

  const statisticCount = statMatches.length + Math.floor(rawNumbers.length * 0.4);

  // Fact markers
  const factMarkerCount = FACT_MARKERS.reduce((sum, m) => {
    return sum + (lower.split(m).length - 1);
  }, 0);

  // Citation markers
  const citationMarkerCount = CITATION_MARKERS.reduce((sum, m) => {
    return sum + (lower.includes(m) ? 1 : 0);
  }, 0);

  // Date references
  const dateMatches = content.match(/\b(?:19|20)\d{2}\b|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi) || [];
  const dateReferenceCount = dateMatches.length;

  const namedEntityCount = namedEntities.length;
  const entityDensityPer100 = totalWords > 0 ? parseFloat(((namedEntityCount / totalWords) * 100).toFixed(2)) : 0;
  const statDensityPer100 = totalWords > 0 ? parseFloat(((statisticCount / totalWords) * 100).toFixed(2)) : 0;

  // Score: weight each signal
  let score = 0;
  score += Math.min(30, entityDensityPer100 * 5);
  score += Math.min(25, statDensityPer100 * 8);
  score += Math.min(25, factMarkerCount * 5);
  score += Math.min(20, citationMarkerCount * 7);
  score = Math.round(Math.min(100, score));

  const rating = score >= 75 ? 'strong' : score >= 50 ? 'good' : score >= 25 ? 'moderate' : 'low';

  return {
    totalWords,
    namedEntityCount,
    statisticCount,
    factMarkerCount,
    citationMarkerCount,
    dateReferenceCount,
    entityDensityPer100,
    statDensityPer100,
    score,
    rating,
    topEntities: Array.from(entitySet).slice(0, 10),
  };
}

// ── Answer Structure ──────────────────────────────────────────

export interface AnswerStructureResult {
  questionCount: number;
  definitionCount: number;
  stepPatternCount: number;
  conclusionMarkerCount: number;
  directAnswerCount: number;
  listDensity: number;           // % of sentences that are list-like
  avgSentenceLength: number;
  score: number;                 // 0–100
  rating: 'poor' | 'moderate' | 'good' | 'excellent';
  strengths: string[];
  gaps: string[];
}

const STEP_PATTERNS = [
  /^(step\s+\d+|first|second|third|fourth|fifth|finally|lastly|next|then)\b/i,
  /^\d+\.\s/,
  /^-\s|^\*\s/,
];

const CONCLUSION_MARKERS = [
  'in summary','in conclusion','to summarize','to conclude','in short',
  'the bottom line','takeaway','key takeaway','overall','ultimately',
  'in other words','to put it simply','the main point',
];

const DIRECT_ANSWER_PATTERNS = [
  'the answer is','the key is','the reason is','this means','this is because',
  'here\'s how','here\'s why','the best way','the simplest way','to do this',
];

const DEFINITION_PATTERNS = [
  / is a /i, / is an /i, / is the /i, / refers to /i,
  / is defined as /i, / means /i, / is when /i,
];

export function analyzeAnswerStructure(content: string): AnswerStructureResult {
  const sentences = getSentences(content);
  const lower = content.toLowerCase();
  const totalSentences = sentences.length;

  const questionCount = (content.match(/\?/g) || []).length;

  const definitionCount = DEFINITION_PATTERNS.reduce((sum, p) => {
    return sum + (content.match(p) || []).length;
  }, 0);

  let stepPatternCount = 0;
  let listLikeSentences = 0;
  sentences.forEach(s => {
    const trimmed = s.trim();
    if (STEP_PATTERNS.some(p => p.test(trimmed))) {
      stepPatternCount++;
      listLikeSentences++;
    }
  });

  const listDensity = totalSentences > 0
    ? parseFloat(((listLikeSentences / totalSentences) * 100).toFixed(1))
    : 0;

  const conclusionMarkerCount = CONCLUSION_MARKERS.reduce((sum, m) => {
    return sum + (lower.includes(m) ? 1 : 0);
  }, 0);

  const directAnswerCount = DIRECT_ANSWER_PATTERNS.reduce((sum, m) => {
    return sum + (lower.includes(m) ? 1 : 0);
  }, 0);

  const words = getWords(content);
  const avgSentenceLength = totalSentences > 0
    ? parseFloat((words.length / totalSentences).toFixed(1))
    : 0;

  // Score
  let score = 0;
  if (questionCount > 0)         score += Math.min(20, questionCount * 7);
  if (definitionCount > 0)       score += Math.min(20, definitionCount * 8);
  if (stepPatternCount > 0)      score += Math.min(20, stepPatternCount * 5);
  if (conclusionMarkerCount > 0) score += Math.min(20, conclusionMarkerCount * 10);
  if (directAnswerCount > 0)     score += Math.min(20, directAnswerCount * 8);
  score = Math.round(Math.min(100, score));

  const rating = score >= 80 ? 'excellent' : score >= 55 ? 'good' : score >= 30 ? 'moderate' : 'poor';

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (questionCount > 0)         strengths.push(`${questionCount} question(s) — helps match user queries`);
  else                           gaps.push('No questions detected — add FAQ-style subheadings');
  if (definitionCount > 0)       strengths.push(`${definitionCount} definition(s) — AI engines extract these directly`);
  else                           gaps.push('No definitions — add "X is..." patterns for AI extraction');
  if (stepPatternCount > 0)      strengths.push(`${stepPatternCount} step/list pattern(s) — high citation value`);
  else                           gaps.push('No step/list patterns — structured lists increase citation likelihood');
  if (conclusionMarkerCount > 0) strengths.push('Conclusion marker present — good for AI summarisation');
  else                           gaps.push('No conclusion/summary section — add a TL;DR or summary block');
  if (directAnswerCount > 0)     strengths.push(`${directAnswerCount} direct answer pattern(s) — matches AI snippet extraction`);
  else                           gaps.push('No direct answer patterns — add "The answer is..." style sentences');

  return {
    questionCount, definitionCount, stepPatternCount,
    conclusionMarkerCount, directAnswerCount, listDensity,
    avgSentenceLength, score, rating, strengths, gaps,
  };
}

// ── Quotability ───────────────────────────────────────────────

export interface QuotableSentence {
  text: string;
  score: number;
  reasons: string[];
}

export interface QuotabilityResult {
  compositeScore: number;        // 0–100
  rating: 'low' | 'moderate' | 'good' | 'strong';
  topSentences: QuotableSentence[];
  totalSentencesAnalyzed: number;
  avgQuotabilityScore: number;
}

const POWER_WORDS = [
  'critical','essential','key','crucial','important','significant','major',
  'primary','fundamental','core','central','vital','definitive','proven',
  'research','data','evidence','study','analysis','insight','finding',
];

export function analyzeQuotability(content: string): QuotabilityResult {
  const sentences = getSentences(content);
  const scored: QuotableSentence[] = [];

  sentences.forEach(raw => {
    const text = raw.trim();
    if (text.split(' ').length < 5) return;

    const words = text.split(/\s+/);
    const wordCount = words.length;
    const lower = text.toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    // Optimal quotable length: 10–35 words
    if (wordCount >= 10 && wordCount <= 35) { score += 25; reasons.push('optimal length'); }
    else if (wordCount < 10)               { score -= 10; }
    else                                   { score += 10; }

    // Contains a statistic
    if (/\d+(?:\.\d+)?(?:\s*%|\s*x\b|\s*times|\s*million|\s*billion)/.test(text)) {
      score += 30; reasons.push('contains statistic');
    }

    // Has power words
    const powerHits = POWER_WORDS.filter(w => lower.includes(w));
    if (powerHits.length > 0) { score += Math.min(20, powerHits.length * 8); reasons.push(`power words: ${powerHits.slice(0,2).join(', ')}`); }

    // Starts with subject (not filler)
    if (!/^(it|this|that|there|these|those|here)\b/i.test(text)) {
      score += 10; reasons.push('clear subject opening');
    }

    // Makes a clear assertion (no hedging)
    if (!/\b(might|maybe|perhaps|possibly|could be|seems to|appears to)\b/i.test(text)) {
      score += 10; reasons.push('assertive');
    }

    // Contains a definition pattern
    if (/ is (a|an|the) /i.test(text) || / refers to /i.test(text)) {
      score += 15; reasons.push('definition pattern');
    }

    scored.push({ text, score: Math.max(0, Math.min(100, score)), reasons });
  });

  scored.sort((a, b) => b.score - a.score);

  const totalSentencesAnalyzed = scored.length;
  const avgQuotabilityScore = totalSentencesAnalyzed > 0
    ? parseFloat((scored.reduce((s, x) => s + x.score, 0) / totalSentencesAnalyzed).toFixed(1))
    : 0;

  const compositeScore = Math.round(
    totalSentencesAnalyzed > 0
      ? Math.min(100, (scored.slice(0, 5).reduce((s, x) => s + x.score, 0) / 5))
      : 0
  );

  const rating = compositeScore >= 70 ? 'strong' : compositeScore >= 50 ? 'good' : compositeScore >= 30 ? 'moderate' : 'low';

  return {
    compositeScore,
    rating,
    topSentences: scored.slice(0, 5),
    totalSentencesAnalyzed,
    avgQuotabilityScore,
  };
}

// ── E-E-A-T Signals ───────────────────────────────────────────

export interface EEATResult {
  experienceScore: number;       // 0–100
  expertiseScore: number;
  authorityScore: number;
  trustScore: number;
  compositeScore: number;
  rating: 'weak' | 'moderate' | 'good' | 'strong';
  signals: {
    experience: string[];
    expertise: string[];
    authority: string[];
    trust: string[];
  };
  gaps: string[];
}

const EXPERIENCE_MARKERS = [
  "i've","i have","we've","we have","in my experience","in our experience",
  "i found","we found","i tested","we tested","i tried","when i","when we",
  "i noticed","we noticed","i recommend","i use","we use",
];

const EXPERTISE_TERMS = [
  'algorithm','implementation','architecture','framework','protocol','methodology',
  'infrastructure','configuration','optimisation','optimization','latency','throughput',
  'deployment','integration','pipeline','workflow','schema','endpoint','api',
  'vector','embedding','inference','fine-tuning','token','context window',
];

const AUTHORITY_MARKERS = [
  'research shows','study shows','according to','published','peer-reviewed',
  'journal','university','institute','findings','data indicates','survey of',
  'analysis of','based on','source','cite','reference',
];

const TRUST_SIGNALS = [
  'however','although','while','on the other hand','it depends','in some cases',
  'not always','exceptions','limitations','caveat','note that','important to note',
  'disclaimer','updated','last updated','verified',
];

export function analyzeEEAT(content: string): EEATResult {
  const lower = content.toLowerCase();
  const words = getWords(content);
  const totalWords = words.length;

  const expHits = EXPERIENCE_MARKERS.filter(m => lower.includes(m));
  const expScore = Math.round(Math.min(100, expHits.length * 15));

  const expTermHits = EXPERTISE_TERMS.filter(t => lower.includes(t));
  const expTermScore = Math.round(Math.min(100, expTermHits.length * 8));

  const authHits = AUTHORITY_MARKERS.filter(m => lower.includes(m));
  const authScore = Math.round(Math.min(100, authHits.length * 12));

  const trustHits = TRUST_SIGNALS.filter(m => lower.includes(m));
  const trustScore = Math.round(Math.min(100, trustHits.length * 10));

  const compositeScore = Math.round((expScore + expTermScore + authScore + trustScore) / 4);
  const rating = compositeScore >= 75 ? 'strong' : compositeScore >= 50 ? 'good' : compositeScore >= 25 ? 'moderate' : 'weak';

  const gaps: string[] = [];
  if (expScore < 30)     gaps.push('Add first-hand experience language ("I tested", "we found", "in our experience")');
  if (expTermScore < 30) gaps.push('Increase domain-specific technical vocabulary to signal expertise');
  if (authScore < 30)    gaps.push('Add authoritative citations ("research shows", "according to [source]")');
  if (trustScore < 30)   gaps.push('Add nuance and caveats ("however", "it depends", "note that") to build trust signals');

  return {
    experienceScore: expScore,
    expertiseScore: expTermScore,
    authorityScore: authScore,
    trustScore,
    compositeScore,
    rating,
    signals: {
      experience: expHits.slice(0, 5),
      expertise: expTermHits.slice(0, 5),
      authority: authHits.slice(0, 5),
      trust: trustHits.slice(0, 5),
    },
    gaps,
  };
}

// ── Evaluation Prompt Builder ─────────────────────────────────

export interface EvaluationPromptResult {
  systemPrompt: string;
  userPrompt: string;
  expectedOutputSchema: object;
  tokensEstimate: number;
}

export function buildEvaluationPrompt(
  content: string,
  targetQuery: string,
  priorSignals?: {
    entityDensity?: EntityDensityResult;
    answerStructure?: AnswerStructureResult;
    quotability?: QuotabilityResult;
    eeat?: EEATResult;
  }
): EvaluationPromptResult {
  const signalsSummary = priorSignals ? `
## Pre-computed Algorithmic Signals
- Entity density score: ${priorSignals.entityDensity?.score ?? 'not computed'}/100 (${priorSignals.entityDensity?.rating ?? 'n/a'})
- Answer structure score: ${priorSignals.answerStructure?.score ?? 'not computed'}/100 (${priorSignals.answerStructure?.rating ?? 'n/a'})
- Quotability score: ${priorSignals.quotability?.compositeScore ?? 'not computed'}/100 (${priorSignals.quotability?.rating ?? 'n/a'})
- E-E-A-T composite: ${priorSignals.eeat?.compositeScore ?? 'not computed'}/100 (${priorSignals.eeat?.rating ?? 'n/a'})
- Top quotable sentence: "${priorSignals.quotability?.topSentences?.[0]?.text ?? 'none'}"
- Identified gaps: ${[...(priorSignals.answerStructure?.gaps ?? []), ...(priorSignals.eeat?.gaps ?? [])].join('; ') || 'none'}
` : '';

  const systemPrompt = `You are a GEO (Generative Engine Optimization) evaluator. Your job is to assess how likely a piece of content is to be cited by AI systems such as ChatGPT, Perplexity, Google AI Overviews, and Claude when answering user queries.

You evaluate content across six dimensions and return a structured JSON assessment. You must be critical and specific. Vague praise is useless — concrete, actionable findings only.

Return ONLY valid JSON matching the schema provided. No preamble, no markdown fences, no explanation outside the JSON object.`;

  const userPrompt = `## Target Query
"${targetQuery}"

## Content to Evaluate
${content}
${signalsSummary}

## Evaluation Task
Score this content on each dimension from 0–100. Then produce a composite citation likelihood score.

Return this exact JSON structure:
{
  "citationLikelihood": <number 0-100>,
  "dimensions": {
    "factualDensity": <number 0-100>,
    "answerDirectness": <number 0-100>,
    "authoritySignals": <number 0-100>,
    "uniqueInsight": <number 0-100>,
    "structuralClarity": <number 0-100>,
    "queryAlignment": <number 0-100>
  },
  "topStrengths": [<string>, <string>, <string>],
  "topIssues": [<string>, <string>, <string>],
  "rewriteInstructions": [<string>],
  "verdict": "cite-ready" | "needs-work" | "not-citable"
}

## Dimension Definitions
- factualDensity: Density of verifiable facts, statistics, named entities, and specific data points
- answerDirectness: How directly and completely the content answers the target query without burying the answer
- authoritySignals: E-E-A-T markers — experience, expertise, citations, credibility
- uniqueInsight: Original analysis, novel framing, or non-obvious information not found on every generic page
- structuralClarity: Use of headers, lists, definitions, step patterns that AI engines can extract and re-format
- queryAlignment: Semantic match between the content's core claims and how a user would phrase the target query

## Verdict Thresholds
- cite-ready: citationLikelihood >= 75
- needs-work: citationLikelihood 40–74
- not-citable: citationLikelihood < 40`;

  const tokensEstimate = Math.round((systemPrompt.length + userPrompt.length) / 4);

  const expectedOutputSchema = {
    citationLikelihood: 'number 0–100',
    dimensions: {
      factualDensity: 'number 0–100',
      answerDirectness: 'number 0–100',
      authoritySignals: 'number 0–100',
      uniqueInsight: 'number 0–100',
      structuralClarity: 'number 0–100',
      queryAlignment: 'number 0–100',
    },
    topStrengths: ['string', 'string', 'string'],
    topIssues: ['string', 'string', 'string'],
    rewriteInstructions: ['string'],
    verdict: '"cite-ready" | "needs-work" | "not-citable"',
  };

  return { systemPrompt, userPrompt, expectedOutputSchema, tokensEstimate };
}

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
  // Split keeping sentence-ending punctuation so question clauses keep their '?'
  const clauses = content.split(/(?<=[.!?])\s*/).map(c => c.trim()).filter(c => c.length > 0);
  let questionCount = 0;
  let pairedCount = 0;
  const unpaired: string[] = [];

  for (let i = 0; i < clauses.length; i++) {
    if (!/\?/.test(clauses[i])) continue;
    questionCount++;
    const nxt = clauses[i + 1] || '';
    const window = clauses.slice(i + 1, i + 4).join(' ');
    const isList = /^\s*[-*]\s/.test(nxt);
    if (/a:|the answer is|answer:|yes,|no,|it depends|that depends|because|it is|that is/i.test(window) || isList) {
      pairedCount++;
    } else {
      unpaired.push(clauses[i].slice(0, 60));
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

// ── Crowd-sourced from geo-seo-claude (MIT) — block-level AI citability scorer ──
export interface CitabilityDimension {
  answer_block_quality: number;
  self_containment: number;
  structural_readability: number;
  statistical_density: number;
  uniqueness_signals: number;
}
export interface CitabilityBlock {
  heading: string | null;
  word_count: number;
  total_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  breakdown: CitabilityDimension;
  preview: string;
}
export interface CitabilityResult {
  blocks_analyzed: number;
  average_citability: number;
  grade_distribution: Record<string, number>;
  optimal_length_blocks: number;
  best_block: CitabilityBlock | null;
  worst_block: CitabilityBlock | null;
  all_blocks: CitabilityBlock[];
}

function splitBlocks(content: string): Array<{ heading: string | null; text: string }> {
  const blocks: Array<{ heading: string | null; text: string }> = [];
  let curHeading: string | null = null;
  let paras: string[] = [];
  for (const line of content.split('\n')) {
    const s = line.trim();
    if (/^#{1,4}\s/.test(s)) {
      if (paras.length) blocks.push({ heading: curHeading, text: paras.join(' ') });
      curHeading = s.replace(/^#+\s*/, '');
      paras = [];
    } else if (s) paras.push(s);
  }
  if (paras.length) blocks.push({ heading: curHeading, text: paras.join(' ') });
  return blocks.filter(b => b.text.split(/\s+/).length >= 20);
}

function scorePassageText(text: string, heading: string | null): CitabilityBlock {
  const words = text.split(/\s+/);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(Boolean);

  // 1) Answer block quality (30)
  let abq = 0;
  if (/(\w+\s+is\s+(?:a|an|the)\s|\w+\s+refers?\s+to\s|\w+\s+means?\s)/i.test(text)) abq += 15;
  const first60 = words.slice(0, 60).join(' ');
  if (/(\b(?:is|are|was|means?|refers?)\b|\d+%|\$\d|\d+\s+(?:million|billion|thousand))/i.test(first60)) abq += 15;
  if (heading && heading.trim().endsWith('?')) abq += 10;
  const clear = sentences.filter(s => { const n = s.split(/\s+/).length; return n >= 5 && n <= 25; }).length;
  if (sentences.length) abq += Math.round((clear / sentences.length) * 10);
  if (/(according to|research shows|studies?\s+(show|indicate|suggest|found)|data\s+(shows|indicates))/i.test(text)) abq += 10;
  abq = Math.min(abq, 30);

  // 2) Self-containment (25)
  let sc = 0;
  if (wordCount >= 134 && wordCount <= 167) sc += 10;
  else if (wordCount >= 100 && wordCount <= 200) sc += 7;
  else if (wordCount >= 80 && wordCount <= 250) sc += 4;
  else if (!(wordCount < 30 || wordCount > 400)) sc += 2;
  const pronouns = (text.match(/\b(?:it|they|them|their|this|that|these|those|he|she|his|her)\b/ig) || []).length;
  if (wordCount) {
    const ratio = pronouns / wordCount;
    if (ratio < 0.02) sc += 8; else if (ratio < 0.04) sc += 5; else if (ratio < 0.06) sc += 3;
  }
  const proper = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []).length;
  if (proper >= 3) sc += 7; else if (proper >= 1) sc += 4;
  sc = Math.min(sc, 25);

  // 3) Structural readability (20)
  let sr = 0;
  if (sentences.length) {
    const avg = wordCount / sentences.length;
    if (avg >= 10 && avg <= 20) sr += 8; else if (avg >= 8 && avg <= 25) sr += 5; else sr += 2;
  }
  if (/(first|second|third|finally|additionally|moreover|furthermore)/i.test(text)) sr += 4;
  if (/(\d+[\.\)]\s|\b(?:step|tip|point)\s+\d+)/i.test(text)) sr += 4;
  if (text.includes('\n')) sr += 4;
  sr = Math.min(sr, 20);

  // 4) Statistical density (15)
  let sd = 0;
  sd += Math.min((text.match(/\d+(?:\.\d+)?%/g) || []).length * 3, 6);
  sd += Math.min((text.match(/\$[\d,]+/g) || []).length * 3, 5);
  sd += Math.min((text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\s+(users|customers|pages|sites|companies|businesses|people|percent|times)\b/i) || []).length * 2, 4);
  if (/\b20(?:2[3-6]|1\d)\b/.test(text)) sd += 2;
  if (/(according to\s+[A-Z]|Gartner|Forrester|McKinsey|Harvard|Stanford|MIT|Google|Microsoft|OpenAI|Anthropic)/i.test(text)) sd += 2;
  sd = Math.min(sd, 15);

  // 5) Uniqueness signals (10)
  let us = 0;
  if (/(our\s+(research|study|data|analysis|survey|findings)|we\s+(found|discovered|analyzed|surveyed))/i.test(text)) us += 5;
  if (/(case study|for example|for instance|in practice|real-world|hands-on)/i.test(text)) us += 3;
  if (/(using|with|via|through)\s+[A-Z][a-z]+/.test(text)) us += 2;
  us = Math.min(us, 10);

  const total = abq + sc + sr + sd + us;
  const grade: CitabilityBlock['grade'] = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 35 ? 'D' : 'F';
  const label = { A: 'Highly Citable', B: 'Good Citability', C: 'Moderate', D: 'Low', F: 'Poor' }[grade];
  return { heading, word_count: wordCount, total_score: total, grade, label,
    breakdown: { answer_block_quality: abq, self_containment: sc, structural_readability: sr, statistical_density: sd, uniqueness_signals: us },
    preview: words.slice(0, 25).join(' ') + (wordCount > 25 ? '...' : '') };
}

export function analyzeCitability(content: string): CitabilityResult {
  const blocks = splitBlocks(content).map(b => scorePassageText(b.text, b.heading));
  if (!blocks.length) return { blocks_analyzed: 0, average_citability: 0, grade_distribution: {}, optimal_length_blocks: 0, best_block: null, worst_block: null, all_blocks: [] };
  const avg = Math.round((blocks.reduce((a, b) => a + b.total_score, 0) / blocks.length) * 10) / 10;
  const dist: Record<string, number> = {};
  for (const b of blocks) dist[b.grade] = (dist[b.grade] || 0) + 1;
  const optimal = blocks.filter(b => b.word_count >= 134 && b.word_count <= 167).length;
  const sorted = [...blocks].sort((a, b) => a.total_score - b.total_score);
  return { blocks_analyzed: blocks.length, average_citability: avg, grade_distribution: dist,
    optimal_length_blocks: optimal, best_block: sorted[sorted.length - 1], worst_block: sorted[0], all_blocks: blocks };
}

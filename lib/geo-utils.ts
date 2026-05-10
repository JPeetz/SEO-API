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

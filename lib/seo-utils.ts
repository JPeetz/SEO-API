// ─────────────────────────────────────────────
//  lib/seo-utils.ts  –  Pure calculation engine
// ─────────────────────────────────────────────

export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function getWords(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.replace(/[^a-zA-Z0-9]/g, '').length > 0);
}

export function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 3);
}

// ── Keyword Density ──────────────────────────

export interface KeywordDensityResult {
  keyword: string;
  count: number;
  totalWords: number;
  density: number;          // percentage 0–100
  rating: 'low' | 'good' | 'high';
  topKeywords: { word: string; count: number; density: number }[];
}

export function analyzeKeywordDensity(content: string, keyword = ''): KeywordDensityResult {
  const words = getWords(content);
  const totalWords = words.length;

  // Top keywords (stopword-filtered)
  const stopwords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','up','about','into','through','is','are','was','were',
    'be','been','being','have','has','had','do','does','did','will',
    'would','could','should','may','might','it','its','this','that',
    'these','those','i','we','you','he','she','they','their','our','your',
  ]);

  const freq: Record<string, number> = {};
  for (const w of words) {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length > 2 && !stopwords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      density: parseFloat(((count / totalWords) * 100).toFixed(2)),
    }));

  // Target keyword analysis
  const kw = keyword.toLowerCase().trim();
  let kwCount = 0;
  if (kw) {
    const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    kwCount = (content.match(re) || []).length;
  }
  const kwDensity = totalWords > 0 ? parseFloat(((kwCount / totalWords) * 100).toFixed(2)) : 0;

  const rating: KeywordDensityResult['rating'] =
    kwDensity < 0.5 ? 'low' : kwDensity > 3 ? 'high' : 'good';

  return { keyword: kw, count: kwCount, totalWords, density: kwDensity, rating, topKeywords };
}

// ── Readability ──────────────────────────────

export interface ReadabilityResult {
  fleschScore: number;
  fleschLabel: string;
  gradeLevel: number;
  gradeLevelLabel: string;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
}

export function analyzeReadability(content: string): ReadabilityResult {
  const words = getWords(content);
  const sentences = getSentences(content);
  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgSentenceLength = parseFloat((wordCount / sentenceCount).toFixed(1));
  const avgSyllablesPerWord = parseFloat((syllableCount / Math.max(wordCount, 1)).toFixed(2));

  const fleschScore = parseFloat(
    (206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord).toFixed(1)
  );

  const gradeLevel = parseFloat(
    (0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59).toFixed(1)
  );

  const fleschLabel =
    fleschScore >= 90 ? 'Very Easy' :
    fleschScore >= 80 ? 'Easy' :
    fleschScore >= 70 ? 'Fairly Easy' :
    fleschScore >= 60 ? 'Standard' :
    fleschScore >= 50 ? 'Fairly Difficult' :
    fleschScore >= 30 ? 'Difficult' : 'Very Difficult';

  const gradeLevelLabel =
    gradeLevel <= 6 ? 'Elementary' :
    gradeLevel <= 8 ? 'Middle School' :
    gradeLevel <= 12 ? 'High School' :
    gradeLevel <= 16 ? 'College' : 'Post-Graduate';

  return {
    fleschScore: Math.max(0, Math.min(100, fleschScore)),
    fleschLabel,
    gradeLevel: Math.max(1, gradeLevel),
    gradeLevelLabel,
    avgSentenceLength,
    avgSyllablesPerWord,
    wordCount,
    sentenceCount,
    syllableCount,
  };
}

// ── Meta Tag Check ───────────────────────────

export interface MetaCheckResult {
  titleLength: number;
  titleStatus: 'short' | 'good' | 'long';
  descLength: number;
  descStatus: 'short' | 'good' | 'long';
  keywordInTitle: boolean;
  keywordInDesc: boolean;
  titleWidthPx: number;
  score: number;           // 0–100
  issues: string[];
  suggestions: string[];
}

export function checkMetaTags(title: string, description: string, keyword = ''): MetaCheckResult {
  const titleLength = title.length;
  const descLength = description.length;
  const kw = keyword.toLowerCase();

  const titleStatus: MetaCheckResult['titleStatus'] =
    titleLength < 30 ? 'short' : titleLength > 60 ? 'long' : 'good';
  const descStatus: MetaCheckResult['descStatus'] =
    descLength < 70 ? 'short' : descLength > 160 ? 'long' : 'good';

  const keywordInTitle = kw ? title.toLowerCase().includes(kw) : false;
  const keywordInDesc = kw ? description.toLowerCase().includes(kw) : false;

  // Rough pixel width estimate (~7px per char average)
  const titleWidthPx = Math.round(titleLength * 7.2);

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (titleStatus === 'short') issues.push('Title is too short (under 30 characters)');
  if (titleStatus === 'long') issues.push('Title exceeds 60 characters — may be truncated in SERPs');
  if (descStatus === 'short') issues.push('Meta description is too short (under 70 characters)');
  if (descStatus === 'long') issues.push('Meta description exceeds 160 characters — will be cut off');
  if (kw && !keywordInTitle) issues.push(`Target keyword "${keyword}" not found in title`);
  if (kw && !keywordInDesc) issues.push(`Target keyword "${keyword}" not found in description`);

  if (titleStatus === 'good') suggestions.push('Title length is optimal');
  if (descStatus === 'good') suggestions.push('Description length is optimal');
  if (kw && keywordInTitle) suggestions.push('Keyword present in title — good for relevance');
  if (kw && keywordInDesc) suggestions.push('Keyword present in description — improves CTR');

  const maxScore = kw ? 100 : 60;
  let score = 0;
  if (titleStatus === 'good') score += 25;
  else if (titleStatus !== 'short') score += 10;
  if (descStatus === 'good') score += 25;
  else if (descStatus !== 'short') score += 10;
  if (kw) {
    if (keywordInTitle) score += 25;
    if (keywordInDesc) score += 25;
  }

  return {
    titleLength, titleStatus, descLength, descStatus,
    keywordInTitle, keywordInDesc, titleWidthPx,
    score: Math.round((score / maxScore) * 100),
    issues, suggestions,
  };
}

// ── ROI Calculator ───────────────────────────

// Standard CTR curve by position (Backlinko 2023 estimates)
const CTR_BY_POSITION: Record<number, number> = {
  1: 27.6, 2: 18.1, 3: 10.1, 4: 7.4, 5: 5.1,
  6: 3.8,  7: 2.9,  8: 2.2,  9: 1.9, 10: 1.6,
};

export interface ROIResult {
  ctr: number;
  monthlyVisitors: number;
  monthlyConversions: number;
  monthlyRevenue: number;
  totalRevenue: number;
  totalInvestment: number;
  netProfit: number;
  roi: number;            // percentage
  breakEvenMonth: number | null;
  rating: 'negative' | 'low' | 'good' | 'excellent';
}

export function calculateROI(
  searchVolume: number,
  position: number,
  conversionRate: number,
  revenuePerConversion: number,
  monthlyInvestment: number,
  timeframe: number
): ROIResult {
  const ctr = CTR_BY_POSITION[Math.min(Math.max(Math.round(position), 1), 10)] ?? 1.6;
  const monthlyVisitors = Math.round(searchVolume * (ctr / 100));
  const monthlyConversions = parseFloat((monthlyVisitors * (conversionRate / 100)).toFixed(2));
  const monthlyRevenue = parseFloat((monthlyConversions * revenuePerConversion).toFixed(2));
  const totalRevenue = parseFloat((monthlyRevenue * timeframe).toFixed(2));
  const totalInvestment = parseFloat((monthlyInvestment * timeframe).toFixed(2));
  const netProfit = parseFloat((totalRevenue - totalInvestment).toFixed(2));
  const roi = totalInvestment > 0
    ? parseFloat(((netProfit / totalInvestment) * 100).toFixed(1))
    : 0;

  let breakEvenMonth: number | null = null;
  if (monthlyRevenue > 0 && monthlyInvestment > 0) {
    const bem = Math.ceil(monthlyInvestment / monthlyRevenue);
    breakEvenMonth = bem <= timeframe ? bem : null;
  }

  const rating: ROIResult['rating'] =
    roi < 0 ? 'negative' : roi < 100 ? 'low' : roi < 300 ? 'good' : 'excellent';

  return {
    ctr, monthlyVisitors, monthlyConversions, monthlyRevenue,
    totalRevenue, totalInvestment, netProfit, roi, breakEvenMonth, rating,
  };
}

// ── Page Speed Score ─────────────────────────

export interface PageSpeedResult {
  score: number;           // 0–100
  rating: 'poor' | 'needs-improvement' | 'good';
  lcpRating: 'good' | 'needs-improvement' | 'poor';
  fidRating: 'good' | 'needs-improvement' | 'poor';
  clsRating: 'good' | 'needs-improvement' | 'poor';
  ttfbRating: 'good' | 'needs-improvement' | 'poor';
  issues: string[];
  passedChecks: string[];
}

export function calculatePageSpeed(
  lcp: number,   // seconds
  fid: number,   // ms
  cls: number,   // score
  pageSize: number, // KB
  httpRequests: number,
  ttfb: number   // ms
): PageSpeedResult {
  const issues: string[] = [];
  const passedChecks: string[] = [];
  let score = 100;

  // LCP (good <2.5s, needs improvement <4s, poor ≥4s)
  const lcpRating = lcp <= 2.5 ? 'good' : lcp <= 4.0 ? 'needs-improvement' : 'poor';
  if (lcpRating === 'good') passedChecks.push(`LCP ${lcp}s — Good`);
  else if (lcpRating === 'needs-improvement') { issues.push(`LCP ${lcp}s — Needs improvement (target: ≤2.5s)`); score -= 15; }
  else { issues.push(`LCP ${lcp}s — Poor (target: ≤2.5s)`); score -= 30; }

  // FID (good <100ms, needs improvement <300ms, poor ≥300ms)
  const fidRating = fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor';
  if (fidRating === 'good') passedChecks.push(`FID ${fid}ms — Good`);
  else if (fidRating === 'needs-improvement') { issues.push(`FID ${fid}ms — Needs improvement (target: ≤100ms)`); score -= 10; }
  else { issues.push(`FID ${fid}ms — Poor (target: ≤100ms)`); score -= 20; }

  // CLS (good <0.1, needs improvement <0.25, poor ≥0.25)
  const clsRating = cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor';
  if (clsRating === 'good') passedChecks.push(`CLS ${cls} — Good`);
  else if (clsRating === 'needs-improvement') { issues.push(`CLS ${cls} — Needs improvement (target: ≤0.1)`); score -= 10; }
  else { issues.push(`CLS ${cls} — Poor (target: ≤0.1)`); score -= 20; }

  // TTFB (good <800ms, needs improvement <1800ms, poor ≥1800ms)
  const ttfbRating = ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor';
  if (ttfbRating === 'good') passedChecks.push(`TTFB ${ttfb}ms — Good`);
  else if (ttfbRating === 'needs-improvement') { issues.push(`TTFB ${ttfb}ms — Needs improvement (target: ≤800ms)`); score -= 10; }
  else { issues.push(`TTFB ${ttfb}ms — Poor (target: ≤800ms)`); score -= 15; }

  // Page size heuristics
  if (pageSize > 3000) { issues.push(`Page size ${pageSize}KB is very large (target: <1500KB)`); score -= 10; }
  else if (pageSize > 1500) { issues.push(`Page size ${pageSize}KB is large (target: <1500KB)`); score -= 5; }
  else passedChecks.push(`Page size ${pageSize}KB — Acceptable`);

  // HTTP requests heuristic
  if (httpRequests > 80) { issues.push(`${httpRequests} HTTP requests — Excessive (target: <50)`); score -= 5; }
  else if (httpRequests > 50) { issues.push(`${httpRequests} HTTP requests — High (target: <50)`); score -= 2; }
  else passedChecks.push(`${httpRequests} HTTP requests — Good`);

  score = Math.max(0, Math.min(100, score));

  const rating: PageSpeedResult['rating'] =
    score >= 90 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor';

  return { score, rating, lcpRating, fidRating, clsRating, ttfbRating, issues, passedChecks };
}

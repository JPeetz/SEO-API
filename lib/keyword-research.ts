// ─────────────────────────────────────────────
//  lib/keyword-research.ts  –  Keyword suggestion + GEO scoring
//  Uses Google Autocomplete (real, keyless search suggestions) for
//  related-keyword discovery, then scores each suggestion for GEO
//  (Generative Engine) relevance. Volume is NOT fabricated: no real
//  volume source is available keyless, so volume is omitted rather
//  than invented (per the no-invented-statistics discipline).
// ─────────────────────────────────────────────

const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','is','are','was','were',
  'be','been','being','have','has','had','do','does','did','will',
  'would','should','can','could','may','might','it','its','this','that',
  'these','those','i','we','you','he','she','they','their','our','your',
  'my','me','us','what','why','how','when','where','who',
]);

// Intent keywords for classification
const INTENT_COMMERCIAL = ['best','top','review','alternative','vs','alternatives','cheap','price','cost','free trial','compare','for'];
const INTENT_INFORMATIONAL = ['how','what','guide','tutorial','meaning','vs','examples','tips','why','when','learn'];
const INTENT_TRANSACTIONAL = ['buy','download','sign up','pricing','coupon','deal','install','subscribe','get'];

export interface KeywordSuggestion {
  keyword: string;
  geo_score: number;        // 0-100, heuristic for AI-engine citation relevance
  intent: string;           // informational | commercial | transactional | navigational
  source: string;           // 'google-autocomplete'
  note: string;             // transparent: what the score means, volume not available
}

function classifyIntent(kw: string): string {
  const lower = kw.toLowerCase();
  if (INTENT_COMMERCIAL.some(w => lower.includes(w))) return 'commercial';
  if (INTENT_TRANSACTIONAL.some(w => lower.includes(w))) return 'transactional';
  if (INTENT_INFORMATIONAL.some(w => lower.includes(w))) return 'informational';
  return 'informational';
}

function geoScore(kw: string, seed: string): number {
  const lower = kw.toLowerCase();
  let score = 50;

  // Relevance to seed: shared significant words boost score
  const seedWords = seed.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  const kwWords = lower.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  const shared = seedWords.filter(w => kwWords.includes(w)).length;
  score += shared * 12;

  // Question-style / conversational phrasing is favored by AI engines
  if (/\b(how|what|why|when|is|are|can|should|do)\b/.test(lower)) score += 12;

  // Specific long-tail (more words) extracts better as an answer
  if (kwWords.length >= 3) score += 8;

  // Avoid noise
  if (lower === seed.toLowerCase()) score += 15;         // exact seed = strong anchor
  if (/\breddit\b|\bpronunciation\b/.test(lower)) score -= 25; // low-value for coaching SEO

  // Intent-aware modifier
  if (lower.includes('alternative') || lower.includes('vs')) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function fetchGoogleSuggestions(seed: string, limit = 12): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(seed)}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'curl/8.6.0' },
  });
  if (!res.ok) throw new Error(`Google Autocomplete returned ${res.status}`);
  const data = await res.json() as [string, string[]];
  return (data?.[1] ?? []).slice(0, limit);
}

export async function researchKeywords(seed: string, limit = 12): Promise<KeywordSuggestion[]> {
  const suggestions = await fetchGoogleSuggestions(seed, limit);
  return suggestions.map(kw => ({
    keyword: kw,
    geo_score: geoScore(kw, seed),
    intent: classifyIntent(kw),
    source: 'google-autocomplete',
    note: 'Real Google Autocomplete suggestion. GEO score is a heuristic for AI-engine citation relevance; search volume is not available without a paid data source and is intentionally not estimated.',
  }));
}

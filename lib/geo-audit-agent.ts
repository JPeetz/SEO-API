/**
 * AgentForge — GEO Audit Agent
 * 
 * Step 1: POST to /api/geo/evaluation-prompt — get back system + user prompt
 *         (server also pre-computes all algorithmic signals and embeds them)
 * Step 2: Feed prompts into your existing OpenRouter call (no extra API key needed)
 * Step 3: Parse the structured JSON verdict
 * Step 4: If verdict !== 'cite-ready', pass rewriteInstructions to Writer agent
 */

const SEO_GEO_API_BASE = 'https://seo-api-nu.vercel.app';

// ── Types ─────────────────────────────────────────────────────

interface ArticleInput {
  title: string;
  metaDescription: string;
  body: string;
  targetKeyword: string;
  targetQuery: string;   // conversational query e.g. "how to optimize content for AI search"
  url?: string;
}

interface GEOVerdict {
  verdict: 'cite-ready' | 'needs-work' | 'not-citable';
  citationLikelihood: number;      // 0–100
  dimensions: {
    factualDensity: number;
    answerDirectness: number;
    authoritySignals: number;
    uniqueInsight: number;
    structuralClarity: number;
    queryAlignment: number;
  };
  topStrengths: string[];
  topIssues: string[];
  rewriteInstructions: string[];
}

interface GEOAuditResult {
  verdict: GEOVerdict['verdict'];
  citationLikelihood: number;
  rewriteInstructions: string[];   // feed directly to Writer agent
  fullVerdict: GEOVerdict;
  algorithmicSignals: {
    entityDensity:   { score: number; rating: string };
    answerStructure: { score: number; rating: string };
    quotability:     { compositeScore: number; rating: string };
    eeat:            { compositeScore: number; rating: string };
  };
  promptTokensUsed: number;
}

// ── Main GEO audit function ───────────────────────────────────

export async function geoAuditArticle(
  article: ArticleInput,
  openRouterCall: (systemPrompt: string, userPrompt: string) => Promise<string>
): Promise<GEOAuditResult> {

  // Step 1: Get evaluation prompt + pre-computed signals from API (no LLM on server)
  const promptRes = await fetch(`${SEO_GEO_API_BASE}/api/geo/evaluation-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: article.body,
      targetQuery: article.targetQuery,
      includeSignals: true,
    }),
  });

  const promptData = await promptRes.json();
  if (!promptData.success) throw new Error(`GEO API error: ${promptData.error}`);

  const { systemPrompt, userPrompt, algorithmicSignals, tokensEstimate } = promptData.data;

  // Step 2: Feed into YOUR OpenRouter call (agent's existing context — no extra key needed)
  const rawResponse = await openRouterCall(systemPrompt, userPrompt);

  // Step 3: Parse JSON verdict from LLM response
  const clean = rawResponse.replace(/```json|```/g, '').trim();
  const verdict: GEOVerdict = JSON.parse(clean);

  return {
    verdict: verdict.verdict,
    citationLikelihood: verdict.citationLikelihood,
    rewriteInstructions: verdict.rewriteInstructions,
    fullVerdict: verdict,
    algorithmicSignals: {
      entityDensity:   { score: algorithmicSignals.entityDensity.score,        rating: algorithmicSignals.entityDensity.rating },
      answerStructure: { score: algorithmicSignals.answerStructure.score,       rating: algorithmicSignals.answerStructure.rating },
      quotability:     { compositeScore: algorithmicSignals.quotability.compositeScore, rating: algorithmicSignals.quotability.rating },
      eeat:            { compositeScore: algorithmicSignals.eeat.compositeScore,       rating: algorithmicSignals.eeat.rating },
    },
    promptTokensUsed: tokensEstimate,
  };
}

// ── OpenRouter call helper (wire to your existing client) ─────

export function makeOpenRouterCaller(apiKey: string, model = 'anthropic/claude-sonnet-4') {
  return async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://agent-forge.co',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.2,    // low temp — we want deterministic scoring
        max_tokens: 800,
      }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
  };
}

// ── Combined SEO + GEO workflow ───────────────────────────────
//
// import { auditArticle } from './seo-audit-agent';
//
// async function fullContentAudit(article, openRouterKey) {
//   const caller = makeOpenRouterCaller(openRouterKey);
//
//   const [seo, geo] = await Promise.all([
//     auditArticle(article),
//     geoAuditArticle(article, caller),
//   ]);
//
//   const pass = seo.verdict === 'pass' && geo.verdict === 'cite-ready';
//   const allInstructions = [...seo.issues, ...geo.rewriteInstructions];
//
//   if (!pass) {
//     article = await writerAgent.rewrite(article, allInstructions);
//   } else {
//     await publisherAgent.post(article);
//   }
// }

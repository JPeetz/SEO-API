# SEO + GEO API

> REST API + visual interface for SEO and GEO analysis — built for [AgentForge](https://agent-forge.co) autonomous content workflows.

Deployable on Vercel in one click. All endpoints accept `POST` with `Content-Type: application/json` and return structured JSON. **No environment variables required** — all SEO and GEO algorithmic endpoints are self-contained. The GEO evaluation prompt endpoint returns a pre-built prompt your agent feeds into its own OpenRouter call — no LLM runs on this server.

---

## Quick Deploy

```bash
git clone https://github.com/JPeetz/seo-api.git
cd seo-api
npm install
npm run dev

# Deploy to Vercel
npx vercel --prod
```

---

## API Overview

| Group | Endpoint | Type | Description |
|-------|----------|------|-------------|
| SEO | `/api/seo/keyword-density` | Algorithmic | Keyword frequency and density |
| SEO | `/api/seo/readability` | Algorithmic | Flesch score and grade level |
| SEO | `/api/seo/meta-check` | Algorithmic | Title and description validation |
| SEO | `/api/seo/serp-preview` | Algorithmic | Google SERP display data |
| SEO | `/api/seo/roi` | Algorithmic | SEO ROI projection |
| SEO | `/api/seo/page-speed` | Algorithmic | Core Web Vitals scoring |
| GEO | `/api/geo/entity-density` | Algorithmic | Named entity and fact signal density |
| GEO | `/api/geo/answer-structure` | Algorithmic | Q&A, definition, step pattern detection |
| GEO | `/api/geo/quotability` | Algorithmic | Per-sentence citation-worthiness scoring |
| GEO | `/api/geo/eeat-signals` | Algorithmic | E-E-A-T marker detection |
| GEO | `/api/geo/evaluation-prompt` | Prompt builder | Returns prompts for your agent's LLM — no server LLM call |

All errors return `{ "error": "message" }` with HTTP 400.

---

## SEO Endpoints

### `POST /api/seo/keyword-density`

**Input**
```json
{ "content": "string", "keyword": "string (optional)" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "keyword": "string",
    "count": 0,
    "totalWords": 0,
    "density": 0.00,
    "rating": "low | good | high",
    "topKeywords": [{ "word": "string", "count": 0, "density": 0.00 }]
  }
}
```

| Rating | Density range |
|--------|--------------|
| `low`  | < 0.5% |
| `good` | 0.5–3% |
| `high` | > 3% — keyword stuffing |

---

### `POST /api/seo/readability`

**Input**
```json
{ "content": "string" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "fleschScore": 0.0,
    "fleschLabel": "string",
    "gradeLevel": 0.0,
    "gradeLevelLabel": "string",
    "avgSentenceLength": 0.0,
    "avgSyllablesPerWord": 0.00,
    "wordCount": 0,
    "sentenceCount": 0,
    "syllableCount": 0
  }
}
```

| Flesch Score | Label |
|-------------|-------|
| 90–100 | Very Easy |
| 80–89 | Easy |
| 70–79 | Fairly Easy |
| 60–69 | Standard |
| 50–59 | Fairly Difficult |
| 30–49 | Difficult |
| 0–29 | Very Difficult |

---

### `POST /api/seo/meta-check`

**Input**
```json
{ "title": "string", "description": "string", "keyword": "string (optional)" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "titleLength": 0,
    "titleStatus": "short | good | long",
    "descLength": 0,
    "descStatus": "short | good | long",
    "keywordInTitle": true,
    "keywordInDesc": true,
    "titleWidthPx": 0,
    "score": 0,
    "issues": ["string"],
    "suggestions": ["string"]
  }
}
```

| Status | Title | Description |
|--------|-------|-------------|
| `short` | < 30 chars | < 70 chars |
| `good` | 30–60 chars | 70–160 chars |
| `long` | > 60 chars | > 160 chars |

---

### `POST /api/seo/serp-preview`

**Input**
```json
{ "url": "string", "title": "string", "description": "string (optional)" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "domain": "string",
    "displayTitle": "string",
    "displayDescription": "string",
    "titleLength": 0,
    "descLength": 0,
    "titleWidthPx": 0,
    "titleTruncated": false,
    "descTruncated": false,
    "serpPreview": {
      "breadcrumb": "string",
      "title": "string",
      "description": "string"
    }
  }
}
```

---

### `POST /api/seo/roi`

**Input**
```json
{
  "searchVolume": 0,
  "position": 0,
  "conversionRate": 0.0,
  "revenuePerConversion": 0.0,
  "monthlyInvestment": 0.0,
  "timeframe": 0
}
```

**Output**
```json
{
  "success": true,
  "data": {
    "ctr": 0.0,
    "monthlyVisitors": 0,
    "monthlyConversions": 0.0,
    "monthlyRevenue": 0.0,
    "totalRevenue": 0.0,
    "totalInvestment": 0.0,
    "netProfit": 0.0,
    "roi": 0.0,
    "breakEvenMonth": 0,
    "rating": "negative | low | good | excellent"
  }
}
```

CTR values by position (Backlinko 2023): pos 1 = 27.6%, pos 2 = 18.1%, pos 3 = 10.1% ... pos 10 = 1.6%

---

### `POST /api/seo/page-speed`

**Input**
```json
{
  "lcp": 0.0,
  "fid": 0,
  "cls": 0.00,
  "pageSize": 0,
  "httpRequests": 0,
  "ttfb": 0
}
```

**Output**
```json
{
  "success": true,
  "data": {
    "score": 0,
    "rating": "poor | needs-improvement | good",
    "lcpRating": "good | needs-improvement | poor",
    "fidRating": "good | needs-improvement | poor",
    "clsRating": "good | needs-improvement | poor",
    "ttfbRating": "good | needs-improvement | poor",
    "issues": ["string"],
    "passedChecks": ["string"]
  }
}
```

| Metric | Good | Needs improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| FID | ≤ 100ms | ≤ 300ms | > 300ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| TTFB | ≤ 800ms | ≤ 1800ms | > 1800ms |

---

## GEO Endpoints

GEO (Generative Engine Optimization) targets citation likelihood by AI systems — ChatGPT, Perplexity, Google AI Overviews, Claude. Different signals from SEO.

### `POST /api/geo/entity-density`

Named entities, statistics, and factual claim density — the primary signals AI engines extract when deciding what to cite.

**Input**
```json
{ "content": "string" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "totalWords": 0,
    "namedEntityCount": 0,
    "statisticCount": 0,
    "factMarkerCount": 0,
    "citationMarkerCount": 0,
    "dateReferenceCount": 0,
    "entityDensityPer100": 0.00,
    "statDensityPer100": 0.00,
    "score": 0,
    "rating": "low | moderate | good | strong",
    "topEntities": ["string"]
  }
}
```

---

### `POST /api/geo/answer-structure`

Detects Q&A patterns, definitions, step structures, and direct answer signals that AI engines prefer to extract and cite.

**Input**
```json
{ "content": "string" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "questionCount": 0,
    "definitionCount": 0,
    "stepPatternCount": 0,
    "conclusionMarkerCount": 0,
    "directAnswerCount": 0,
    "listDensity": 0.0,
    "avgSentenceLength": 0.0,
    "score": 0,
    "rating": "poor | moderate | good | excellent",
    "strengths": ["string"],
    "gaps": ["string"]
  }
}
```

---

### `POST /api/geo/quotability`

Scores individual sentences for citation-worthiness. AI engines preferentially surface specific, assertive, stat-backed sentences.

**Input**
```json
{ "content": "string" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "compositeScore": 0,
    "rating": "low | moderate | good | strong",
    "totalSentencesAnalyzed": 0,
    "avgQuotabilityScore": 0.0,
    "topSentences": [
      {
        "text": "string",
        "score": 0,
        "reasons": ["string"]
      }
    ]
  }
}
```

Scoring factors per sentence: optimal length (10–35 words), contains statistic, power words, clear subject opening, assertive tone, definition pattern.

---

### `POST /api/geo/eeat-signals`

Detects Experience, Expertise, Authority, and Trust markers — the credibility signals both AI engines and Google use to evaluate source quality.

**Input**
```json
{ "content": "string" }
```

**Output**
```json
{
  "success": true,
  "data": {
    "experienceScore": 0,
    "expertiseScore": 0,
    "authorityScore": 0,
    "trustScore": 0,
    "compositeScore": 0,
    "rating": "weak | moderate | good | strong",
    "signals": {
      "experience": ["string"],
      "expertise": ["string"],
      "authority": ["string"],
      "trust": ["string"]
    },
    "gaps": ["string"]
  }
}
```

---

### `POST /api/geo/evaluation-prompt`

**The key GEO endpoint.** Returns a pre-built system + user prompt that your AgentForge agent feeds into its own OpenRouter call. No LLM runs on this server — reasoning stays inside your existing agent context, on your key, at your cost.

The server pre-computes all four algorithmic GEO signals and embeds them in the prompt automatically, giving your LLM richer context without extra API calls.

**Input**
```json
{
  "content": "string",
  "targetQuery": "string",
  "includeSignals": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | ✅ | Article body |
| `targetQuery` | string | ✅ | Conversational query e.g. `"how to optimize content for AI search"` |
| `includeSignals` | boolean | ❌ | Pre-compute algorithmic signals and embed in prompt (default: true) |

**Output**
```json
{
  "success": true,
  "data": {
    "systemPrompt": "string",
    "userPrompt": "string",
    "tokensEstimate": 0,
    "expectedOutputSchema": {
      "citationLikelihood": "number 0–100",
      "dimensions": {
        "factualDensity": "number 0–100",
        "answerDirectness": "number 0–100",
        "authoritySignals": "number 0–100",
        "uniqueInsight": "number 0–100",
        "structuralClarity": "number 0–100",
        "queryAlignment": "number 0–100"
      },
      "topStrengths": ["string"],
      "topIssues": ["string"],
      "rewriteInstructions": ["string"],
      "verdict": "cite-ready | needs-work | not-citable"
    },
    "algorithmicSignals": {
      "entityDensity":   { "score": 0, "rating": "string" },
      "answerStructure": { "score": 0, "rating": "string" },
      "quotability":     { "compositeScore": 0, "rating": "string" },
      "eeat":            { "compositeScore": 0, "rating": "string" }
    }
  }
}
```

| Verdict | citationLikelihood |
|---------|-------------------|
| `cite-ready` | ≥ 75 |
| `needs-work` | 40–74 |
| `not-citable` | < 40 |

**Agent integration pattern:**
```typescript
// 1. Get prompt from API (no LLM on server)
const { systemPrompt, userPrompt } = await fetch('/api/geo/evaluation-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: article.body, targetQuery: article.targetQuery }),
}).then(r => r.json()).then(d => d.data);

// 2. Feed into YOUR OpenRouter call (your key, your model, your context)
const llmResponse = await openRouter.chat({ systemPrompt, userPrompt });

// 3. Parse structured verdict
const verdict = JSON.parse(llmResponse);
// verdict.rewriteInstructions → feed back to Writer agent if verdict !== 'cite-ready'
```

---

## AgentForge Workflow

### Full SEO + GEO audit in one step

```typescript
import { auditArticle } from './lib/seo-audit-agent';
import { geoAuditArticle, makeOpenRouterCaller } from './lib/geo-audit-agent';

async function contentWorkflow(brief, openRouterKey) {
  let article = await writerAgent.generate(brief);
  const caller = makeOpenRouterCaller(openRouterKey);

  for (let attempt = 0; attempt < 3; attempt++) {
    // Run SEO (pure math) and GEO (math + one LLM call) in parallel
    const [seo, geo] = await Promise.all([
      auditArticle(article),
      geoAuditArticle(article, caller),
    ]);

    const pass = seo.verdict === 'pass' && geo.verdict === 'cite-ready';

    if (pass) {
      console.log(`✓ SEO: ${seo.score} · GEO: ${geo.citationLikelihood}`);
      await publisherAgent.post(article);
      return;
    }

    // Merge all instructions and feed back to Writer
    const instructions = [...seo.issues, ...geo.rewriteInstructions];
    console.log(`✗ Rewrite #${attempt + 1} — ${instructions.length} instructions`);
    article = await writerAgent.rewrite(article, instructions);
  }
}
```

### Recommended quality gates

| Signal | Pass threshold |
|--------|---------------|
| SEO keyword density | 0.5–3% |
| SEO Flesch score | ≥ 50 |
| SEO meta score | ≥ 80 |
| GEO citation likelihood | ≥ 75 |
| GEO E-E-A-T composite | ≥ 50 |
| GEO quotability | ≥ 50 |

---

## CORS

All `/api/*` routes have `Access-Control-Allow-Origin: *` — callable from any domain or agent runtime.

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Vercel** — zero-config deployment
- **Tailwind CSS** — styling
- No external API calls on server, no database, no environment variables

---

## License

MIT · Part of the [AgentForge Ecosystem](https://github.com/JPeetz/agentforge)

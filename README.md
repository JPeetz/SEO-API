# SEO API

> REST API + visual interface for SEO analysis tools — built for [AgentForge](https://agent-forge.co) autonomous content workflows.

Deployable on Vercel in one click. All endpoints accept `POST` with `Content-Type: application/json` and return structured JSON.

---

## Quick Deploy

```bash
# 1. Clone
git clone https://github.com/JPeetz/seo-api.git
cd seo-api

# 2. Install
npm install

# 3. Dev
npm run dev

# 4. Deploy to Vercel
npx vercel --prod
```

> **No environment variables required.** All calculations are self-contained.

---

## API Endpoints

Base URL (production): `https://your-vercel-domain.vercel.app`

All endpoints:
- Method: `POST`
- Content-Type: `application/json`
- Response: `{ success: true, data: { ... } }` or `{ error: "message" }`

---

### `POST /api/seo/keyword-density`

Analyze keyword frequency and density across a body of content.

**Request**
```json
{
  "content": "Your article text goes here...",
  "keyword": "SEO optimization"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | ✅ | The text to analyze |
| `keyword` | string | ❌ | Target keyword to track |

**Response**
```json
{
  "success": true,
  "data": {
    "keyword": "seo optimization",
    "count": 4,
    "totalWords": 512,
    "density": 0.78,
    "rating": "good",
    "topKeywords": [
      { "word": "content", "count": 18, "density": 3.52 },
      { "word": "search", "count": 12, "density": 2.34 }
    ]
  }
}
```

| Field | Values | Description |
|-------|--------|-------------|
| `density` | 0–100 | Keyword density as percentage |
| `rating` | `low` / `good` / `high` | `good` = 0.5–3% |

---

### `POST /api/seo/readability`

Flesch Reading Ease + Kincaid Grade Level analysis.

**Request**
```json
{
  "content": "Your article text goes here..."
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "fleschScore": 67.4,
    "fleschLabel": "Standard",
    "gradeLevel": 9.2,
    "gradeLevelLabel": "High School",
    "avgSentenceLength": 18.3,
    "avgSyllablesPerWord": 1.61,
    "wordCount": 512,
    "sentenceCount": 28,
    "syllableCount": 824
  }
}
```

| Flesch Score | Label |
|-------------|-------|
| 90–100 | Very Easy |
| 80–89  | Easy |
| 70–79  | Fairly Easy |
| 60–69  | Standard |
| 50–59  | Fairly Difficult |
| 30–49  | Difficult |
| 0–29   | Very Difficult |

---

### `POST /api/seo/meta-check`

Validate title tag and meta description against SEO best practices.

**Request**
```json
{
  "title": "Free SEO Analysis Tools — Keyword Density & More",
  "description": "Use our free SEO tools to analyze keyword density, check readability scores, and preview SERP results.",
  "keyword": "SEO tools"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "titleLength": 49,
    "titleStatus": "good",
    "descLength": 110,
    "descStatus": "good",
    "keywordInTitle": true,
    "keywordInDesc": true,
    "titleWidthPx": 353,
    "score": 100,
    "issues": [],
    "suggestions": [
      "Title length is optimal",
      "Keyword present in title — good for relevance"
    ]
  }
}
```

| Status | Range |
|--------|-------|
| `short` | title < 30 chars / desc < 70 chars |
| `good`  | title 30–60 / desc 70–160 |
| `long`  | title > 60 / desc > 160 |

---

### `POST /api/seo/serp-preview`

Generate Google SERP preview data for a page.

**Request**
```json
{
  "url": "https://agent-forge.co/seo-tools",
  "title": "Free SEO Analysis Tools — AgentForge",
  "description": "AI-powered SEO analysis. Keyword density, readability, SERP preview and more."
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "domain": "agent-forge.co",
    "displayTitle": "Free SEO Analysis Tools — AgentForge",
    "displayDescription": "AI-powered SEO analysis. Keyword density, readability, SERP preview and more.",
    "titleLength": 37,
    "descLength": 79,
    "titleWidthPx": 266,
    "titleTruncated": false,
    "descTruncated": false,
    "serpPreview": {
      "breadcrumb": "agent-forge.co",
      "title": "Free SEO Analysis Tools — AgentForge",
      "description": "AI-powered SEO analysis. Keyword density, readability, SERP preview and more."
    }
  }
}
```

---

### `POST /api/seo/roi`

Calculate SEO ROI based on search volume, position, and revenue metrics.

**Request**
```json
{
  "searchVolume": 10000,
  "position": 3,
  "conversionRate": 2,
  "revenuePerConversion": 50,
  "monthlyInvestment": 1000,
  "timeframe": 12
}
```

| Field | Type | Description |
|-------|------|-------------|
| `searchVolume` | number | Monthly searches for target keyword |
| `position` | number | Target SERP position (1–10) |
| `conversionRate` | number | Conversion rate in percent |
| `revenuePerConversion` | number | USD revenue per conversion |
| `monthlyInvestment` | number | Monthly SEO spend in USD |
| `timeframe` | number | Projection period in months |

**Response**
```json
{
  "success": true,
  "data": {
    "ctr": 10.1,
    "monthlyVisitors": 1010,
    "monthlyConversions": 20.2,
    "monthlyRevenue": 1010.0,
    "totalRevenue": 12120.0,
    "totalInvestment": 12000.0,
    "netProfit": 120.0,
    "roi": 1.0,
    "breakEvenMonth": 12,
    "rating": "low"
  }
}
```

| Rating | ROI Range |
|--------|-----------|
| `negative` | < 0% |
| `low` | 0–100% |
| `good` | 100–300% |
| `excellent` | > 300% |

CTR values used (Backlinko 2023): pos 1 = 27.6%, pos 2 = 18.1%, pos 3 = 10.1% ... pos 10 = 1.6%

---

### `POST /api/seo/page-speed`

Estimate Core Web Vitals performance score.

**Request**
```json
{
  "lcp": 2.1,
  "fid": 80,
  "cls": 0.08,
  "pageSize": 950,
  "httpRequests": 35,
  "ttfb": 550
}
```

| Field | Unit | Good Threshold |
|-------|------|---------------|
| `lcp` | seconds | ≤ 2.5s |
| `fid` | ms | ≤ 100ms |
| `cls` | score | ≤ 0.1 |
| `pageSize` | KB | < 1500KB |
| `httpRequests` | count | < 50 |
| `ttfb` | ms | ≤ 800ms |

**Response**
```json
{
  "success": true,
  "data": {
    "score": 95,
    "rating": "good",
    "lcpRating": "good",
    "fidRating": "good",
    "clsRating": "good",
    "ttfbRating": "good",
    "issues": [],
    "passedChecks": [
      "LCP 2.1s — Good",
      "FID 80ms — Good",
      "CLS 0.08 — Good",
      "TTFB 550ms — Good",
      "Page size 950KB — Acceptable",
      "35 HTTP requests — Good"
    ]
  }
}
```

---

## AgentForge Integration

In your Hermes agent workflow, call the SEO API after generating each article:

```javascript
// Example: Full SEO audit in one workflow step
async function auditArticle(article) {
  const BASE = 'https://your-seo-api.vercel.app';

  const [density, readability, meta] = await Promise.all([
    fetch(`${BASE}/api/seo/keyword-density`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: article.body,
        keyword: article.targetKeyword,
      }),
    }).then(r => r.json()),

    fetch(`${BASE}/api/seo/readability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: article.body }),
    }).then(r => r.json()),

    fetch(`${BASE}/api/seo/meta-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: article.title,
        description: article.metaDescription,
        keyword: article.targetKeyword,
      }),
    }).then(r => r.json()),
  ]);

  return {
    keywordDensity: density.data,
    readability: readability.data,
    metaScore: meta.data.score,
    issues: meta.data.issues,
  };
}
```

### Suggested AgentForge Workflow

```
[CMO Agent] → assigns keyword + brief
     ↓
[Writer Agent] → generates article
     ↓
[SEO Audit] → POST to /api/seo/* (density + readability + meta)
     ↓
[Quality Gate] → if score < threshold, loop back to Writer
     ↓
[Publisher Agent] → POST to WordPress
```

---

## CORS

All `/api/*` routes have `Access-Control-Allow-Origin: *` — callable from any domain or agent runtime.

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Vercel** — zero-config deployment
- **Tailwind CSS** — styling
- No external API calls, no database, no environment variables

---

## License

MIT — [github.com/JPeetz](https://github.com/JPeetz)

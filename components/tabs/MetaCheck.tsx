'use client';

import { useState } from 'react';
import { Input, SubmitButton, StatBox, ScoreRing, SectionLabel, ErrorBox, IssueList } from '@/components/ui/Elements';

export default function MetaCheckTab() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!title.trim() || !description.trim()) { setError('Title and description are required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/seo/meta-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e: any) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  const statusColor = (s: string) => s === 'good' ? 'var(--accent)' : 'var(--amber)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl text-[var(--text)] mb-1">Meta Tag Checker</h2>
        <p className="text-sm text-[var(--dim)]">Validate title tag and meta description for SEO best practices.</p>
      </div>

      <div className="grid gap-4">
        <Input label={`Title Tag — ${title.length}/60`} placeholder="Your page title..." value={title} onChange={setTitle} />
        <Input label={`Meta Description — ${description.length}/160`} placeholder="Your meta description..." value={description} onChange={setDescription} rows={3} />
        <Input label="Target Keyword (optional)" placeholder="e.g. SEO tools" value={keyword} onChange={setKeyword} />
        <div><SubmitButton onClick={run} loading={loading} label="Check Meta Tags" /></div>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-6 fade-up">
          <div className="flex items-center gap-8 bg-[var(--surface)] border border-[var(--border)] rounded p-6">
            <div className="flex-shrink-0">
              <ScoreRing
                score={result.score}
                color={result.score >= 80 ? 'var(--accent)' : result.score >= 50 ? 'var(--amber)' : 'var(--red)'}
                size={100}
              />
            </div>
            <div className="space-y-1 font-mono text-sm">
              <div>Title: <span style={{ color: statusColor(result.titleStatus) }}>{result.titleLength} chars — {result.titleStatus}</span></div>
              <div>Description: <span style={{ color: statusColor(result.descStatus) }}>{result.descLength} chars — {result.descStatus}</span></div>
              <div>Title px width: <span className="text-[var(--amber)]">~{result.titleWidthPx}px</span> {result.titleWidthPx > 600 && <span className="text-[var(--red)]">(exceeds 600px limit)</span>}</div>
              {keyword && <>
                <div>KW in title: <span style={{ color: result.keywordInTitle ? 'var(--accent)' : 'var(--red)' }}>{result.keywordInTitle ? 'Yes' : 'No'}</span></div>
                <div>KW in desc: <span style={{ color: result.keywordInDesc ? 'var(--accent)' : 'var(--red)' }}>{result.keywordInDesc ? 'Yes' : 'No'}</span></div>
              </>}
            </div>
          </div>

          <div>
            <SectionLabel>Audit Results</SectionLabel>
            <IssueList issues={result.issues} passed={result.suggestions} />
          </div>
        </div>
      )}
    </div>
  );
}

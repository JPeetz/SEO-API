'use client';

import { useState } from 'react';
import { Input, SubmitButton, StatBox, SectionLabel, ErrorBox, Tag } from '@/components/ui/Elements';

export default function KeywordDensityTab() {
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!content.trim()) { setError('Content is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/seo/keyword-density', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, keyword }),
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

  const ratingColor = (r: string) =>
    r === 'good' ? 'var(--accent)' : r === 'high' ? 'var(--red)' : 'var(--amber)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl text-[var(--text)] mb-1">Keyword Density Analyzer</h2>
        <p className="text-sm text-[var(--dim)]">Analyze keyword frequency and density across your content.</p>
      </div>

      <div className="grid gap-4">
        <Input label="Content" placeholder="Paste your article content here..." value={content} onChange={setContent} rows={8} />
        <Input label="Target Keyword (optional)" placeholder="e.g. SEO optimization" value={keyword} onChange={setKeyword} />
        <div className="flex items-center gap-3">
          <SubmitButton onClick={run} loading={loading} label="Analyze Content" />
          {result && <Tag label={result.rating} type={result.rating === 'good' ? 'good' : result.rating === 'high' ? 'bad' : 'warn'} />}
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-6 fade-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total Words" value={result.totalWords} />
            <StatBox label="KW Count" value={result.count} />
            <StatBox label="KW Density" value={`${result.density}%`} color={ratingColor(result.rating)} />
            <StatBox label="Rating" value={result.rating.toUpperCase()} color={ratingColor(result.rating)} />
          </div>

          <div>
            <SectionLabel>Top Keywords</SectionLabel>
            <div className="border border-[var(--border)] rounded overflow-hidden">
              <table className="w-full text-sm font-mono">
                <thead className="bg-[var(--surface)] text-[var(--dim)] text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2.5 text-left">#</th>
                    <th className="px-4 py-2.5 text-left">Keyword</th>
                    <th className="px-4 py-2.5 text-right">Count</th>
                    <th className="px-4 py-2.5 text-right">Density</th>
                  </tr>
                </thead>
                <tbody>
                  {result.topKeywords.map((kw: any, i: number) => (
                    <tr key={kw.word} className="border-t border-[var(--border)] hover:bg-[var(--surface)]">
                      <td className="px-4 py-2.5 text-[var(--muted)]">{i + 1}</td>
                      <td className="px-4 py-2.5 text-[var(--text)]">{kw.word}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--amber)]">{kw.count}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--accent)]">{kw.density}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

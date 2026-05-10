'use client';
import { useState } from 'react';
import { Input, SubmitButton, StatBox, ScoreRing, SectionLabel, ErrorBox } from '@/components/ui/Elements';

export default function QuotabilityTab() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!content.trim()) { setError('Content is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/geo/quotability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  const rColor = (r: string) => r === 'strong' ? 'var(--accent)' : r === 'good' ? 'var(--amber)' : r === 'moderate' ? 'var(--dim)' : 'var(--red)';
  const scoreColor = (s: number) => s >= 70 ? 'var(--accent)' : s >= 45 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl mb-1">Quotability Score</h2>
        <p className="text-sm text-[var(--dim)]">Scores individual sentences for citation-worthiness. AI engines preferentially pull specific, assertive, stat-backed sentences.</p>
      </div>
      <div className="grid gap-4">
        <Input label="Content" placeholder="Paste article content..." value={content} onChange={setContent} rows={8} />
        <div><SubmitButton onClick={run} loading={loading} label="Score Quotability" /></div>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-6 fade-up">
          <div className="flex items-center gap-8 bg-[var(--surface)] border border-[var(--border)] rounded p-6">
            <ScoreRing score={result.compositeScore} color={rColor(result.rating)} size={100} />
            <div>
              <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">Composite Quotability</div>
              <div className="font-display font-bold text-3xl mb-1" style={{ color: rColor(result.rating) }}>{result.rating.charAt(0).toUpperCase() + result.rating.slice(1)}</div>
              <div className="text-sm font-mono text-[var(--dim)]">{result.totalSentencesAnalyzed} sentences · avg {result.avgQuotabilityScore}/100</div>
            </div>
          </div>

          <div>
            <SectionLabel>Top 5 Most Quotable Sentences</SectionLabel>
            <div className="space-y-3">
              {result.topSentences.map((s: any, i: number) => (
                <div key={i} className="border border-[var(--border)] rounded p-4 bg-[var(--surface)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest">#{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: scoreColor(s.score) }}>score: {s.score}</span>
                      <div className="flex gap-1">
                        {s.reasons.map((r: string) => (
                          <span key={r} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--dim)]">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text)] leading-relaxed">"{s.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

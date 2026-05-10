'use client';
import { useState } from 'react';
import { Input, SubmitButton, StatBox, ScoreRing, SectionLabel, ErrorBox } from '@/components/ui/Elements';

export default function EEATTab() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!content.trim()) { setError('Content is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/geo/eeat-signals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  const rColor = (r: string) => r === 'strong' ? 'var(--accent)' : r === 'good' ? 'var(--amber)' : r === 'moderate' ? 'var(--dim)' : 'var(--red)';
  const sColor = (s: number) => s >= 60 ? 'var(--accent)' : s >= 30 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl mb-1">E-E-A-T Signals</h2>
        <p className="text-sm text-[var(--dim)]">Experience, Expertise, Authority, Trust — the credibility signals AI engines and Google use to evaluate source quality.</p>
      </div>
      <div className="grid gap-4">
        <Input label="Content" placeholder="Paste article content..." value={content} onChange={setContent} rows={8} />
        <div><SubmitButton onClick={run} loading={loading} label="Analyze E-E-A-T" /></div>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-6 fade-up">
          <div className="flex items-center gap-8 bg-[var(--surface)] border border-[var(--border)] rounded p-6">
            <ScoreRing score={result.compositeScore} color={rColor(result.rating)} size={100} />
            <div>
              <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">E-E-A-T Composite</div>
              <div className="font-display font-bold text-3xl" style={{ color: rColor(result.rating) }}>{result.rating.charAt(0).toUpperCase() + result.rating.slice(1)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Experience" value={result.experienceScore} sub="first-hand signals" color={sColor(result.experienceScore)} />
            <StatBox label="Expertise" value={result.expertiseScore} sub="domain vocabulary" color={sColor(result.expertiseScore)} />
            <StatBox label="Authority" value={result.authorityScore} sub="citation markers" color={sColor(result.authorityScore)} />
            <StatBox label="Trust" value={result.trustScore} sub="nuance & caveats" color={sColor(result.trustScore)} />
          </div>

          {Object.entries(result.signals).some(([, v]) => (v as string[]).length > 0) && (
            <div>
              <SectionLabel>Detected Signal Phrases</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(result.signals).map(([dim, phrases]) => (
                  (phrases as string[]).length > 0 && (
                    <div key={dim}>
                      <div className="text-[10px] font-mono text-[var(--dim)] uppercase mb-2">{dim}</div>
                      <div className="flex flex-wrap gap-1">
                        {(phrases as string[]).map(p => (
                          <span key={p} className="text-[10px] font-mono px-2 py-0.5 border border-[var(--border)] rounded text-[var(--accent)]">"{p}"</span>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {result.gaps.length > 0 && (
            <div>
              <SectionLabel>Gaps to Address</SectionLabel>
              <div className="space-y-2">
                {result.gaps.map((g: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-[var(--red)]">
                    <span className="font-mono mt-0.5">✕</span><span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

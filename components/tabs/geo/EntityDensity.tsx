'use client';
import { useState } from 'react';
import { Input, SubmitButton, StatBox, ScoreRing, SectionLabel, ErrorBox, Tag } from '@/components/ui/Elements';

export default function EntityDensityTab() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!content.trim()) { setError('Content is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/geo/entity-density', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  const rColor = (r: string) => r === 'strong' ? 'var(--accent)' : r === 'good' ? 'var(--amber)' : r === 'moderate' ? 'var(--dim)' : 'var(--red)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl mb-1">Entity Density</h2>
        <p className="text-sm text-[var(--dim)]">Named entities, statistics, and factual claim density — the primary signals AI engines extract for citation decisions.</p>
      </div>
      <div className="grid gap-4">
        <Input label="Content" placeholder="Paste article content..." value={content} onChange={setContent} rows={8} />
        <div><SubmitButton onClick={run} loading={loading} label="Analyze Entities" /></div>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-6 fade-up">
          <div className="flex items-center gap-8 bg-[var(--surface)] border border-[var(--border)] rounded p-6">
            <ScoreRing score={result.score} color={rColor(result.rating)} size={100} />
            <div>
              <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">Entity Signal Score</div>
              <div className="font-display font-bold text-3xl mb-2" style={{ color: rColor(result.rating) }}>{result.rating.charAt(0).toUpperCase() + result.rating.slice(1)}</div>
              <Tag label={result.rating} type={result.rating === 'strong' || result.rating === 'good' ? 'good' : result.rating === 'moderate' ? 'warn' : 'bad'} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Named Entities" value={result.namedEntityCount} />
            <StatBox label="Statistics" value={result.statisticCount} />
            <StatBox label="Fact Markers" value={result.factMarkerCount} />
            <StatBox label="Citation Markers" value={result.citationMarkerCount} />
            <StatBox label="Date References" value={result.dateReferenceCount} />
            <StatBox label="Entity / 100 words" value={result.entityDensityPer100} color="var(--accent)" />
          </div>
          {result.topEntities.length > 0 && (
            <div>
              <SectionLabel>Detected Entities</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {result.topEntities.map((e: string) => (
                  <span key={e} className="px-2 py-1 text-xs font-mono border border-[var(--border)] rounded text-[var(--text)] bg-[var(--surface)]">{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

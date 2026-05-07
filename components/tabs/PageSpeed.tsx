'use client';

import { useState } from 'react';
import { NumberInput, SubmitButton, StatBox, ScoreRing, SectionLabel, ErrorBox, IssueList } from '@/components/ui/Elements';

export default function PageSpeedTab() {
  const [fields, setFields] = useState({
    lcp: '2.5', fid: '100', cls: '0.1',
    pageSize: '1000', httpRequests: '40', ttfb: '600',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (v: string) => setFields(f => ({ ...f, [k]: v }));

  async function run() {
    setLoading(true); setError(''); setResult(null);
    try {
      const body = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseFloat(v)]));
      const res = await fetch('/api/seo/page-speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    r === 'good' ? 'var(--accent)' : r === 'needs-improvement' ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl text-[var(--text)] mb-1">Page Speed Score</h2>
        <p className="text-sm text-[var(--dim)]">Estimate Core Web Vitals score based on key metrics.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NumberInput label="LCP" value={fields.lcp} onChange={set('lcp')} unit="seconds" min={0} step={0.1} />
        <NumberInput label="FID" value={fields.fid} onChange={set('fid')} unit="ms" min={0} step={10} />
        <NumberInput label="CLS" value={fields.cls} onChange={set('cls')} unit="score" min={0} step={0.01} />
        <NumberInput label="Page Size" value={fields.pageSize} onChange={set('pageSize')} unit="KB" min={0} />
        <NumberInput label="HTTP Requests" value={fields.httpRequests} onChange={set('httpRequests')} min={0} step={1} />
        <NumberInput label="TTFB" value={fields.ttfb} onChange={set('ttfb')} unit="ms" min={0} step={50} />
      </div>

      <div><SubmitButton onClick={run} loading={loading} label="Calculate Score" /></div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-6 fade-up">
          <div className="flex items-center gap-8 bg-[var(--surface)] border border-[var(--border)] rounded p-6">
            <div className="flex-shrink-0">
              <ScoreRing
                score={result.score}
                color={ratingColor(result.rating)}
                size={100}
              />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">Performance Score</div>
              <div className="font-display font-bold text-3xl mb-2" style={{ color: ratingColor(result.rating) }}>
                {result.rating === 'good' ? 'Good' : result.rating === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['lcp','fid','cls','ttfb'] as const).map(m => (
                  <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded border"
                    style={{
                      color: ratingColor((result as any)[`${m}Rating`]),
                      borderColor: ratingColor((result as any)[`${m}Rating`]),
                      background: `${ratingColor((result as any)[`${m}Rating`])}11`,
                    }}>
                    {m.toUpperCase()}: {(result as any)[`${m}Rating`].replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>Core Web Vitals Audit</SectionLabel>
            <IssueList issues={result.issues} passed={result.passedChecks} />
          </div>
        </div>
      )}
    </div>
  );
}

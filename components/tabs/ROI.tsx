'use client';

import { useState } from 'react';
import { NumberInput, SubmitButton, StatBox, SectionLabel, ErrorBox, Tag } from '@/components/ui/Elements';

export default function ROITab() {
  const [fields, setFields] = useState({
    searchVolume: '10000', position: '3', conversionRate: '2',
    revenuePerConversion: '50', monthlyInvestment: '1000', timeframe: '12',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (v: string) => setFields(f => ({ ...f, [k]: v }));

  async function run() {
    setLoading(true); setError(''); setResult(null);
    try {
      const body = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseFloat(v)]));
      const res = await fetch('/api/seo/roi', {
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

  const roiColor = (r: string) =>
    r === 'excellent' ? 'var(--accent)' : r === 'good' ? 'var(--amber)' : r === 'low' ? 'var(--dim)' : 'var(--red)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl text-[var(--text)] mb-1">SEO ROI Calculator</h2>
        <p className="text-sm text-[var(--dim)]">Estimate return on investment for your SEO efforts.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NumberInput label="Monthly Search Volume" value={fields.searchVolume} onChange={set('searchVolume')} min={0} />
        <NumberInput label="Target Position" value={fields.position} onChange={set('position')} min={1} max={10} step={1} />
        <NumberInput label="Conversion Rate" value={fields.conversionRate} onChange={set('conversionRate')} unit="%" min={0} max={100} step={0.1} />
        <NumberInput label="Revenue per Conversion" value={fields.revenuePerConversion} onChange={set('revenuePerConversion')} unit="$" min={0} />
        <NumberInput label="Monthly SEO Investment" value={fields.monthlyInvestment} onChange={set('monthlyInvestment')} unit="$" min={0} />
        <NumberInput label="Timeframe" value={fields.timeframe} onChange={set('timeframe')} unit="months" min={1} max={60} step={1} />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton onClick={run} loading={loading} label="Calculate ROI" />
        {result && <Tag label={result.rating} type={result.rating === 'excellent' || result.rating === 'good' ? 'good' : result.rating === 'low' ? 'neutral' : 'bad'} />}
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-6 fade-up">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">Total ROI</div>
              <div className="font-display font-bold text-5xl" style={{ color: roiColor(result.rating) }}>
                {result.roi > 0 ? '+' : ''}{result.roi}%
              </div>
              <div className="text-sm text-[var(--dim)] mt-2 font-mono">
                {result.breakEvenMonth ? `Break-even at month ${result.breakEvenMonth}` : 'No break-even within timeframe'}
              </div>
            </div>
            <div className="text-right font-mono text-sm space-y-1">
              <div><span className="text-[var(--dim)]">CTR (pos {fields.position}):</span> <span className="text-[var(--accent)]">{result.ctr}%</span></div>
              <div><span className="text-[var(--dim)]">Monthly visitors:</span> <span className="text-[var(--text)]">{result.monthlyVisitors.toLocaleString()}</span></div>
              <div><span className="text-[var(--dim)]">Monthly conversions:</span> <span className="text-[var(--text)]">{result.monthlyConversions}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Monthly Revenue" value={`$${result.monthlyRevenue.toLocaleString()}`} color="var(--accent)" />
            <StatBox label="Total Revenue" value={`$${result.totalRevenue.toLocaleString()}`} color="var(--accent)" />
            <StatBox label="Total Investment" value={`$${result.totalInvestment.toLocaleString()}`} color="var(--amber)" />
            <StatBox label="Net Profit" value={`$${result.netProfit.toLocaleString()}`} color={result.netProfit >= 0 ? 'var(--accent)' : 'var(--red)'} />
          </div>
        </div>
      )}
    </div>
  );
}

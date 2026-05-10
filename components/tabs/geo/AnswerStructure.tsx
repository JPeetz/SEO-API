'use client';
import { useState } from 'react';
import { Input, SubmitButton, StatBox, ScoreRing, SectionLabel, ErrorBox, IssueList } from '@/components/ui/Elements';

export default function AnswerStructureTab() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!content.trim()) { setError('Content is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/geo/answer-structure', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  const rColor = (r: string) => r === 'excellent' ? 'var(--accent)' : r === 'good' ? 'var(--amber)' : r === 'moderate' ? 'var(--dim)' : 'var(--red)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl mb-1">Answer Structure</h2>
        <p className="text-sm text-[var(--dim)]">Detects Q&A patterns, definitions, step structures, and direct answer signals that AI engines prefer to extract and cite.</p>
      </div>
      <div className="grid gap-4">
        <Input label="Content" placeholder="Paste article content..." value={content} onChange={setContent} rows={8} />
        <div><SubmitButton onClick={run} loading={loading} label="Analyze Structure" /></div>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="space-y-6 fade-up">
          <div className="flex items-center gap-8 bg-[var(--surface)] border border-[var(--border)] rounded p-6">
            <ScoreRing score={result.score} color={rColor(result.rating)} size={100} />
            <div>
              <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">Structure Score</div>
              <div className="font-display font-bold text-3xl" style={{ color: rColor(result.rating) }}>{result.rating.charAt(0).toUpperCase() + result.rating.slice(1)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Questions" value={result.questionCount} />
            <StatBox label="Definitions" value={result.definitionCount} />
            <StatBox label="Step Patterns" value={result.stepPatternCount} />
            <StatBox label="Direct Answers" value={result.directAnswerCount} />
            <StatBox label="Conclusion Markers" value={result.conclusionMarkerCount} />
            <StatBox label="List Density" value={`${result.listDensity}%`} />
          </div>
          <div>
            <SectionLabel>Structure Audit</SectionLabel>
            <IssueList issues={result.gaps} passed={result.strengths} />
          </div>
        </div>
      )}
    </div>
  );
}

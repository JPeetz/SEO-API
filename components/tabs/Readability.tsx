'use client';

import { useState } from 'react';
import { Input, SubmitButton, StatBox, ScoreRing, SectionLabel, ErrorBox, Tag } from '@/components/ui/Elements';

export default function ReadabilityTab() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!content.trim()) { setError('Content is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/seo/readability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
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

  const scoreColor = (s: number) =>
    s >= 70 ? 'var(--accent)' : s >= 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl text-[var(--text)] mb-1">Readability Score</h2>
        <p className="text-sm text-[var(--dim)]">Flesch Reading Ease and Kincaid Grade Level analysis.</p>
      </div>

      <div className="grid gap-4">
        <Input label="Content" placeholder="Paste your content here..." value={content} onChange={setContent} rows={8} />
        <div><SubmitButton onClick={run} loading={loading} label="Check Readability" /></div>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-6 fade-up">
          <div className="flex items-center gap-8 bg-[var(--surface)] border border-[var(--border)] rounded p-6">
            <div className="flex-shrink-0">
              <ScoreRing score={result.fleschScore} color={scoreColor(result.fleschScore)} size={100} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">Flesch Reading Ease</div>
              <div className="font-display font-bold text-3xl mb-2" style={{ color: scoreColor(result.fleschScore) }}>
                {result.fleschLabel}
              </div>
              <Tag
                label={result.fleschScore >= 70 ? 'Good for web' : result.fleschScore >= 50 ? 'Acceptable' : 'Too complex'}
                type={result.fleschScore >= 70 ? 'good' : result.fleschScore >= 50 ? 'warn' : 'bad'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Flesch Score" value={result.fleschScore} color={scoreColor(result.fleschScore)} />
            <StatBox label="Grade Level" value={result.gradeLevel} sub={result.gradeLevelLabel} />
            <StatBox label="Word Count" value={result.wordCount} />
            <StatBox label="Sentences" value={result.sentenceCount} />
            <StatBox label="Avg Sent. Length" value={result.avgSentenceLength} sub="words" />
            <StatBox label="Avg Syllables/Word" value={result.avgSyllablesPerWord} />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Input, SubmitButton, StatBox, SectionLabel, ErrorBox } from '@/components/ui/Elements';

export default function EvaluationPromptTab() {
  const [content, setContent] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  async function run() {
    if (!content.trim() || !targetQuery.trim()) { setError('Content and target query are required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/geo/evaluation-prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, targetQuery, includeSignals: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const sig = result?.algorithmicSignals;

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl mb-1">GEO Evaluation Prompt</h2>
        <p className="text-sm text-[var(--dim)]">
          Returns a pre-built prompt your AgentForge agent feeds into OpenRouter. <span className="text-[var(--accent)]">No LLM call on this server</span> — the reasoning runs inside your existing agent context.
        </p>
      </div>

      <div className="grid gap-4">
        <Input label="Target Query" placeholder='e.g. "best practices for AI agent SEO workflows"' value={targetQuery} onChange={setTargetQuery} />
        <Input label="Content" placeholder="Paste article content..." value={content} onChange={setContent} rows={8} />
        <div><SubmitButton onClick={run} loading={loading} label="Build Evaluation Prompt" /></div>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-6 fade-up">
          {/* Pre-computed signals summary */}
          {sig && (
            <div>
              <SectionLabel>Pre-computed Algorithmic Signals (embedded in prompt)</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Entity Score" value={sig.entityDensity.score} sub={sig.entityDensity.rating} color="var(--accent)" />
                <StatBox label="Structure Score" value={sig.answerStructure.score} sub={sig.answerStructure.rating} color="var(--amber)" />
                <StatBox label="Quotability" value={sig.quotability.compositeScore} sub={sig.quotability.rating} color="var(--accent)" />
                <StatBox label="E-E-A-T" value={sig.eeat.compositeScore} sub={sig.eeat.rating} color="var(--amber)" />
              </div>
            </div>
          )}

          {/* Token estimate */}
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-[var(--dim)]">Estimated prompt tokens:</span>
            <span className="text-[var(--accent)]">~{result.tokensEstimate}</span>
            <span className="text-[var(--dim)] text-xs">· fine for any OpenRouter model</span>
          </div>

          {/* System prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>System Prompt</SectionLabel>
              <button onClick={() => copy('sys', result.systemPrompt)} className="text-[10px] font-mono text-[var(--dim)] hover:text-[var(--accent)] transition-colors">
                {copied === 'sys' ? '✓ copied' : 'copy'}
              </button>
            </div>
            <pre className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 text-xs font-mono text-[var(--dim)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {result.systemPrompt}
            </pre>
          </div>

          {/* User prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>User Prompt (with embedded signals)</SectionLabel>
              <button onClick={() => copy('usr', result.userPrompt)} className="text-[10px] font-mono text-[var(--dim)] hover:text-[var(--accent)] transition-colors">
                {copied === 'usr' ? '✓ copied' : 'copy'}
              </button>
            </div>
            <pre className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 text-xs font-mono text-[var(--text)] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {result.userPrompt}
            </pre>
          </div>

          {/* Expected schema */}
          <div>
            <SectionLabel>Expected Output Schema (parse this from your LLM response)</SectionLabel>
            <pre className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 text-xs font-mono text-[var(--accent)] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result.expectedOutputSchema, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

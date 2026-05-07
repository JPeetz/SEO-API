'use client';

import { useState } from 'react';
import { Input, SubmitButton, StatBox, SectionLabel, ErrorBox } from '@/components/ui/Elements';

export default function SerpPreviewTab() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/seo/serp-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, description }),
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

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h2 className="font-display font-bold text-xl text-[var(--text)] mb-1">SERP Preview</h2>
        <p className="text-sm text-[var(--dim)]">Preview how your page will appear in Google search results.</p>
      </div>

      <div className="grid gap-4">
        <Input label="Page URL" placeholder="https://yoursite.com/page" value={url} onChange={setUrl} />
        <Input label={`Title Tag — ${title.length}/60`} placeholder="Your page title..." value={title} onChange={setTitle} />
        <Input label={`Meta Description — ${description.length}/160`} placeholder="Your meta description..." value={description} onChange={setDescription} rows={3} />
        <div><SubmitButton onClick={run} loading={loading} label="Generate Preview" /></div>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-6 fade-up">
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Title Length" value={`${result.titleLength} chars`} color={result.titleLength <= 60 ? 'var(--accent)' : 'var(--amber)'} />
            <StatBox label="Desc Length" value={`${result.descLength} chars`} color={result.descLength <= 160 ? 'var(--accent)' : 'var(--amber)'} />
            <StatBox label="Title Width" value={`~${result.titleWidthPx}px`} color={result.titleWidthPx <= 600 ? 'var(--accent)' : 'var(--red)'} />
          </div>

          <div>
            <SectionLabel>Google SERP Preview</SectionLabel>
            {/* Mock Google result */}
            <div className="bg-white rounded-xl p-5 max-w-xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-600 leading-none">{result.domain}</div>
                  <div className="text-xs text-gray-500">{result.serpPreview.breadcrumb} › page</div>
                </div>
              </div>
              <div className="text-[#1a0dab] text-xl font-normal leading-tight hover:underline cursor-pointer mb-1">
                {result.serpPreview.title}
                {result.titleTruncated && <span className="text-gray-500"> ···</span>}
              </div>
              <div className="text-sm text-gray-600 leading-snug">
                {result.serpPreview.description || 'No meta description provided.'}
                {result.descTruncated && '…'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

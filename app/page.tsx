'use client';

import { useState } from 'react';
import KeywordDensityTab from '@/components/tabs/KeywordDensity';
import ReadabilityTab from '@/components/tabs/Readability';
import MetaCheckTab from '@/components/tabs/MetaCheck';
import SerpPreviewTab from '@/components/tabs/SerpPreview';
import ROITab from '@/components/tabs/ROI';
import PageSpeedTab from '@/components/tabs/PageSpeed';

const TABS = [
  { id: 'keyword',   label: 'Keyword Density',  tag: 'KD' },
  { id: 'readability', label: 'Readability',    tag: 'RD' },
  { id: 'meta',      label: 'Meta Tags',         tag: 'MT' },
  { id: 'serp',      label: 'SERP Preview',      tag: 'SP' },
  { id: 'roi',       label: 'SEO ROI',           tag: 'ROI' },
  { id: 'speed',     label: 'Page Speed',        tag: 'PS' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Home() {
  const [active, setActive] = useState<TabId>('keyword');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--accent)] rounded flex items-center justify-center">
            <span className="text-[var(--bg)] text-xs font-bold font-mono">SEO</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-[var(--text)]">
              SEO API
            </h1>
            <p className="text-[10px] text-[var(--dim)] font-mono mt-0.5 uppercase tracking-widest">
              AgentForge · Analysis Tools
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--dim)] font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse inline-block" />
          API LIVE
        </div>
      </header>

      {/* API endpoint strip */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-6 py-2 font-mono text-xs text-[var(--dim)] overflow-x-auto whitespace-nowrap">
        <span className="text-[var(--accent)]">POST</span>
        {' '}/api/seo/
        <span className="text-[var(--amber)]">
          {active === 'keyword' ? 'keyword-density' :
           active === 'readability' ? 'readability' :
           active === 'meta' ? 'meta-check' :
           active === 'serp' ? 'serp-preview' :
           active === 'roi' ? 'roi' : 'page-speed'}
        </span>
        <span className="ml-6 text-[var(--muted)]">Content-Type: application/json</span>
      </div>

      {/* Tabs */}
      <nav className="border-b border-[var(--border)] px-6 flex gap-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`
              px-4 py-3 font-mono text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap
              ${active === tab.id
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--dim)] hover:text-[var(--text)] hover:border-[var(--muted)]'
              }
            `}
          >
            <span className="mr-1.5 opacity-50">[{tab.tag}]</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {active === 'keyword'    && <KeywordDensityTab />}
        {active === 'readability' && <ReadabilityTab />}
        {active === 'meta'       && <MetaCheckTab />}
        {active === 'serp'       && <SerpPreviewTab />}
        {active === 'roi'        && <ROITab />}
        {active === 'speed'      && <PageSpeedTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-4 flex items-center justify-between text-[var(--dim)] font-mono text-xs">
        <span>seo-api · github.com/JPeetz</span>
        <span className="cursor-blink">ready</span>
      </footer>
    </div>
  );
}

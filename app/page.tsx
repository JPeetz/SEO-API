'use client';

import { useState } from 'react';
import KeywordDensityTab from '@/components/tabs/KeywordDensity';
import ReadabilityTab from '@/components/tabs/Readability';
import MetaCheckTab from '@/components/tabs/MetaCheck';
import SerpPreviewTab from '@/components/tabs/SerpPreview';
import ROITab from '@/components/tabs/ROI';
import PageSpeedTab from '@/components/tabs/PageSpeed';
import EntityDensityTab from '@/components/tabs/geo/EntityDensity';
import AnswerStructureTab from '@/components/tabs/geo/AnswerStructure';
import QuotabilityTab from '@/components/tabs/geo/Quotability';
import EEATTab from '@/components/tabs/geo/EEATSignals';
import EvaluationPromptTab from '@/components/tabs/geo/EvaluationPrompt';

const SEO_TABS = [
  { id: 'keyword',     label: 'Keyword Density', tag: 'KD'  },
  { id: 'readability', label: 'Readability',      tag: 'RD'  },
  { id: 'meta',        label: 'Meta Tags',         tag: 'MT'  },
  { id: 'serp',        label: 'SERP Preview',      tag: 'SP'  },
  { id: 'roi',         label: 'SEO ROI',           tag: 'ROI' },
  { id: 'speed',       label: 'Page Speed',        tag: 'PS'  },
] as const;

const GEO_TABS = [
  { id: 'entity',    label: 'Entity Density',  tag: 'ED'  },
  { id: 'structure', label: 'Ans. Structure',  tag: 'AS'  },
  { id: 'quotable',  label: 'Quotability',     tag: 'QT'  },
  { id: 'eeat',      label: 'E-E-A-T',         tag: 'EAT' },
  { id: 'evalp',     label: 'Eval Prompt',     tag: 'EP'  },
] as const;

type TabId = typeof SEO_TABS[number]['id'] | typeof GEO_TABS[number]['id'];

const API_PATH: Record<TabId, string> = {
  keyword:     '/api/seo/keyword-density',
  readability: '/api/seo/readability',
  meta:        '/api/seo/meta-check',
  serp:        '/api/seo/serp-preview',
  roi:         '/api/seo/roi',
  speed:       '/api/seo/page-speed',
  entity:      '/api/geo/entity-density',
  structure:   '/api/geo/answer-structure',
  quotable:    '/api/geo/quotability',
  eeat:        '/api/geo/eeat-signals',
  evalp:       '/api/geo/evaluation-prompt',
};

export default function Home() {
  const [active, setActive] = useState<TabId>('keyword');
  const isGeo = GEO_TABS.some(t => t.id === active);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--accent)] rounded flex items-center justify-center">
            <span className="text-[var(--bg)] text-xs font-bold font-mono">SEO</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-[var(--text)]">SEO + GEO API</h1>
            <p className="text-[10px] text-[var(--dim)] font-mono mt-0.5 uppercase tracking-widest">AgentForge · Analysis Tools</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--dim)] font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse inline-block" />
          API LIVE
        </div>
      </header>

      {/* Active endpoint strip */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-6 py-2 font-mono text-xs text-[var(--dim)] overflow-x-auto whitespace-nowrap">
        <span className="text-[var(--accent)]">POST</span>
        {' '}
        <span className="text-[var(--amber)]">{API_PATH[active]}</span>
        <span className="ml-6 text-[var(--muted)]">Content-Type: application/json</span>
        {isGeo && <span className="ml-4 px-2 py-0.5 text-[9px] border border-[var(--accent)] text-[var(--accent)] rounded uppercase tracking-widest">GEO</span>}
      </div>

      {/* Tab navigation — split SEO / GEO */}
      <nav className="border-b border-[var(--border)] px-6 flex flex-col">
        {/* SEO row */}
        <div className="flex gap-0 overflow-x-auto">
          <span className="flex items-center pr-3 text-[9px] font-mono text-[var(--muted)] uppercase tracking-widest flex-shrink-0">SEO</span>
          {SEO_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2.5 font-mono text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap
                ${active === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--dim)] hover:text-[var(--text)] hover:border-[var(--muted)]'}`}
            >
              <span className="mr-1.5 opacity-50">[{tab.tag}]</span>{tab.label}
            </button>
          ))}
        </div>
        {/* GEO row */}
        <div className="flex gap-0 overflow-x-auto border-t border-[var(--border)]">
          <span className="flex items-center pr-3 text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest flex-shrink-0 opacity-70">GEO</span>
          {GEO_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2.5 font-mono text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap
                ${active === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--dim)] hover:text-[var(--text)] hover:border-[var(--muted)]'}`}
            >
              <span className="mr-1.5 opacity-50">[{tab.tag}]</span>{tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {active === 'keyword'     && <KeywordDensityTab />}
        {active === 'readability' && <ReadabilityTab />}
        {active === 'meta'        && <MetaCheckTab />}
        {active === 'serp'        && <SerpPreviewTab />}
        {active === 'roi'         && <ROITab />}
        {active === 'speed'       && <PageSpeedTab />}
        {active === 'entity'      && <EntityDensityTab />}
        {active === 'structure'   && <AnswerStructureTab />}
        {active === 'quotable'    && <QuotabilityTab />}
        {active === 'eeat'        && <EEATTab />}
        {active === 'evalp'       && <EvaluationPromptTab />}
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-4 flex items-center justify-between text-[var(--dim)] font-mono text-xs">
        <span>seo-geo-api · github.com/JPeetz</span>
        <span className="cursor-blink">ready</span>
      </footer>
    </div>
  );
}

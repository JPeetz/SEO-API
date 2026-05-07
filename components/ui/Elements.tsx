'use client';

interface ScoreRingProps {
  score: number;
  max?: number;
  color?: string;
  size?: number;
}

export function ScoreRing({ score, max = 100, color = 'var(--accent)', size = 96 }: ScoreRingProps) {
  const pct = Math.max(0, Math.min(1, score / max));
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text
        x="50" y="50"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: 'rotate(90deg) translate(0px, -100px)',
          fill: color,
          fontSize: '20px',
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
        }}
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}

interface StatBoxProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatBox({ label, value, sub, color = 'var(--text)' }: StatBoxProps) {
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded p-4">
      <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1">{label}</div>
      <div className="font-mono font-bold text-2xl leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--dim)] mt-1">{sub}</div>}
    </div>
  );
}

interface TagProps {
  label: string;
  type?: 'good' | 'warn' | 'bad' | 'neutral';
}

export function Tag({ label, type = 'neutral' }: TagProps) {
  const colors = {
    good:    'text-[var(--accent)] border-[var(--accent)] bg-[rgba(0,255,136,0.06)]',
    warn:    'text-[var(--amber)] border-[var(--amber)] bg-[rgba(255,184,0,0.06)]',
    bad:     'text-[var(--red)] border-[var(--red)] bg-[rgba(255,68,68,0.06)]',
    neutral: 'text-[var(--dim)] border-[var(--muted)] bg-transparent',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-mono border rounded uppercase tracking-wider ${colors[type]}`}>
      {label}
    </span>
  );
}

interface IssueListProps {
  issues: string[];
  passed: string[];
}

export function IssueList({ issues, passed }: IssueListProps) {
  return (
    <div className="space-y-1.5">
      {issues.map((i, idx) => (
        <div key={idx} className="flex items-start gap-2 text-sm text-[var(--red)]">
          <span className="font-mono mt-0.5">✕</span>
          <span>{i}</span>
        </div>
      ))}
      {passed.map((p, idx) => (
        <div key={idx} className="flex items-start gap-2 text-sm text-[var(--accent)]">
          <span className="font-mono mt-0.5">✓</span>
          <span>{p}</span>
        </div>
      ))}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-3 flex items-center gap-2">
      <span className="text-[var(--accent)]">▸</span>
      {children}
    </div>
  );
}

export function Input({
  label, placeholder, value, onChange, type = 'text', rows
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  rows?: number;
}) {
  const base = `
    w-full bg-[var(--surface-2)] border border-[var(--border)] rounded
    text-[var(--text)] text-sm font-mono px-3 py-2.5
    placeholder:text-[var(--muted)]
    focus:outline-none focus:border-[var(--accent)] transition-colors
  `;
  return (
    <div>
      <label className="block text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {rows ? (
        <textarea
          className={base + ' resize-none'}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
        />
      ) : (
        <input
          className={base}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function NumberInput({
  label, value, onChange, min, max, step, unit
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-[var(--dim)] uppercase tracking-widest mb-1.5">
        {label}{unit && <span className="ml-1 opacity-60">({unit})</span>}
      </label>
      <input
        type="number"
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text)] text-sm font-mono px-3 py-2.5 focus:outline-none focus:border-[var(--accent)] transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min} max={max} step={step}
      />
    </div>
  );
}

export function SubmitButton({ onClick, loading, label = 'Analyze' }: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="
        px-6 py-2.5 bg-[var(--accent)] text-[var(--bg)] font-mono font-bold text-sm
        rounded uppercase tracking-widest transition-all
        hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed
      "
    >
      {loading ? '...' : `▶ ${label}`}
    </button>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="border border-[var(--red)] bg-[rgba(255,68,68,0.06)] rounded p-4 text-[var(--red)] font-mono text-sm">
      ✕ {message}
    </div>
  );
}

// AI Deal Rating badge — Ryderr's market-price signal (a differentiator vs.
// listings-only competitors). Driven by `dealRating` from the listings API.
const MAP = {
  great: { label: 'Great Deal', cls: 'bg-trust-emerald text-white', icon: 'trending_down' },
  good: { label: 'Good Price', cls: 'bg-primary text-on-primary', icon: 'thumb_up' },
  fair: { label: 'Fair Price', cls: 'bg-surface-container-high text-on-surface', icon: 'check' },
  high: { label: 'Above Market', cls: 'bg-alert-orange text-white', icon: 'trending_up' },
};

export default function DealBadge({ rating, className = '' }) {
  const m = MAP[rating];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${m.cls} ${className}`}>
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
      {m.label}
    </span>
  );
}

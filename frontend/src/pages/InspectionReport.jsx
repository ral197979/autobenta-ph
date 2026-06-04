import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { carPlaceholder } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

// The report's category fields are freeform JSON. Normalize whatever shape the
// inspector saved into { status, items: [{label, ok}] }.
function normalize(cat) {
  if (!cat) return null;
  if (typeof cat === 'string') return { status: 'pass', items: [{ label: cat, ok: true }] };
  const status = cat.status || (cat.result) || 'pass';
  let items = [];
  if (Array.isArray(cat.items)) {
    items = cat.items.map((it) => typeof it === 'string' ? { label: it, ok: true } : { label: it.label || it.name, ok: it.ok ?? (it.status ? it.status === 'pass' : true) });
  } else {
    items = Object.entries(cat).filter(([k]) => !['status', 'result', 'score', 'notes'].includes(k))
      .map(([label, v]) => ({ label: label.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()), ok: v === true || v === 'pass' || v === 'ok' }));
  }
  return { status, notes: cat.notes, items };
}

const CATEGORIES = [
  ['engine', 'Engine & Powertrain', 'settings'],
  ['transmission', 'Transmission', 'settings_input_component'],
  ['exterior', 'Exterior & Body', 'directions_car'],
  ['interior', 'Interior & Comfort', 'airline_seat_recline_normal'],
  ['suspension', 'Suspension & Steering', 'altitude'],
  ['tires', 'Tires & Wheels', 'tire_repair'],
  ['electrical', 'Electronics & Systems', 'bolt'],
  ['floodSigns', 'Flood Check', 'water_drop'],
  ['accidentSigns', 'Accident Check', 'report'],
];

const RESULT = {
  pass: { cls: 'text-trust-emerald', dot: 'bg-trust-emerald', label: 'Pass' },
  warning: { cls: 'text-alert-orange', dot: 'bg-alert-orange', label: 'Warning' },
  fail: { cls: 'text-error', dot: 'bg-error', label: 'Fail' },
};

export default function InspectionReport() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => api.get(`/inspections/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-gutter-mobile py-3xl animate-pulse space-y-4"><div className="h-64 bg-surface-container rounded-2xl" /><div className="h-40 bg-surface-container rounded-2xl" /></div>;
  if (isError || !data) return <div className="text-center py-24"><p className="text-on-surface-variant text-body-lg">Inspection report not available.</p><Link to="/inspections" className="mt-4 inline-block bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">My Inspections</Link></div>;

  const { listing = {}, report } = data;
  const title = `${listing.year} ${listing.make} ${listing.model}`;
  if (!report) return (
    <div className="max-w-3xl mx-auto px-gutter-mobile md:px-gutter-desktop py-3xl text-center">
      <Icon name="pending_actions" className="text-6xl text-on-surface-variant/40 mb-3" />
      <h1 className="text-headline-md font-bold text-on-surface mb-2">{title}</h1>
      <p className="text-on-surface-variant">Inspection is <span className="capitalize font-semibold">{data.status}</span>. The full report will appear here once the inspection is completed.</p>
    </div>
  );

  const overall = RESULT[report.result] || RESULT.pass;
  const inspectedAt = report.inspectedAt ? new Date(report.inspectedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
  const cats = CATEGORIES.map(([key, label, icon]) => ({ label, icon, key, data: normalize(report[key]) })).filter(c => c.data);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-gutter-mobile md:px-gutter-desktop py-xl space-y-xl">
        {/* Header */}
        <div>
          <Link to={`/cars/${listing.id}`} className="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-on-surface mb-md transition-colors">
            <Icon name="chevron_left" className="text-[18px]" /> Back to listing
          </Link>
          {inspectedAt && <span className="text-on-surface-variant text-label-sm">Inspected: {inspectedAt}</span>}
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
        </div>

        {/* Certification score card */}
        <div className="bg-primary-container rounded-2xl p-xl flex items-center gap-xl">
          <div className="relative w-28 h-28 shrink-0">
            <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-white/15" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(report.overallScore / 100) * 97.4} 97.4`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-on-primary">
              <span className="text-headline-lg font-bold leading-none">{report.overallScore}</span>
              <span className="text-label-sm opacity-70">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-on-primary-container font-label-md uppercase tracking-widest mb-1">Certification Score</p>
            <p className="text-on-primary text-headline-md font-bold capitalize">{overall.label}</p>
            <p className="text-on-primary-container text-body-sm mt-1">180-point Ryderr inspection</p>
          </div>
        </div>

        {/* Detailed checklist */}
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">Detailed Inspection</h2>
            <div className="flex items-center gap-md text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-trust-emerald" /> Pass</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-alert-orange" /> Warn</span>
            </div>
          </div>

          {cats.map((c) => {
            const r = RESULT[c.data.status] || RESULT.pass;
            return (
              <div key={c.key} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg">
                <div className="flex items-center justify-between mb-md">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
                    <Icon name={c.icon} className="text-primary" /> {c.label}
                  </h3>
                  <span className={`flex items-center gap-1 text-label-md ${r.cls}`}><span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} /> {r.label}</span>
                </div>
                {c.data.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-lg gap-y-sm">
                    {c.data.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-border-subtle/60 last:border-0">
                        <span className="text-on-surface-variant font-body-md">{it.label}</span>
                        <Icon name={it.ok ? 'check_circle' : 'cancel'} className={`text-[18px] ${it.ok ? 'text-trust-emerald' : 'text-error'}`} filled />
                      </div>
                    ))}
                  </div>
                )}
                {c.data.notes && <p className="text-body-sm text-on-surface-variant mt-md italic">{c.data.notes}</p>}
              </div>
            );
          })}
        </div>

        {report.testDriveNotes && (
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm flex items-center gap-sm"><Icon name="route" className="text-primary" /> Test Drive Notes</h3>
            <p className="text-on-surface-variant text-body-md leading-relaxed">{report.testDriveNotes}</p>
          </div>
        )}

        {/* Certification */}
        <div className="bg-surface-container rounded-2xl p-lg flex items-start gap-md">
          <div className="w-12 h-12 rounded-full bg-trust-emerald/10 flex items-center justify-center shrink-0"><Icon name="verified" className="text-trust-emerald" filled /></div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Certified Verification</h3>
            <p className="text-on-surface-variant text-body-sm mt-1">This vehicle underwent a rigorous 180-point inspection under Ryderr's Quality Assurance protocols. All findings are documented as of the inspection date.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

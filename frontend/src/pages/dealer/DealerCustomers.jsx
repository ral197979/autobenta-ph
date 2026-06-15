import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';
import api from '../../api/client';
import { formatRelativeTime } from '../../utils/format';

function StatCard({ label, value }) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <span className="text-xs text-on-surface-variant font-medium">{label}</span>
      <span className="text-2xl font-bold text-on-surface">{value}</span>
    </div>
  );
}

export default function DealerCustomers() {
  const [search, setSearch] = useState('');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['dealer-customers'],
    queryFn: () => api.get('/dealers/me/customers').then(r => r.data),
  });

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.buyerName?.toLowerCase().includes(q) ||
      c.buyerEmail?.toLowerCase().includes(q) ||
      c.buyerPhone?.toLowerCase().includes(q)
    );
  });

  const totalWon = customers.reduce((sum, c) => sum + (c.wonLeads || 0), 0);
  const avgLeads = customers.length
    ? (customers.reduce((sum, c) => sum + (c.leadCount || 0), 0) / customers.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface">
          Customers
          <span className="ml-2 text-base font-normal text-on-surface-variant">({customers.length})</span>
        </h1>
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            className="input pl-9 text-sm py-2"
            aria-label="Search customers by name, email, or phone"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Customers" value={isLoading ? '—' : customers.length} />
        <StatCard label="Won Deals" value={isLoading ? '—' : totalWon} />
        <StatCard label="Avg Leads per Customer" value={isLoading ? '—' : avgLeads} />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-14 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-on-surface-variant">
          <Users className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">
            {search ? 'No customers match your search.' : 'No customers yet.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Contact</th>
                <th className="text-left px-5 py-3">Vehicles</th>
                <th className="text-center px-4 py-3">Leads</th>
                <th className="text-center px-4 py-3">Won</th>
                <th className="text-left px-5 py-3">Last Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardborder">
              {filtered.map((c, idx) => {
                const vehicles = c.vehicles || [];
                const shown = vehicles.slice(0, 2);
                const extra = vehicles.length - shown.length;

                return (
                  <tr key={idx} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-on-surface">{c.buyerName || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        {c.buyerEmail && (
                          <a href={`mailto:${c.buyerEmail}`} className="text-primary hover:underline text-xs block truncate max-w-[160px]">
                            {c.buyerEmail}
                          </a>
                        )}
                        {c.buyerPhone && (
                          <a href={`tel:${c.buyerPhone}`} className="text-primary hover:underline text-xs block">
                            {c.buyerPhone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-on-surface-variant space-y-0.5">
                        {shown.map((v, i) => (
                          <p key={i}>{v.year} {v.make} {v.model}</p>
                        ))}
                        {extra > 0 && (
                          <p className="text-[10px] text-on-surface-variant/70">+{extra} more</p>
                        )}
                        {vehicles.length === 0 && '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-on-surface font-medium">{c.leadCount ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      {c.wonLeads > 0 ? (
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                          {c.wonLeads}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-on-surface-variant">
                      {c.lastContactAt ? formatRelativeTime(c.lastContactAt) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

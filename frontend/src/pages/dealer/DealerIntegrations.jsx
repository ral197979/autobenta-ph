import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PenLine, FileSpreadsheet, Plug, X, Upload } from 'lucide-react';
import api from '../../api/client';

function StatusBadge({ connected }) {
  if (connected === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Connected
      </span>
    );
  }
  if (connected === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-slatetext">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      Not connected
    </span>
  );
}

function fmtDate(x) {
  if (!x) return null;
  return new Date(x).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CSVModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="card p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink">Import Inventory from CSV</h2>
          <button onClick={onClose} className="text-slatetext hover:text-ink transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="border-2 border-dashed border-cardborder rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-softbg">
          <Upload className="h-8 w-8 text-slatetext" />
          <p className="text-sm font-medium text-ink">Drag &amp; drop your file here</p>
          <p className="text-xs text-slatetext">Accepts .csv and .xlsx</p>
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-medium">
          Coming soon — CSV import wizard is not yet available.
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-cardborder px-4 py-2.5 text-sm font-semibold text-slatetext hover:bg-softbg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function DealerIntegrations() {
  const qc = useQueryClient();
  const [apiToken, setApiToken] = useState('');
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dealer-integrations'],
    queryFn: () => api.get('/dealer/integrations').then(r => r.data),
  });

  const connect = useMutation({
    mutationFn: () => api.post('/dealer/integrations/v8atlas/connect', { api_token: apiToken }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealer-integrations'] });
      setApiToken('');
      flash('V8Atlas connected successfully.');
    },
  });

  const disconnect = useMutation({
    mutationFn: () => api.post('/dealer/integrations/v8atlas/disconnect'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealer-integrations'] });
      setConfirmDisconnect(false);
      flash('V8Atlas disconnected.');
    },
  });

  const sync = useMutation({
    mutationFn: () => api.post('/dealer/integrations/v8atlas/sync'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealer-integrations'] });
      flash('Sync started.');
    },
  });

  const v8 = data?.v8atlas || {};
  const csv = data?.csv || {};
  const manual = data?.manual || {};

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Integrations</h1>
        <p className="text-sm text-slatetext mt-0.5">Connect your inventory source.</p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMsg}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load integration status. Please refresh.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Manual */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-deepblue/10 flex items-center justify-center shrink-0">
              <PenLine className="h-5 w-5 text-deepblue" />
            </div>
            <StatusBadge connected="active" />
          </div>
          <div>
            <h2 className="font-bold text-ink">Manual</h2>
            <p className="text-xs text-slatetext mt-1">
              Add and manage listings directly in Ryderr. No external system required.
            </p>
          </div>
          <div className="mt-auto pt-3 border-t border-cardborder text-xs text-slatetext">
            {isLoading ? (
              <div className="h-3 w-24 bg-softbg rounded animate-pulse" />
            ) : (
              <span>{manual.listingCount ?? 0} active listing{manual.listingCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Card 2: CSV / Excel */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-deepblue/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-deepblue" />
            </div>
            <StatusBadge connected={csv.lastImport ? 'active' : false} />
          </div>
          <div>
            <h2 className="font-bold text-ink">CSV / Excel</h2>
            <p className="text-xs text-slatetext mt-1">
              Bulk import your inventory from a spreadsheet. Upload once or import regularly.
            </p>
          </div>
          <button
            onClick={() => setShowCSVModal(true)}
            className="rounded-xl border border-cardborder px-4 py-2.5 text-sm font-semibold text-ink hover:bg-softbg transition-colors"
          >
            Import Inventory
          </button>
          <div className="mt-auto pt-3 border-t border-cardborder text-xs text-slatetext">
            {isLoading ? (
              <div className="h-3 w-28 bg-softbg rounded animate-pulse" />
            ) : csv.lastImport ? (
              <span>Last import: {fmtDate(csv.lastImport)}</span>
            ) : (
              <span>Never imported</span>
            )}
          </div>
        </div>

        {/* Card 3: V8Atlas DMS */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-xl bg-deepblue/10 flex items-center justify-center shrink-0">
              <Plug className="h-5 w-5 text-deepblue" />
            </div>
            <StatusBadge connected={v8.connected === true} />
          </div>
          <div>
            <h2 className="font-bold text-ink">V8Atlas DMS</h2>
            <p className="text-xs text-slatetext mt-1">
              Sync your V8Atlas inventory automatically. Leads route back to your V8Atlas CRM.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-softbg rounded animate-pulse" />
              <div className="h-8 bg-softbg rounded animate-pulse" />
            </div>
          ) : v8.connected ? (
            <div className="space-y-3">
              <div className="text-xs text-slatetext space-y-1">
                {v8.connectedAt && <p>Connected: {fmtDate(v8.connectedAt)}</p>}
                <p>Last sync: {v8.lastSync ? fmtDate(v8.lastSync) : 'Never'}</p>
              </div>
              <button
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
                className="w-full rounded-xl bg-deepblue px-4 py-2.5 text-sm font-bold text-white hover:bg-deepblue/90 disabled:opacity-50 transition-colors"
              >
                {sync.isPending ? 'Syncing…' : 'Sync Now'}
              </button>
              {!confirmDisconnect ? (
                <button
                  onClick={() => setConfirmDisconnect(true)}
                  className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-700">Disconnect V8Atlas?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => disconnect.mutate()}
                      disabled={disconnect.isPending}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {disconnect.isPending ? 'Disconnecting…' : 'Yes, disconnect'}
                    </button>
                    <button
                      onClick={() => setConfirmDisconnect(false)}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                className="input text-sm"
                placeholder="Paste your V8Atlas API token"
              />
              <button
                onClick={() => connect.mutate()}
                disabled={connect.isPending || !apiToken.trim()}
                className="w-full rounded-xl bg-deepblue px-4 py-2.5 text-sm font-bold text-white hover:bg-deepblue/90 disabled:opacity-50 transition-colors"
              >
                {connect.isPending ? 'Connecting…' : 'Connect'}
              </button>
              {connect.isError && (
                <p className="text-xs text-red-500">Connection failed. Check your token and try again.</p>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-cardborder text-xs text-slatetext">
            {isLoading ? (
              <div className="h-3 w-24 bg-softbg rounded animate-pulse" />
            ) : v8.lastSync ? (
              <span>Last sync: {fmtDate(v8.lastSync)}</span>
            ) : (
              <span>Never synced</span>
            )}
          </div>
        </div>
      </div>

      {showCSVModal && <CSVModal onClose={() => setShowCSVModal(false)} />}
    </div>
  );
}

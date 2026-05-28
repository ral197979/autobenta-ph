import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export default function DealerReminders() {
  const [showDone, setShowDone] = useState(false);
  const [form, setForm] = useState({ title: '', dueAt: '', notes: '' });
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: reminders = [] } = useQuery({
    queryKey: ['dealer-reminders-list', showDone],
    queryFn: () => api.get(`/dealer/analytics/reminders?done=${showDone}`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/dealer/analytics/reminders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealer-reminders-list'] });
      setForm({ title: '', dueAt: '', notes: '' });
      setShowForm(false);
    },
  });

  const doneMutation = useMutation({
    mutationFn: (id) => api.patch(`/dealer/analytics/reminders/${id}`, { isDone: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dealer-reminders-list'] }),
  });

  const overdue = (dueAt) => new Date(dueAt) < new Date();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Reminders</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-xs text-gray-500 hover:underline"
          >
            {showDone ? 'Show Pending' : 'Show Done'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg"
          >
            + New
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Reminder title"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-sm px-3 py-1.5 border rounded-lg">Cancel</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || !form.dueAt || createMutation.isPending}
              className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {reminders.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No reminders.</p>
        )}
        {reminders.map(r => (
          <div key={r.id} className={`flex items-start justify-between rounded-lg border p-3 ${r.isDone ? 'opacity-60' : overdue(r.dueAt) ? 'border-red-200 bg-red-50' : 'bg-white'}`}>
            <div>
              <p className="text-sm font-medium text-gray-800">{r.title}</p>
              <p className={`text-xs mt-0.5 ${overdue(r.dueAt) && !r.isDone ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                {new Date(r.dueAt).toLocaleString('en-PH')}
                {overdue(r.dueAt) && !r.isDone ? ' — Overdue' : ''}
              </p>
              {r.notes && <p className="text-xs text-gray-500 mt-1">{r.notes}</p>}
            </div>
            {!r.isDone && (
              <button
                onClick={() => doneMutation.mutate(r.id)}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 shrink-0 ml-2"
              >
                Done
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

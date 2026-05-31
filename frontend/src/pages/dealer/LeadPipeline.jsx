import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Phone, Mail, MessageSquare, Users, Car, PenLine, X, ChevronRight,
} from 'lucide-react';
import api from '../../api/client';
import { formatRelativeTime } from '../../utils/format';

const PIPELINE_STAGES = [
  { key: 'new',                  label: 'New',          color: 'bg-blue-100 text-blue-700' },
  { key: 'contacted',            label: 'Contacted',    color: 'bg-purple-100 text-purple-700' },
  { key: 'qualified',            label: 'Qualified',    color: 'bg-indigo-100 text-indigo-700' },
  { key: 'test_drive_scheduled', label: 'Test Drive',   color: 'bg-yellow-100 text-yellow-700' },
  { key: 'financing',            label: 'Financing',    color: 'bg-orange-100 text-orange-700' },
  { key: 'negotiating',          label: 'Negotiating',  color: 'bg-pink-100 text-pink-700' },
  { key: 'closed_won',           label: 'Won',          color: 'bg-emerald-100 text-emerald-700' },
  { key: 'closed_lost',          label: 'Lost',         color: 'bg-gray-100 text-gray-500' },
];

const ACTIVITY_ICONS = {
  call_made:           Phone,
  email_sent:          Mail,
  sms_sent:            MessageSquare,
  meeting_held:        Users,
  test_drive_completed: Car,
  note_added:          PenLine,
};

const ACTIVITY_TYPES = [
  { value: 'call_made',           label: 'Call' },
  { value: 'sms_sent',            label: 'SMS' },
  { value: 'email_sent',          label: 'Email' },
  { value: 'meeting_held',        label: 'Meeting' },
  { value: 'test_drive_completed',label: 'Test Drive' },
  { value: 'note_added',          label: 'Note' },
];

function LeadCard({ lead, isSelected, onClick }) {
  const stage = PIPELINE_STAGES.find(s => s.key === lead.status);
  const vehicle = lead.listing
    ? `${lead.listing.year} ${lead.listing.make} ${lead.listing.model}`
    : null;

  return (
    <div
      onClick={onClick}
      className={`card p-3 cursor-pointer hover:shadow-md transition-all border-l-2 ${
        isSelected ? 'border-l-deepblue bg-blue-50/40' : 'border-l-transparent'
      }`}
    >
      <p className="text-sm font-semibold text-ink truncate">{lead.buyerName}</p>
      {vehicle && <p className="text-xs text-slatetext truncate mt-0.5">{vehicle}</p>}
      <div className="flex items-center justify-between mt-2 gap-1">
        <span className="text-[10px] text-slatetext">{formatRelativeTime(lead.createdAt)}</span>
        {lead.leadScore > 0 && (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
            {lead.leadScore}
          </span>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ lead, onClose, onLeadUpdate }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState('activities');
  const [activityType, setActivityType] = useState('call_made');
  const [activityDesc, setActivityDesc] = useState('');
  const [notes, setNotes] = useState(lead.notes || '');
  const [followUp, setFollowUp] = useState(
    lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 10) : ''
  );

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['lead-activities', lead.id],
    queryFn: () => api.get(`/dealers/me/leads/${lead.id}/activities`).then(r => r.data),
  });

  const patchLead = useMutation({
    mutationFn: (data) => api.patch(`/dealers/me/leads/${lead.id}`, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['dealer-pipeline'] });
      onLeadUpdate(res.data);
    },
  });

  const logActivity = useMutation({
    mutationFn: (data) => api.post(`/dealers/me/leads/${lead.id}/activities`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-activities', lead.id] });
      setActivityDesc('');
    },
  });

  const currentStage = PIPELINE_STAGES.find(s => s.key === lead.status);
  const vehicle = lead.listing
    ? `${lead.listing.year} ${lead.listing.make} ${lead.listing.model}`
    : null;

  return (
    <div className="fixed top-16 right-0 bottom-0 w-80 bg-white border-l border-cardborder flex flex-col z-20 shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-cardborder flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{lead.buyerName}</p>
          {lead.buyerEmail && (
            <a href={`mailto:${lead.buyerEmail}`} className="text-xs text-electric hover:underline block truncate">
              {lead.buyerEmail}
            </a>
          )}
          {lead.buyerPhone && (
            <a href={`tel:${lead.buyerPhone}`} className="text-xs text-electric hover:underline block">
              {lead.buyerPhone}
            </a>
          )}
          {vehicle && <p className="text-xs text-slatetext mt-1 truncate">{vehicle}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded hover:bg-softbg">
          <X className="h-4 w-4 text-slatetext" />
        </button>
      </div>

      {/* Current stage badge */}
      <div className="px-4 pt-3">
        {currentStage && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${currentStage.color}`}>
            {currentStage.label}
          </span>
        )}
      </div>

      {/* Move to stage */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] font-semibold text-slatetext uppercase tracking-wider mb-2">Move to stage</p>
        <div className="flex flex-wrap gap-1">
          {PIPELINE_STAGES.filter(s => s.key !== lead.status).map(s => (
            <button
              key={s.key}
              onClick={() => patchLead.mutate({ status: s.key })}
              disabled={patchLead.isPending}
              className={`text-[10px] font-medium px-2 py-1 rounded-full border transition-colors hover:opacity-80 disabled:opacity-40 ${s.color}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up date */}
      <div className="px-4 pb-3 border-b border-cardborder">
        <p className="text-[10px] font-semibold text-slatetext uppercase tracking-wider mb-1">Follow-up date</p>
        <input
          type="date"
          value={followUp}
          onChange={e => setFollowUp(e.target.value)}
          onBlur={() => patchLead.mutate({ nextFollowUpAt: followUp || null })}
          className="input text-xs py-1"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cardborder">
        {['activities', 'notes'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'border-b-2 border-deepblue text-deepblue' : 'text-slatetext hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'activities' && (
          <div className="p-4 space-y-4">
            {/* Log activity form */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slatetext uppercase tracking-wider">Log Activity</p>
              <select
                value={activityType}
                onChange={e => setActivityType(e.target.value)}
                className="input text-xs py-1.5"
              >
                {ACTIVITY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <textarea
                value={activityDesc}
                onChange={e => setActivityDesc(e.target.value)}
                placeholder="Description..."
                rows={2}
                className="input text-xs py-1.5 resize-none"
              />
              <button
                onClick={() => logActivity.mutate({ type: activityType, description: activityDesc })}
                disabled={!activityDesc.trim() || logActivity.isPending}
                className="btn-primary text-xs py-1.5 w-full disabled:opacity-50"
              >
                {logActivity.isPending ? 'Saving...' : 'Log Activity'}
              </button>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-[10px] font-semibold text-slatetext uppercase tracking-wider mb-2">History</p>
              {activitiesLoading && (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 bg-softbg rounded animate-pulse" />
                  ))}
                </div>
              )}
              {!activitiesLoading && activities.length === 0 && (
                <p className="text-xs text-slatetext text-center py-4">No activities yet.</p>
              )}
              <div className="space-y-2">
                {activities.map(act => {
                  const Icon = ACTIVITY_ICONS[act.type] || PenLine;
                  return (
                    <div key={act.id} className="flex gap-2.5 items-start">
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-softbg flex items-center justify-center shrink-0">
                        <Icon className="h-3 w-3 text-slatetext" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-ink">{act.description || act.type.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-slatetext">{formatRelativeTime(act.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-semibold text-slatetext uppercase tracking-wider">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={6}
              className="input text-xs py-2 resize-none"
            />
            <button
              onClick={() => patchLead.mutate({ notes })}
              disabled={patchLead.isPending}
              className="btn-primary text-xs py-1.5 w-full disabled:opacity-50"
            >
              {patchLead.isPending ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeadPipeline() {
  const [selectedLead, setSelectedLead] = useState(null);
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['dealer-pipeline'],
    queryFn: () => api.get('/dealers/me/leads').then(r => r.data),
  });

  const grouped = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.key] = leads.filter(l => l.status === stage.key);
    return acc;
  }, {});

  const handleLeadUpdate = (updated) => {
    setSelectedLead(updated);
    qc.invalidateQueries({ queryKey: ['dealer-pipeline'] });
  };

  return (
    <div className={`relative ${selectedLead ? 'pr-80' : ''} transition-all`}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Lead Pipeline</h1>
        <span className="text-sm text-slatetext">{leads.length} leads</span>
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = grouped[stage.key] || [];
            return (
              <div key={stage.key} className="w-64 shrink-0 flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs text-slatetext font-medium bg-softbg rounded-full px-2 py-0.5">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[100px] rounded-xl bg-softbg/60 p-2">
                  {isLoading && (
                    <>
                      <div className="h-16 bg-white rounded-xl animate-pulse" />
                      <div className="h-16 bg-white rounded-xl animate-pulse opacity-60" />
                    </>
                  )}
                  {!isLoading && stageLeads.length === 0 && (
                    <p className="text-[10px] text-slatetext text-center py-4">Empty</p>
                  )}
                  {stageLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isSelected={selectedLead?.id === lead.id}
                      onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedLead && (
        <DetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onLeadUpdate={handleLeadUpdate}
        />
      )}
    </div>
  );
}

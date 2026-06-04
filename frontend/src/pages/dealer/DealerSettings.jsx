import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Globe, Clock, Save } from 'lucide-react';
import api from '../../api/client';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DealerSettings() {
  const { profile } = useOutletContext();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    businessName: profile?.businessName || '',
    address: profile?.address || '',
    city: profile?.city || '',
    phone: profile?.phone || '',
    website: profile?.website || '',
    description: profile?.description || '',
    businessHours: profile?.businessHours || {
      Monday: { open: '08:00', close: '18:00', closed: false },
      Tuesday: { open: '08:00', close: '18:00', closed: false },
      Wednesday: { open: '08:00', close: '18:00', closed: false },
      Thursday: { open: '08:00', close: '18:00', closed: false },
      Friday: { open: '08:00', close: '18:00', closed: false },
      Saturday: { open: '09:00', close: '17:00', closed: false },
      Sunday: { open: '10:00', close: '15:00', closed: true },
    },
  });
  const [saved, setSaved] = useState(false);

  const update = useMutation({
    mutationFn: (data) => api.patch('/dealers/me/profile', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealer-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const setHours = (day, field, value) =>
    setForm(f => ({
      ...f,
      businessHours: {
        ...f.businessHours,
        [day]: { ...f.businessHours[day], [field]: value },
      },
    }));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-on-surface">Dealer Settings</h1>

      {/* Business info */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm text-on-surface">Business Information</h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Business Name</label>
          <input
            type="text"
            value={form.businessName}
            onChange={e => set('businessName', e.target.value)}
            className="input text-sm"
            placeholder="e.g. ABC Motors Inc."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              className="input text-sm"
              placeholder="e.g. Quezon City"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
              <input
                type="text"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="input text-sm pl-9"
                placeholder="+63 917 000 0000"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="input text-sm pl-9"
              placeholder="Full address"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Website</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
            <input
              type="text"
              value={form.website}
              onChange={e => set('website', e.target.value)}
              className="input text-sm pl-9"
              placeholder="https://yourdealer.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            className="input text-sm resize-none"
            placeholder="Tell buyers about your dealership..."
          />
        </div>
      </div>

      {/* Business hours */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm text-on-surface">Business Hours</h2>
        </div>
        <div className="space-y-2">
          {DAYS.map(day => {
            const h = form.businessHours[day] || { open: '08:00', close: '18:00', closed: false };
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium text-on-surface shrink-0">{day}</span>
                <label className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
                  <input
                    type="checkbox"
                    checked={!!h.closed}
                    onChange={e => setHours(day, 'closed', e.target.checked)}
                    className="rounded"
                  />
                  Closed
                </label>
                {!h.closed && (
                  <>
                    <input
                      type="time"
                      value={h.open}
                      onChange={e => setHours(day, 'open', e.target.value)}
                      className="input text-xs py-1.5 w-28"
                    />
                    <span className="text-xs text-on-surface-variant">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={e => setHours(day, 'close', e.target.value)}
                      className="input text-xs py-1.5 w-28"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => update.mutate(form)}
          disabled={update.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {update.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Saved!</span>}
        {update.isError && <span className="text-sm text-red-500">Failed to save. Please try again.</span>}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle } from 'lucide-react';
import api from '../api/client';

const STEPS = ['Details', 'Specs', 'Photos', 'Review'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const INPUT =
  'w-full bg-surface border border-border-subtle rounded-xl px-md py-md text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-on-surface-variant/60';
const BTN_PRIMARY = 'bg-primary text-on-primary rounded-xl px-lg py-md font-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50';
const BTN_SECONDARY = 'rounded-xl border border-border-subtle text-on-surface px-lg py-md font-label-md hover:bg-surface-container transition-colors';

const TRUST = [
  { icon: 'groups', color: 'text-on-tertiary-container', title: 'Reach thousands', body: 'Your listing is shown to our database of active, qualified buyers across the Philippines.' },
  { icon: 'verified_user', color: 'text-trust-emerald', title: 'Verified status', body: "Build instant trust with the 'Ryderr Verified' badge — proven to increase sale speed." },
  { icon: 'speed', color: 'text-alert-orange', title: 'Sell faster', body: 'Transparent pricing and inspection-ready listings close in a fraction of the usual time.' },
];

export default function Sell() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [listingId, setListingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    make: '', model: '', year: CURRENT_YEAR, variant: '', plateEnding: '',
    mileage: '', price: '', negotiable: true, fuelType: 'gasoline',
    transmission: 'automatic', color: '', bodyType: '', location: '',
    city: '', region: '', condition: 'good', description: '',
    hasOrCr: true, orCrNotes: '', ownerCount: 1, serviceHistory: false,
    serviceNotes: '', hasAccident: false, accidentNotes: '', hasFlood: false, floodNotes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPhotos(p => [...p, ...newPreviews].slice(0, 20));
    setPhotoFiles(p => [...p, ...files].slice(0, 20));
  };

  const removePhoto = (idx) => {
    setPhotos(p => p.filter((_, i) => i !== idx));
    setPhotoFiles(p => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: listing } = await api.post('/listings', {
        ...form,
        year: parseInt(form.year),
        mileage: parseInt(form.mileage),
        price: parseFloat(form.price),
        ownerCount: parseInt(form.ownerCount),
      });
      setListingId(listing.id);
      if (photoFiles.length > 0) {
        const fd = new FormData();
        photoFiles.forEach(f => fd.append('photos', f));
        await api.post(`/listings/${listing.id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle className="w-16 h-16 text-trust-emerald mx-auto mb-4" />
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Listing Submitted!</h1>
      <p className="text-on-surface-variant mb-6">Your listing is under review and will be published shortly.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/dashboard')} className={BTN_PRIMARY}>Go to Dashboard</button>
        <button onClick={() => navigate(`/cars/${listingId}`)} className={BTN_SECONDARY}>View Listing</button>
      </div>
    </div>
  );

  const Field = ({ label, req, children }) => (
    <div className="space-y-xs">
      <label className="block text-label-sm font-label-sm text-on-surface-variant px-1">{label}{req && <span className="text-error ml-0.5">*</span>}</label>
      {children}
    </div>
  );

  const CheckboxField = ({ label, desc, checked, onChange }) => (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border-subtle text-primary focus:ring-primary bg-surface" />
      <div><p className="text-body-sm font-medium text-on-surface">{label}</p>{desc && <p className="text-xs text-on-surface-variant">{desc}</p>}</div>
    </label>
  );

  const STEP_TITLES = ['Vehicle Information', 'Specs & Condition', 'Photos', 'Review & Publish'];

  return (
    <div className="bg-surface">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        {/* Hero */}
        <section className="mb-3xl text-center md:text-left md:flex md:items-center md:gap-2xl">
          <div className="md:w-1/2">
            <h1 className="text-display-lg font-display-lg text-primary mb-md">List Your Car in Minutes</h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-lg">The most transparent and efficient way to sell your car in the Philippines. Reach thousands of verified buyers today.</p>
            <div className="flex flex-wrap gap-md justify-center md:justify-start">
              <div className="flex items-center gap-xs px-md py-sm bg-trust-emerald/10 text-trust-emerald rounded-full">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-label-sm font-label-sm">Verified Listing</span>
              </div>
              <div className="flex items-center gap-xs px-md py-sm bg-secondary-container text-on-secondary-container rounded-full">
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span className="text-label-sm font-label-sm">30k+ Weekly Buyers</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block md:w-1/2 relative">
            <div className="aspect-video rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-[#1e3a5f] to-[#0B1220] flex items-center justify-center">
              <span className="material-symbols-outlined text-white/30" style={{ fontSize: '96px' }}>sell</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-surface p-md rounded-lg shadow-lg border border-border-subtle flex items-center gap-md">
              <div className="bg-trust-emerald text-white p-sm rounded-full">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant">Instant Valuation</p>
                <p className="text-headline-sm font-headline-sm text-primary">Free AI estimate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form & progress */}
        <div className="max-w-3xl mx-auto">
          {/* Progress indicator */}
          <div className="flex justify-between items-start mb-xl relative">
            <div className="absolute top-5 left-0 w-full h-[2px] bg-surface-container-highest -z-10" />
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-xs bg-surface px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  i < step ? 'bg-trust-emerald text-white' : i === step ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>{i < step ? '✓' : i + 1}</div>
                <span className={`text-label-sm font-label-sm ${i === step ? 'text-primary' : 'text-on-surface-variant'}`}>{s}</span>
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-surface-container-lowest border border-border-subtle rounded-xl p-lg md:p-xl shadow-sm">
            <h3 className="text-headline-md font-headline-md text-primary mb-lg">{STEP_TITLES[step]}</h3>

            {step === 0 && (
              <div className="space-y-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <Field label="Make" req><input value={form.make} onChange={e => set('make', e.target.value)} className={INPUT} placeholder="Toyota" /></Field>
                  <Field label="Model" req><input value={form.model} onChange={e => set('model', e.target.value)} className={INPUT} placeholder="Vios" /></Field>
                  <Field label="Year" req>
                    <select value={form.year} onChange={e => set('year', e.target.value)} className={INPUT}>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                  <Field label="Variant / Trim"><input value={form.variant} onChange={e => set('variant', e.target.value)} className={INPUT} placeholder="1.3 XLE CVT" /></Field>
                  <Field label="Price (₱)" req><input type="number" value={form.price} onChange={e => set('price', e.target.value)} className={INPUT} placeholder="600000" /></Field>
                  <Field label="Mileage (km)" req><input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} className={INPUT} placeholder="50000" /></Field>
                  <Field label="City" req><input value={form.city} onChange={e => set('city', e.target.value)} className={INPUT} placeholder="Quezon City" /></Field>
                  <Field label="Region" req><input value={form.region} onChange={e => set('region', e.target.value)} className={INPUT} placeholder="NCR" /></Field>
                </div>
                <CheckboxField label="Price is negotiable" checked={form.negotiable} onChange={v => set('negotiable', v)} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <Field label="Fuel Type" req>
                    <select value={form.fuelType} onChange={e => set('fuelType', e.target.value)} className={INPUT}>
                      {[['gasoline', 'Gasoline'], ['diesel', 'Diesel'], ['hybrid', 'Hybrid'], ['electric', 'Electric'], ['lpg', 'LPG']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Transmission" req>
                    <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className={INPUT}>
                      <option value="automatic">Automatic</option>
                      <option value="manual">Manual</option>
                      <option value="cvt">CVT</option>
                    </select>
                  </Field>
                  <Field label="Condition" req>
                    <select value={form.condition} onChange={e => set('condition', e.target.value)} className={INPUT}>
                      {[['excellent', 'Excellent'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Body Type"><input value={form.bodyType} onChange={e => set('bodyType', e.target.value)} className={INPUT} placeholder="Sedan, SUV, Pickup..." /></Field>
                  <Field label="Color"><input value={form.color} onChange={e => set('color', e.target.value)} className={INPUT} placeholder="Silver" /></Field>
                  <Field label="Number of Owners">
                    <select value={form.ownerCount} onChange={e => set('ownerCount', e.target.value)} className={INPUT}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Description"><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className={`${INPUT} resize-none`} placeholder="Describe your car, its history, modifications, reason for selling..." /></Field>
                <div className="space-y-3 pt-2 border-t border-border-subtle">
                  <p className="text-body-sm font-semibold text-on-surface">Disclosures (required by law)</p>
                  <CheckboxField label="OR/CR is available" desc="Official Receipt and Certificate of Registration" checked={form.hasOrCr} onChange={v => set('hasOrCr', v)} />
                  <CheckboxField label="Has complete service history / PMS records" checked={form.serviceHistory} onChange={v => set('serviceHistory', v)} />
                  <div>
                    <CheckboxField label="Vehicle has been in an accident" desc="Please disclose for buyer safety" checked={form.hasAccident} onChange={v => set('hasAccident', v)} />
                    {form.hasAccident && <textarea value={form.accidentNotes} onChange={e => set('accidentNotes', e.target.value)} className={`${INPUT} resize-none mt-2 text-sm`} rows={2} placeholder="Describe the accident and repairs..." />}
                  </div>
                  <div>
                    <CheckboxField label="Vehicle has flood damage history" desc="Please disclose for buyer safety" checked={form.hasFlood} onChange={v => set('hasFlood', v)} />
                    {form.hasFlood && <textarea value={form.floodNotes} onChange={e => set('floodNotes', e.target.value)} className={`${INPUT} resize-none mt-2 text-sm`} rows={2} placeholder="Describe flood incident and repairs..." />}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-lg">
                <label className="border-2 border-dashed border-border-subtle rounded-xl p-xl flex flex-col items-center justify-center gap-md bg-surface-container-low hover:bg-surface-container hover:border-primary/50 transition-all cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                  </div>
                  <div className="text-center">
                    <p className="text-body-md font-semibold text-primary">Tap to upload photos</p>
                    <p className="text-body-sm text-on-surface-variant">Min. 5 high-quality photos recommended · first is the main image</p>
                  </div>
                  <input type="file" multiple accept="image/*" onChange={handlePhotoAdd} className="hidden" />
                </label>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-surface-container">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && <div className="absolute top-1 left-1 bg-primary text-on-primary text-xs px-1.5 py-0.5 rounded">Main</div>}
                        <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-surface-container rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-on-surface">Listing Summary</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-body-sm">
                    <span className="text-on-surface-variant">Vehicle</span><span className="font-medium text-on-surface">{form.year} {form.make} {form.model} {form.variant}</span>
                    <span className="text-on-surface-variant">Price</span><span className="font-medium text-primary">₱{parseInt(form.price || 0).toLocaleString()} {form.negotiable ? '(negotiable)' : ''}</span>
                    <span className="text-on-surface-variant">Mileage</span><span className="font-medium text-on-surface">{parseInt(form.mileage || 0).toLocaleString()} km</span>
                    <span className="text-on-surface-variant">Fuel / Trans.</span><span className="font-medium capitalize text-on-surface">{form.fuelType} / {form.transmission}</span>
                    <span className="text-on-surface-variant">Location</span><span className="font-medium text-on-surface">{form.city}, {form.region}</span>
                    <span className="text-on-surface-variant">Condition</span><span className="font-medium capitalize text-on-surface">{form.condition}</span>
                    <span className="text-on-surface-variant">Photos</span><span className="font-medium text-on-surface">{photos.length} photos</span>
                    <span className="text-on-surface-variant">OR/CR</span><span className="font-medium text-on-surface">{form.hasOrCr ? 'Available' : 'Not available'}</span>
                    {form.hasAccident && <><span className="text-on-surface-variant">Accident</span><span className="text-alert-orange">Disclosed</span></>}
                    {form.hasFlood && <><span className="text-on-surface-variant">Flood</span><span className="text-error">Disclosed</span></>}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">By submitting, you confirm all information is accurate and you agree to AutoBenta PH's terms of service.</p>
              </div>
            )}

            <div className="flex justify-between mt-xl pt-lg border-t border-border-subtle">
              <button onClick={() => setStep(p => p - 1)} disabled={step === 0} className={`${BTN_SECONDARY} disabled:opacity-40`}>← Back</button>
              {step < 3 ? (
                <button onClick={() => setStep(p => p + 1)} className={`${BTN_PRIMARY} flex items-center gap-sm`}>Next <span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className={BTN_PRIMARY}>{submitting ? 'Submitting...' : 'Submit Listing'}</button>
              )}
            </div>
          </div>
        </div>

        {/* Trust section */}
        <section className="mt-3xl grid grid-cols-1 md:grid-cols-3 gap-lg">
          {TRUST.map((t) => (
            <div key={t.title} className="bg-surface-container rounded-xl p-lg flex flex-col gap-md items-start">
              <div className="p-sm bg-surface rounded-lg">
                <span className={`material-symbols-outlined ${t.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
              </div>
              <h4 className="text-headline-sm font-headline-sm text-primary">{t.title}</h4>
              <p className="text-body-sm font-body-sm text-on-surface-variant">{t.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

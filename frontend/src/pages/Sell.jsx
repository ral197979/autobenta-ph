import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle } from 'lucide-react';
import api from '../api/client';

const STEPS = ['Vehicle Details', 'Specs & Condition', 'Photos', 'Review & Publish'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

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
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Listing Submitted!</h1>
      <p className="text-gray-500 mb-6">Your listing is under review and will be published shortly.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
        <button onClick={() => navigate(`/cars/${listingId}`)} className="btn-secondary">View Listing</button>
      </div>
    </div>
  );

  const Field = ({ label, req, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );

  const CheckboxField = ({ label, desc, checked, onChange }) => (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
      <div><p className="text-sm font-medium text-gray-700">{label}</p>{desc && <p className="text-xs text-gray-400">{desc}</p>}</div>
    </label>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">List Your Car</h1>
        <div className="flex gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i < step ? '✓' : i + 1}</div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-1 mx-1 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <p className="text-sm font-semibold text-gray-900">Step {step + 1}: {STEPS[step]}</p>
        </div>
      </div>

      <div className="card p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Make" req><input value={form.make} onChange={e => set('make', e.target.value)} className="input" placeholder="Toyota" /></Field>
              <Field label="Model" req><input value={form.model} onChange={e => set('model', e.target.value)} className="input" placeholder="Vios" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Year" req>
                <select value={form.year} onChange={e => set('year', e.target.value)} className="input">
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="Variant / Trim"><input value={form.variant} onChange={e => set('variant', e.target.value)} className="input" placeholder="1.3 XLE CVT" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (₱)" req><input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="input" placeholder="600000" /></Field>
              <Field label="Mileage (km)" req><input type="number" value={form.mileage} onChange={e => set('mileage', e.target.value)} className="input" placeholder="50000" /></Field>
            </div>
            <CheckboxField label="Price is negotiable" checked={form.negotiable} onChange={v => set('negotiable', v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" req><input value={form.city} onChange={e => set('city', e.target.value)} className="input" placeholder="Quezon City" /></Field>
              <Field label="Region" req><input value={form.region} onChange={e => set('region', e.target.value)} className="input" placeholder="NCR" /></Field>
            </div>
            <Field label="Full Location"><input value={form.location} onChange={e => set('location', e.target.value)} className="input" placeholder="Quezon City, Metro Manila" /></Field>
            <Field label="Plate Ending (last 2 digits, optional)"><input value={form.plateEnding} onChange={e => set('plateEnding', e.target.value)} className="input" maxLength={2} placeholder="e.g. 8" /></Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fuel Type" req>
                <select value={form.fuelType} onChange={e => set('fuelType', e.target.value)} className="input">
                  {[['gasoline', 'Gasoline'], ['diesel', 'Diesel'], ['hybrid', 'Hybrid'], ['electric', 'Electric'], ['lpg', 'LPG']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Transmission" req>
                <select value={form.transmission} onChange={e => set('transmission', e.target.value)} className="input">
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="cvt">CVT</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Condition" req>
                <select value={form.condition} onChange={e => set('condition', e.target.value)} className="input">
                  {[['excellent', 'Excellent'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Body Type"><input value={form.bodyType} onChange={e => set('bodyType', e.target.value)} className="input" placeholder="Sedan, SUV, Pickup..." /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Color"><input value={form.color} onChange={e => set('color', e.target.value)} className="input" placeholder="Silver" /></Field>
              <Field label="Number of Owners">
                <select value={form.ownerCount} onChange={e => set('ownerCount', e.target.value)} className="input">
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description"><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="input resize-none" placeholder="Describe your car, its history, modifications, reason for selling..." /></Field>
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Disclosures (required by law)</p>
              <CheckboxField label="OR/CR is available" desc="Official Receipt and Certificate of Registration" checked={form.hasOrCr} onChange={v => set('hasOrCr', v)} />
              <CheckboxField label="Has complete service history / PMS records" checked={form.serviceHistory} onChange={v => set('serviceHistory', v)} />
              <div>
                <CheckboxField label="Vehicle has been in an accident" desc="Please disclose for buyer safety" checked={form.hasAccident} onChange={v => set('hasAccident', v)} />
                {form.hasAccident && <textarea value={form.accidentNotes} onChange={e => set('accidentNotes', e.target.value)} className="input resize-none mt-2 text-sm" rows={2} placeholder="Describe the accident and repairs..." />}
              </div>
              <div>
                <CheckboxField label="Vehicle has flood damage history" desc="Please disclose for buyer safety" checked={form.hasFlood} onChange={v => set('hasFlood', v)} />
                {form.hasFlood && <textarea value={form.floodNotes} onChange={e => set('floodNotes', e.target.value)} className="input resize-none mt-2 text-sm" rows={2} placeholder="Describe flood incident and repairs..." />}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Upload up to 20 photos. First photo will be the main image.</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl py-10 cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload photos</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 10MB each</span>
              <input type="file" multiple accept="image/*" onChange={handlePhotoAdd} className="hidden" />
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded">Main</div>}
                    <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <h3 className="font-bold">Listing Summary</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Vehicle</span><span className="font-medium">{form.year} {form.make} {form.model} {form.variant}</span>
                <span className="text-gray-500">Price</span><span className="font-medium text-primary-700">₱{parseInt(form.price || 0).toLocaleString()} {form.negotiable ? '(negotiable)' : ''}</span>
                <span className="text-gray-500">Mileage</span><span className="font-medium">{parseInt(form.mileage || 0).toLocaleString()} km</span>
                <span className="text-gray-500">Fuel / Trans.</span><span className="font-medium capitalize">{form.fuelType} / {form.transmission}</span>
                <span className="text-gray-500">Location</span><span className="font-medium">{form.city}, {form.region}</span>
                <span className="text-gray-500">Condition</span><span className="font-medium capitalize">{form.condition}</span>
                <span className="text-gray-500">Photos</span><span className="font-medium">{photos.length} photos</span>
                <span className="text-gray-500">OR/CR</span><span className="font-medium">{form.hasOrCr ? 'Available' : 'Not available'}</span>
                {form.hasAccident && <><span className="text-gray-500">Accident</span><span className="text-orange-600">Disclosed</span></>}
                {form.hasFlood && <><span className="text-gray-500">Flood</span><span className="text-red-600">Disclosed</span></>}
              </div>
            </div>
            <p className="text-xs text-gray-400">By submitting, you confirm that all information is accurate and you agree to AutoBenta PH's terms of service.</p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
          <button onClick={() => setStep(p => p - 1)} disabled={step === 0} className="btn-secondary disabled:opacity-40">← Back</button>
          {step < 3 ? (
            <button onClick={() => setStep(p => p + 1)} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Listing'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Upload, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/client';

const STEPS = ['Upload Photos', 'AI Analysis', 'Review & Edit', 'Publish'];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${idx <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              idx < currentStep ? 'bg-blue-600 border-blue-600 text-white' :
              idx === currentStep ? 'border-blue-600 text-blue-600' :
              'border-gray-300 text-gray-400'
            }`}>
              {idx < currentStep ? <CheckCircle className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${idx === currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${idx < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AIListingWizard() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState({});
  const [dragOver, setDragOver] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: (imageUrls) => api.post('/ai-vision/draft', { imageUrls }).then(r => r.data),
    onSuccess: (data) => {
      setDraft(data);
      setForm({
        make: data.make || '',
        model: data.model || '',
        year: data.year || new Date().getFullYear(),
        mileage: data.mileage || '',
        condition: data.condition || 'good',
        color: data.color || '',
        bodyType: data.bodyType || '',
        hasAccident: data.hasAccident || false,
        accidentNotes: data.accidentNotes || '',
        hasFlood: false,
        hasOrCr: true,
        price: '',
        description: '',
        location: '',
        city: '',
        region: '',
        negotiable: true,
      });
      setStep(2);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const listing = await api.post('/listings', {
        ...form,
        aiDraftData: draft,
        sellerType: 'private',
      }).then(r => r.data);

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach(f => fd.append('photos', f));
        await api.post(`/listings/${listing.id}/photos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return listing;
    },
    onSuccess: (listing) => navigate(`/cars/${listing.id}`),
  });

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/')).slice(0, 20);
    setFiles(prev => [...prev, ...valid].slice(0, 20));
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target.result].slice(0, 20));
      reader.readAsDataURL(f);
    });
  };

  const handleAnalyze = () => {
    setStep(1);
    analyzeMutation.mutate(previews.slice(0, 3));
  };

  const FIELD = (label, key, type = 'text', opts) => (
    <div key={key}>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      {type === 'select' ? (
        <select
          value={form[key] || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
          />
          {opts?.label}
        </label>
      ) : (
        <input
          type={type}
          value={form[key] || ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Listing Wizard</h1>
        </div>
        <p className="text-gray-500 text-sm">Upload photos and let AI pre-fill your listing details</p>
      </div>

      <StepIndicator currentStep={step} />

      {/* Step 0: Upload Photos */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current.click()}
          >
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Drop photos here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Up to 20 photos · JPG, PNG, WebP</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">Main</span>
                  )}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setFiles(f => f.filter((_, j) => j !== i));
                      setPreviews(p => p.filter((_, j) => j !== i));
                    }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={files.length === 0}
            className="w-full mt-5 py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            Analyze with AI
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Analyzing */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Analyzing your photos...</h2>
          <p className="text-sm text-gray-500 mt-1">Detecting vehicle details, condition, and mileage</p>
        </div>
      )}

      {/* Step 2: Review & Edit draft */}
      {step === 2 && draft && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          {draft.partial && (
            <div className="flex gap-2 items-start bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">AI confidence was low on some fields — please review carefully.</p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">AI pre-filled with {draft.aiConfidence}% confidence</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {FIELD('Make', 'make')}
            {FIELD('Model', 'model')}
            {FIELD('Year', 'year', 'number')}
            {FIELD('Mileage (km)', 'mileage', 'number')}
            {FIELD('Color', 'color')}
            {FIELD('Body Type', 'bodyType')}
            {FIELD('Price (₱)', 'price', 'number')}
            {FIELD('Condition', 'condition', 'select', [
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' },
            ])}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {FIELD('City', 'city')}
            {FIELD('Region', 'region')}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Additional details about the vehicle..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {FIELD('Has OR/CR', 'hasOrCr', 'checkbox', { label: 'Has Official Receipt / CR' })}
            {FIELD('Accident History', 'hasAccident', 'checkbox', { label: 'Has accident history' })}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(0)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!form.make || !form.model || !form.price || !form.city}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              Review Listing
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Publish */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Review Your Listing</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="font-medium">{form.year} {form.make} {form.model}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-medium text-blue-600">₱{parseInt(form.price || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Mileage</span><span>{parseInt(form.mileage || 0).toLocaleString()} km</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Condition</span><span className="capitalize">{form.condition}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{form.city}, {form.region}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Photos</span><span>{files.length} photo{files.length !== 1 ? 's' : ''}</span></div>
          </div>

          {publishMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {publishMutation.error?.response?.data?.error || 'Failed to publish listing. Please try again.'}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm">
              Edit
            </button>
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const DOCS = [
  { key: 'cr', label: 'Certificate of Registration (CR)' },
  { key: 'or', label: 'Official Receipt (OR)' },
  { key: 'deed', label: 'Deed of Sale (optional)', optional: true },
];

function UploadSlot({ doc, file, onPick }) {
  return (
    <div className="space-y-xs">
      <label className="font-label-md text-label-md text-on-surface px-xs">{doc.label}</label>
      <label className={`group relative block border-2 border-dashed rounded-xl p-xl cursor-pointer transition-all active:scale-[0.99] ${file ? 'border-trust-emerald/50 bg-trust-emerald/5' : 'border-border-subtle bg-surface-container hover:border-primary'}`}>
        <div className="flex flex-col items-center gap-sm text-center">
          <Icon name={file ? 'task_alt' : 'upload_file'} className={`text-3xl ${file ? 'text-trust-emerald' : 'text-on-surface-variant'}`} filled={!!file} />
          {file ? (
            <p className="font-label-md text-label-md text-trust-emerald break-all">{file.name}</p>
          ) : (
            <>
              <p className="font-label-md text-label-md text-primary">Click to upload or drag &amp; drop</p>
              <p className="text-label-sm text-on-surface-variant">JPG, PNG, or PDF · max 10MB</p>
            </>
          )}
        </div>
        <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only" onChange={(e) => onPick(doc.key, e.target.files[0])} />
      </label>
    </div>
  );
}

export default function VehicleDocumentVerification() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const { data: listing } = useQuery({ queryKey: ['listing', listingId], queryFn: () => api.get(`/listings/${listingId}`).then(r => r.data) });

  const pick = (key, file) => setFiles((p) => ({ ...p, [key]: file }));

  const submit = async () => {
    setError(null);
    if (!files.cr || !files.or) return setError('Please upload both the Certificate of Registration and the Official Receipt.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('verificationType', 'vehicle');
      fd.append('listingId', listingId);
      const types = [];
      DOCS.forEach((d) => { if (files[d.key]) { fd.append('documents', files[d.key]); types.push(d.key); } });
      fd.append('documentTypes', types.join(','));
      await api.post('/verifications', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <Icon name="verified" className="text-6xl text-trust-emerald mb-4" filled />
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Documents Submitted</h1>
      <p className="text-on-surface-variant mb-6">Our team will verify your vehicle documents within 24–48 hours. Once approved, your listing earns a verified-ownership badge.</p>
      <div className="flex gap-3 justify-center">
        <Link to={`/cars/${listingId}`} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">View Listing</Link>
        <Link to="/dashboard" className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md">Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-2xl mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="flex items-center gap-md mb-md">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-surface-container transition-colors text-on-surface"><Icon name="arrow_back" /></button>
          <h1 className="text-headline-lg font-headline-lg text-primary">Vehicle Documents</h1>
        </div>
        <p className="text-on-surface-variant text-body-md mb-lg">Verify ownership of your vehicle to ensure a secure transaction for both parties.{listing ? ` (${listing.year} ${listing.make} ${listing.model})` : ''}</p>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-lg mb-lg flex items-start gap-md">
          <Icon name="info" className="text-primary shrink-0" />
          <div>
            <h3 className="font-label-md text-label-md text-on-surface mb-1">Why we need this</h3>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">Collecting the Certificate of Registration (CR) and Official Receipt (OR) prevents fraudulent listings and guarantees the vehicle title is clean and ready for transfer.</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg md:p-xl space-y-lg">
          {DOCS.map((d) => <UploadSlot key={d.key} doc={d} file={files[d.key]} onPick={pick} />)}
          {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}
          <button onClick={submit} disabled={submitting} className="w-full bg-primary text-on-primary py-md rounded-xl font-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="upload" className="text-[20px]" /> {submitting ? 'Uploading…' : 'Submit Documents'}
          </button>
          <p className="text-center text-label-sm text-on-surface-variant">Documents are encrypted and only used for verification.</p>
        </div>
      </main>
    </div>
  );
}

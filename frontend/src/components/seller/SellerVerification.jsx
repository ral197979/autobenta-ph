import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Upload, CheckCircle, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/client';

const VERIFICATION_TYPES = [
  {
    type: 'seller_identity',
    label: 'Seller Identity Verification',
    description: 'Verify your identity to earn the Verified Seller badge.',
    requiredDocs: [
      { type: 'government_id', label: 'Government-issued ID (front)' },
      { type: 'selfie', label: 'Selfie holding your ID' },
    ],
    badge: 'Verified Seller',
  },
  {
    type: 'dealer_business',
    label: 'Dealer Business Verification',
    description: 'Verify your dealership to earn the Verified Dealer badge.',
    requiredDocs: [
      { type: 'business_registration', label: 'SEC/DTI Business Registration' },
      { type: 'dealer_permit', label: 'Dealer Permit' },
      { type: 'proof_of_address', label: 'Proof of Business Address' },
    ],
    badge: 'Verified Dealer',
    dealerOnly: true,
  },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, label: 'Pending Review', color: 'text-alert-orange bg-alert-orange/10 border-alert-orange/30' },
  under_review: { icon: AlertCircle, label: 'Under Review', color: 'text-primary bg-primary/10 border-primary/30' },
  approved: { icon: CheckCircle, label: 'Approved', color: 'text-trust-emerald bg-trust-emerald/10 border-trust-emerald/30' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'text-error bg-error/10 border-error/30' },
  expired: { icon: AlertCircle, label: 'Expired', color: 'text-on-surface-variant bg-surface-container border-border-subtle' },
  suspended: { icon: XCircle, label: 'Suspended', color: 'text-alert-orange bg-alert-orange/10 border-alert-orange/30' },
};

function VerificationCard({ config, existingRequest, user }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(!existingRequest);
  const [files, setFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (config.dealerOnly && user?.role !== 'dealer' && user?.role !== 'admin') return null;

  const canSubmit = !existingRequest || ['rejected', 'expired'].includes(existingRequest.status);
  const statusConf = existingRequest ? STATUS_CONFIG[existingRequest.status] : null;

  const handleFileChange = (docType, file) => {
    setFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleSubmit = async () => {
    const missingDocs = config.requiredDocs.filter((d) => !files[d.type]);
    if (missingDocs.length > 0) {
      setError(`Please upload: ${missingDocs.map((d) => d.label).join(', ')}`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('verificationType', config.type);
      const docTypes = [];
      config.requiredDocs.forEach((d) => {
        if (files[d.type]) {
          formData.append('documents', files[d.type]);
          docTypes.push(d.type);
        }
      });
      formData.append('documentTypes', docTypes.join(','));

      await api.post('/verifications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries(['my-verifications']);
      setExpanded(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-border-subtle overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <BadgeCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-on-surface text-sm">{config.label}</p>
            <p className="text-xs text-on-surface-variant">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {statusConf && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusConf.color}`}>
              <statusConf.icon className="h-3 w-3" />
              {statusConf.label}
            </span>
          )}
          {!existingRequest && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-on-primary">Not Submitted</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-on-surface-variant" /> : <ChevronDown className="h-4 w-4 text-on-surface-variant" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border-subtle p-4 bg-surface-container space-y-4">
          {existingRequest?.status === 'approved' ? (
            <div className="rounded-xl border border-trust-emerald/30 bg-trust-emerald/10 p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-trust-emerald shrink-0" />
              <div>
                <p className="font-semibold text-trust-emerald text-sm">Verification approved</p>
                <p className="text-xs text-on-surface-variant">
                  Badge active until {existingRequest.expiresAt ? new Date(existingRequest.expiresAt).toLocaleDateString('en-PH') : 'N/A'}
                </p>
              </div>
            </div>
          ) : existingRequest?.status === 'rejected' ? (
            <div className="rounded-xl border border-error/30 bg-error/10 p-4">
              <p className="font-semibold text-error text-sm">Verification rejected</p>
              {existingRequest.rejectionReason && (
                <p className="text-xs text-on-surface-variant mt-1">{existingRequest.rejectionReason}</p>
              )}
              <p className="text-xs text-on-surface-variant mt-2">You may re-submit with corrected documents.</p>
            </div>
          ) : existingRequest ? (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="font-semibold text-primary text-sm">Your submission is being reviewed</p>
              <p className="text-xs text-on-surface-variant mt-1">Typically 24–48 hours. We will notify you once complete.</p>
            </div>
          ) : null}

          {canSubmit && (
            <>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Required Documents</p>
                <div className="space-y-3">
                  {config.requiredDocs.map((doc) => (
                    <label key={doc.type} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${files[doc.type] ? 'border-trust-emerald/40 bg-trust-emerald/10' : 'border-border-subtle bg-surface-container-lowest group-hover:border-primary/40'}`}>
                        {files[doc.type] ? <CheckCircle className="h-4 w-4 text-trust-emerald" /> : <Upload className="h-4 w-4 text-on-surface-variant" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-on-surface">{doc.label}</p>
                        {files[doc.type] && <p className="text-xs text-trust-emerald">{files[doc.type].name}</p>}
                      </div>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        className="sr-only"
                        onChange={(e) => handleFileChange(doc.type, e.target.files[0])}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-xs text-error">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerVerification({ user }) {
  const { data: requests } = useQuery({
    queryKey: ['my-verifications'],
    queryFn: () => api.get('/verifications/my').then((r) => r.data),
    enabled: !!user,
  });

  const requestsByType = (requests || []).reduce((acc, r) => {
    if (!acc[r.verificationType] || new Date(r.submittedAt) > new Date(acc[r.verificationType].submittedAt)) {
      acc[r.verificationType] = r;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {VERIFICATION_TYPES.map((config) => (
        <VerificationCard
          key={config.type}
          config={config}
          existingRequest={requestsByType[config.type] || null}
          user={user}
        />
      ))}
    </div>
  );
}

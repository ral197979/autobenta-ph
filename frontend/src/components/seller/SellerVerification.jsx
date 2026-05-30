import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Upload, CheckCircle, Clock, XCircle, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
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
    badgeColor: 'bg-deepblue/5 text-deepblue border-deepblue/20',
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
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dealerOnly: true,
  },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, label: 'Pending Review', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  under_review: { icon: AlertCircle, label: 'Under Review', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  approved: { icon: CheckCircle, label: 'Approved', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-600 bg-red-50 border-red-200' },
  expired: { icon: AlertCircle, label: 'Expired', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  suspended: { icon: XCircle, label: 'Suspended', color: 'text-orange-600 bg-orange-50 border-orange-200' },
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
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-softbg"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-deepblue/10">
            <BadgeCheck className="h-5 w-5 text-deepblue" />
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{config.label}</p>
            <p className="text-xs text-slatetext">{config.description}</p>
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
            <span className="rounded-full bg-deepblue px-2.5 py-1 text-xs font-semibold text-white">Not Submitted</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-slatetext" /> : <ChevronDown className="h-4 w-4 text-slatetext" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-cardborder p-4 bg-softbg space-y-4">
          {existingRequest?.status === 'approved' ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 text-sm">Verification approved</p>
                <p className="text-xs text-emerald-600">
                  Badge active until {existingRequest.expiresAt ? new Date(existingRequest.expiresAt).toLocaleDateString('en-PH') : 'N/A'}
                </p>
              </div>
            </div>
          ) : existingRequest?.status === 'rejected' ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800 text-sm">Verification rejected</p>
              {existingRequest.rejectionReason && (
                <p className="text-xs text-red-600 mt-1">{existingRequest.rejectionReason}</p>
              )}
              <p className="text-xs text-red-500 mt-2">You may re-submit with corrected documents.</p>
            </div>
          ) : existingRequest ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-semibold text-blue-800 text-sm">Your submission is being reviewed</p>
              <p className="text-xs text-blue-600 mt-1">Typically 24–48 hours. We will notify you once complete.</p>
            </div>
          ) : null}

          {canSubmit && (
            <>
              <div>
                <p className="text-xs font-semibold text-slatetext uppercase tracking-wide mb-3">Required Documents</p>
                <div className="space-y-3">
                  {config.requiredDocs.map((doc) => (
                    <label key={doc.type} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${files[doc.type] ? 'border-emerald-300 bg-emerald-50' : 'border-cardborder bg-white group-hover:border-deepblue/30'}`}>
                        {files[doc.type] ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Upload className="h-4 w-4 text-slatetext" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{doc.label}</p>
                        {files[doc.type] && <p className="text-xs text-emerald-600">{files[doc.type].name}</p>}
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
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-xl bg-deepblue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-deepblue/90 disabled:opacity-50"
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

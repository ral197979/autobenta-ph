import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Gauge, Fuel, Settings, Calendar, Users, Heart, Share2, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, MessageCircle, Wrench, CreditCard, Bot, Shield } from 'lucide-react';
import api from '../api/client';
import { formatPrice, formatMileage, formatRelativeTime, FUEL_LABELS, TRANSMISSION_LABELS, CONDITION_COLORS, CONDITION_LABELS } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function CarDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tab, setTab] = useState('details');

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then(r => r.data),
  });

  const { data: aiAnalysis } = useQuery({
    queryKey: ['ai-analysis', id],
    queryFn: () => api.get(`/ai/listing/${id}/analysis`).then(r => r.data),
    enabled: !!id,
  });

  const sendInquiry = async () => {
    if (!user) return navigate('/login');
    if (!inquiryMsg.trim()) return;
    try {
      await api.post('/inquiries', { listingId: id, message: inquiryMsg });
      setInquirySent(true);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to send inquiry');
    }
  };

  const requestInspection = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post('/inspections/request', { listingId: id, notes: 'Pre-purchase inspection requested via listing page.' });
      alert('Inspection request submitted! Our team will contact you soon.');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to request inspection');
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/buyer-assistant', { question: aiQuestion, listingId: id });
      setAiAnswer(data);
    } catch {
      setAiAnswer({ answer: 'AI assistant is currently unavailable. Please try again later.' });
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-96 bg-gray-200 rounded-xl mb-6" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3"><div className="h-8 bg-gray-200 rounded w-2/3" /><div className="h-10 bg-gray-200 rounded w-1/3" /></div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );

  if (!listing) return (
    <div className="text-center py-24"><p className="text-gray-500 text-xl">Listing not found.</p><Link to="/cars" className="btn-primary mt-4 inline-block">Browse Cars</Link></div>
  );

  const photos = listing.photos || [];
  const currentPhoto = photos[photoIdx]?.url || `https://placehold.co/800x500/e2e8f0/64748b?text=${encodeURIComponent(listing.make)}`;
  const fraudFlags = listing.fraudFlags || aiAnalysis?.fraudFlags || [];
  const hasInspection = listing.inspectionRequests?.some(r => r.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/cars" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to listings
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Photos + Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Photo gallery */}
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/10] bg-gray-100">
              <img src={currentPhoto} alt="" className="w-full h-full object-cover"
                onError={e => { e.target.src = `https://placehold.co/800x500/e2e8f0/64748b?text=${encodeURIComponent(listing.make)}`; }} />
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(p => (p - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setPhotoIdx(p => (p + 1) % photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"><ChevronRight className="w-5 h-5" /></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{photoIdx + 1} / {photos.length}</div>
                </>
              )}
              {hasInspection && <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-1 rounded-full"><CheckCircle className="w-4 h-4" /> Verified Inspected</div>}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 ${i === photoIdx ? 'border-primary-600' : 'border-transparent'}`}>
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="flex border-b border-gray-100">
              {['details', 'condition', 'ai'].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'ai' ? '🤖 AI Assistant' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === 'details' && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    ['Make', listing.make], ['Model', listing.model], ['Year', listing.year],
                    ['Variant', listing.variant || '—'], ['Mileage', formatMileage(listing.mileage)],
                    ['Fuel Type', FUEL_LABELS[listing.fuelType]], ['Transmission', TRANSMISSION_LABELS[listing.transmission]],
                    ['Color', listing.color || '—'], ['Body Type', listing.bodyType || '—'],
                    ['Owners', listing.ownerCount], ['City', listing.city], ['Region', listing.region],
                  ].map(([label, val]) => (
                    <div key={label}><p className="text-gray-400 text-xs">{label}</p><p className="font-medium text-gray-900">{val}</p></div>
                  ))}
                </div>
                {listing.description && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Description</p>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'condition' && (
              <div className="p-5 space-y-3 text-sm">
                {[
                  ['Condition', <span className={`badge ${CONDITION_COLORS[listing.condition]}`}>{CONDITION_LABELS[listing.condition]}</span>],
                  ['OR/CR Available', listing.hasOrCr ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Yes</span> : <span className="text-red-600">No</span>],
                  ['Service History', listing.serviceHistory ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Available</span> : 'Not available'],
                  ['Accident History', listing.hasAccident ? <span className="text-orange-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {listing.accidentNotes || 'Yes'}</span> : <span className="text-green-600">None disclosed</span>],
                  ['Flood History', listing.hasFlood ? <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {listing.floodNotes || 'Yes'}</span> : <span className="text-green-600">None disclosed</span>],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span>{val}</span>
                  </div>
                ))}

                {fraudFlags.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="font-medium text-orange-800 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Risk Flags Detected</p>
                    {fraudFlags.map((flag, i) => (
                      <p key={i} className={`text-xs flex items-start gap-1.5 mb-1 ${flag.severity === 'high' ? 'text-red-700' : flag.severity === 'medium' ? 'text-orange-700' : 'text-yellow-700'}`}>
                        <span className="shrink-0 mt-0.5">⚠️</span> {flag.message}
                      </p>
                    ))}
                  </div>
                )}

                {aiAnalysis && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-800 mb-2">AI Price Analysis</p>
                    <p className="text-sm text-blue-700">Estimated fair value: <strong>{formatPrice(aiAnalysis.estimatedPrice)}</strong></p>
                    <p className="text-xs text-blue-500 mt-1">Range: {formatPrice(aiAnalysis.priceLow)} – {formatPrice(aiAnalysis.priceHigh)}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'ai' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Bot className="w-4 h-4 text-primary-600" />
                  <span>Ask the AI buyer assistant anything about this car.</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Is this a good deal?', 'What should I check?', 'Check for flood damage?'].map(q => (
                    <button key={q} onClick={() => setAiQuestion(q)} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">{q}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask a question about this car..." className="input flex-1 text-sm" />
                  <button onClick={askAI} disabled={aiLoading} className="btn-primary text-sm whitespace-nowrap">{aiLoading ? '...' : 'Ask AI'}</button>
                </div>
                {aiAnswer && (
                  <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-sm">
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{aiAnswer.answer}</p>
                    {aiAnswer.checklist?.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-800 mb-2">Checklist:</p>
                        <ul className="space-y-1">
                          {aiAnswer.checklist.map((item, i) => <li key={i} className="flex gap-2 text-gray-600"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{item}</li>)}
                        </ul>
                      </div>
                    )}
                    {aiAnswer.negotiationTips?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-gray-800 mb-2">Negotiation Tips:</p>
                        <ul className="space-y-1">
                          {aiAnswer.negotiationTips.map((tip, i) => <li key={i} className="flex gap-2 text-gray-600"><span className="text-primary-600 shrink-0">💡</span>{tip}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Price & title */}
          <div className="card p-5">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{listing.year} {listing.make} {listing.model}</h1>
            {listing.variant && <p className="text-sm text-gray-500 mb-3">{listing.variant}</p>}
            <p className="text-3xl font-bold text-primary-700 mb-1">{formatPrice(listing.price)}</p>
            {listing.negotiable && <p className="text-xs text-green-600 mb-3">Price negotiable</p>}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{formatMileage(listing.mileage)}</span>
              <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{FUEL_LABELS[listing.fuelType]}</span>
              <span className="flex items-center gap-1"><Settings className="w-3 h-3" />{TRANSMISSION_LABELS[listing.transmission]}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.city}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatRelativeTime(listing.createdAt)}</span>
            </div>
          </div>

          {/* Inquiry */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Contact Seller</h3>
            {listing.seller && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700">{listing.seller.name?.charAt(0)}</div>
                <div>
                  <p className="font-medium text-sm">{listing.seller.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{listing.seller.role}</p>
                </div>
              </div>
            )}
            {listing.dealer?.isVerified && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-3"><Shield className="w-3 h-3" />{listing.dealer.businessName} — Verified Dealer</div>
            )}
            {inquirySent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Inquiry sent! The seller will contact you soon.
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={inquiryMsg}
                  onChange={e => setInquiryMsg(e.target.value)}
                  rows={3}
                  placeholder={`Hi, is the ${listing.year} ${listing.make} ${listing.model} still available?`}
                  className="input text-sm resize-none"
                />
                <button onClick={sendInquiry} className="w-full btn-primary flex items-center justify-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4" /> Send Inquiry
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card p-4 space-y-2">
            <button onClick={requestInspection} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
              <Wrench className="w-4 h-4" /> Request Inspection
            </button>
            <Link to={`/financing?listingId=${id}&price=${listing.price}`} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
              <CreditCard className="w-4 h-4" /> Get Financing Quote
            </Link>
            <Link to={`/compare?ids=${id}`} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm text-center">
              Compare This Car
            </Link>
          </div>

          {/* Views */}
          <div className="card p-4 text-center text-xs text-gray-400">
            <p>{listing.viewCount} views · {listing.inquiryCount} inquiries</p>
          </div>
        </div>
      </div>
    </div>
  );
}

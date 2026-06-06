import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { trackEvent } from '../utils/analytics';
import { formatPrice, formatMileage, formatRelativeTime, FUEL_LABELS, TRANSMISSION_LABELS, CONDITION_LABELS, carPlaceholder } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import ReadinessScore from '../components/ReadinessScore';
import VehicleHistoryCard from '../components/VehicleHistoryCard';
import MakeOfferModal from '../components/MakeOfferModal';
import BookTestDriveModal from '../components/BookTestDriveModal';

// Material Symbols icon helper (Stitch uses these throughout).
function Icon({ name, className = '', filled = false }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>
      {name}
    </span>
  );
}

const CARD = 'bg-surface-container-low border border-border-subtle rounded-2xl';

export default function CarDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [inspectionRequested, setInspectionRequested] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then(r => r.data),
  });

  const { data: aiAnalysis } = useQuery({
    queryKey: ['ai-analysis', id],
    queryFn: () => api.get(`/ai/listing/${id}/analysis`).then(r => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (listing?.id) {
      trackEvent('LISTING_VIEW', {
        listingId: listing.id,
        dealerId: listing.dealerId || undefined,
        idempotencyKey: `view_${listing.id}_${sessionStorage.getItem('abph_sid') || 'x'}`,
      });
    }
  }, [listing?.id]);

  const openInquiry = (template) => {
    setShowInquiry(true);
    if (template) setInquiryMsg(template);
    setTimeout(() => document.getElementById('inquiry-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

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
      setInspectionRequested(true);
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
    <div className="max-w-[1280px] mx-auto px-gutter-desktop py-3xl animate-pulse">
      <div className="aspect-[21/9] bg-surface-container rounded-2xl mb-3xl" />
      <div className="grid grid-cols-12 gap-3xl">
        <div className="col-span-12 lg:col-span-8 space-y-4"><div className="h-8 bg-surface-container rounded w-2/3" /><div className="h-40 bg-surface-container rounded-2xl" /></div>
        <div className="col-span-12 lg:col-span-4 h-80 bg-surface-container rounded-2xl" />
      </div>
    </div>
  );

  if (!listing) return (
    <div className="text-center py-24"><p className="text-on-surface-variant text-body-lg">Listing not found.</p><Link to="/cars" className="mt-4 inline-block bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link></div>
  );

  const photos = listing.photos || [];
  const mainPhoto = photos[photoIdx]?.url || carPlaceholder(listing.make);
  const fraudFlags = listing.fraudFlags || aiAnalysis?.fraudFlags || [];
  const completedInspection = listing.inspectionRequests?.find(r => r.status === 'completed');
  const hasInspection = !!completedInspection;
  const title = `${listing.year} ${listing.make} ${listing.model}`;

  const specs = [
    ['Year', listing.year],
    ['Mileage', formatMileage(listing.mileage)],
    ['Transmission', TRANSMISSION_LABELS[listing.transmission]],
    ['Fuel Type', FUEL_LABELS[listing.fuelType]],
    ['Body Type', listing.bodyType],
    ['Color', listing.color],
    ['Owners', listing.ownerCount],
    ['Condition', CONDITION_LABELS[listing.condition]],
  ].filter(([, v]) => v !== undefined && v !== null && v !== '');

  // Simple financing estimate — 30% down, 60 months, ~7.5% p.a.
  const down = Math.round(listing.price * 0.3);
  const principal = listing.price - down;
  const monthly = Math.round((principal * (1 + 0.075 * 5)) / 60);

  return (
    <div className="bg-surface">
      {/* Immersive hero gallery */}
      <section className="relative w-full overflow-hidden bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto relative group">
          <div className="aspect-[21/9] w-full overflow-hidden relative">
            <img src={mainPhoto} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              onError={e => { e.target.onerror = null; e.target.src = carPlaceholder(listing.make); }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-xl left-gutter-mobile right-gutter-mobile md:left-gutter-desktop md:right-gutter-desktop flex flex-col md:flex-row justify-between md:items-end gap-md">
              <div className="space-y-sm">
                <nav className="flex items-center gap-sm text-label-sm text-white/70 mb-xs">
                  <Link className="hover:text-white transition-colors" to="/">Home</Link>
                  <Icon name="chevron_right" className="text-[14px]" />
                  <Link className="hover:text-white transition-colors" to="/cars">Browse</Link>
                </nav>
                <h1 className="text-display-lg text-white drop-shadow">{title}</h1>
                <div className="flex gap-sm">
                  {hasInspection && (
                    <span className="bg-black/40 backdrop-blur-md text-trust-emerald px-3 py-1 rounded-full text-label-sm flex items-center gap-1 border border-trust-emerald/30">
                      <Icon name="verified" className="text-[14px]" filled /> Ryderr Certified
                    </span>
                  )}
                  {listing.featured && (
                    <span className="bg-black/40 backdrop-blur-md text-alert-orange px-3 py-1 rounded-full text-label-sm border border-alert-orange/30">Featured</span>
                  )}
                </div>
              </div>
              {photos.length > 0 && (
                <span className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-xl text-label-md font-bold flex items-center gap-2 text-white">
                  <Icon name="photo_library" className="text-[20px]" /> {photos.length} Photo{photos.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <main className="max-w-[1280px] mx-auto px-gutter-mobile md:px-gutter-desktop py-3xl grid grid-cols-12 gap-xl lg:gap-3xl">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-8 space-y-3xl">
          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-md overflow-x-auto hide-scrollbar py-sm">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  className={`flex-shrink-0 w-44 aspect-video rounded-xl overflow-hidden transition-all duration-300 ${i === photoIdx ? 'ring-2 ring-primary' : 'border border-border-subtle opacity-60 hover:opacity-100 hover:scale-105'}`}>
                  <img src={p.url} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Inspection Report */}
          {hasInspection ? (
            <section className={`${CARD} p-xl`}>
              <div className="flex flex-wrap items-center justify-between gap-xl mb-xl">
                <div className="flex items-center gap-xl">
                  <div className="w-20 h-20 rounded-full border-4 border-trust-emerald flex items-center justify-center relative">
                    <Icon name="verified" className="text-trust-emerald text-3xl" filled />
                  </div>
                  <div>
                    <h3 className="text-headline-sm font-bold text-on-surface">Inspection Report</h3>
                    <p className="text-on-surface-variant">Certified by Ryderr inspection engineers</p>
                  </div>
                </div>
                <Link to={`/inspections/${completedInspection.id}`} className="text-primary font-bold hover:bg-surface-container px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-border-subtle">
                  Full Report <Icon name="arrow_forward" className="text-[20px]" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
                {['Engine & Trans', 'Exterior Paint', 'Interior Cabin', 'Underchassis'].map((c) => (
                  <div key={c} className="flex items-center gap-md">
                    <Icon name="check_circle" className="text-trust-emerald" filled />
                    <span className="text-body-md text-on-surface">{c}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className={`${CARD} p-xl flex flex-wrap items-center justify-between gap-md`}>
              <div className="flex items-center gap-lg">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="build" className="text-primary text-2xl" />
                </div>
                <div>
                  <h3 className="text-headline-sm font-bold text-on-surface">Not yet inspected</h3>
                  <p className="text-on-surface-variant text-body-sm">Request a Ryderr 180-point pre-purchase inspection.</p>
                </div>
              </div>
              {inspectionRequested ? (
                <span className="text-trust-emerald font-bold flex items-center gap-1"><Icon name="check_circle" filled /> Requested</span>
              ) : (
                <button onClick={requestInspection} className="bg-surface-container-high border border-border-subtle text-primary px-lg py-sm rounded-xl font-label-md hover:bg-surface-container-highest transition-all">Request Inspection</button>
              )}
            </section>
          )}

          {/* Technical Specifications */}
          <section className="space-y-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md font-bold text-primary">Technical Specifications</h2>
              <span className="text-label-sm text-on-surface-variant">Listed {formatRelativeTime(listing.createdAt)}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
              {specs.map(([label, val]) => (
                <div key={label} className={`p-lg ${CARD} flex flex-col gap-sm transition-all duration-300 hover:bg-surface-container hover:border-primary/30 hover:-translate-y-1`}>
                  <span className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">{label}</span>
                  <span className="text-body-lg font-bold text-on-surface capitalize">{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Seller's Insight */}
          {(listing.description || true) && (
            <section className="space-y-xl">
              <h2 className="text-headline-md font-bold text-primary">Seller's Insight</h2>
              <div className={`${CARD} p-xl space-y-lg`}>
                {listing.description && (
                  <p className="text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <Insight icon="description" ok={listing.hasOrCr} label={listing.hasOrCr ? 'OR/CR available' : 'OR/CR not available'} />
                  <Insight icon="build" ok={listing.serviceHistory} label={listing.serviceHistory ? 'Complete service history' : 'No service records'} />
                  <Insight icon="report" ok={!listing.hasAccident} label={listing.hasAccident ? `Accident: ${listing.accidentNotes || 'disclosed'}` : 'No accident disclosed'} />
                  <Insight icon="water_drop" ok={!listing.hasFlood} label={listing.hasFlood ? `Flood: ${listing.floodNotes || 'disclosed'}` : 'No flood history'} />
                </div>
              </div>
            </section>
          )}

          {/* Risk flags + AI price analysis */}
          {(fraudFlags.length > 0 || aiAnalysis) && (
            <section className="space-y-md">
              {fraudFlags.length > 0 && (
                <div className="bg-alert-orange/10 border border-alert-orange/30 rounded-2xl p-xl">
                  <p className="font-bold text-alert-orange flex items-center gap-2 mb-2"><Icon name="warning" /> Risk Flags Detected</p>
                  {fraudFlags.map((flag, i) => <p key={i} className="text-body-sm text-on-surface-variant mb-1">• {flag.message}</p>)}
                </div>
              )}
              {aiAnalysis && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-xl">
                  <p className="font-bold text-primary mb-1 flex items-center gap-2"><Icon name="insights" /> AI Price Analysis</p>
                  <p className="text-body-md text-on-surface">Estimated fair value: <strong>{formatPrice(aiAnalysis.estimatedPrice)}</strong></p>
                  <p className="text-label-sm text-on-surface-variant mt-1">Range {formatPrice(aiAnalysis.priceLow)} – {formatPrice(aiAnalysis.priceHigh)}</p>
                </div>
              )}
            </section>
          )}

          {/* AI Buyer Assistant */}
          <section className="space-y-xl">
            <h2 className="text-headline-md font-bold text-primary">Ask Ryderr AI</h2>
            <div className={`${CARD} p-xl space-y-md`}>
              <div className="flex flex-wrap gap-2">
                {['Is this a good deal?', 'What should I check?', 'Check for flood damage?'].map(q => (
                  <button key={q} onClick={() => setAiQuestion(q)} className="text-label-sm bg-surface-container hover:bg-surface-container-high text-on-surface px-3 py-1.5 rounded-full transition-colors">{q}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask anything about this car…" className="flex-1 bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none" />
                <button onClick={askAI} disabled={aiLoading} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 disabled:opacity-50">{aiLoading ? '…' : 'Ask AI'}</button>
              </div>
              {aiAnswer && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-body-sm">
                  <p className="text-on-surface whitespace-pre-wrap">{aiAnswer.answer}</p>
                  {aiAnswer.checklist?.length > 0 && (
                    <ul className="mt-3 space-y-1">{aiAnswer.checklist.map((it, i) => <li key={i} className="flex gap-2 text-on-surface-variant"><Icon name="check_circle" className="text-trust-emerald text-[18px]" filled /> {it}</li>)}</ul>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Vehicle history */}
          <VehicleHistoryCard listing={listing} />
        </div>

        {/* Right sticky sidebar */}
        <aside className="col-span-12 lg:col-span-4 relative">
          <div className="lg:sticky lg:top-24 space-y-lg">
            {/* Main action card */}
            <div className={`${CARD} p-xl shadow-2xl space-y-xl`}>
              <div className="space-y-md border-b border-border-subtle pb-lg">
                <div className="flex justify-between items-start gap-2">
                  <h2 className="text-headline-sm font-bold text-on-surface">{title}</h2>
                  <button className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant" aria-label="Share"><Icon name="share" /></button>
                </div>
                <div className="flex items-baseline gap-sm flex-wrap">
                  <span className="text-display-lg font-bold text-primary tracking-tight">{formatPrice(listing.price)}</span>
                  {listing.negotiable && <span className="text-label-sm text-on-surface-variant font-bold uppercase tracking-widest">Negotiable</span>}
                </div>
              </div>

              {user?.id === listing.sellerId ? (
                <Link to={`/listings/${id}/edit`} className="w-full bg-primary text-on-primary py-4 rounded-xl text-label-md font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10">
                  <Icon name="edit" className="text-[20px]" /> Edit Your Listing
                </Link>
              ) : (
                <div className="space-y-md">
                  <button onClick={() => openInquiry('')} className="w-full bg-primary text-on-primary py-4 rounded-xl text-label-md font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10">
                    <Icon name="payments" className="text-[20px]" /> Inquire Now
                  </button>
                  <button onClick={() => (user ? setShowOffer(true) : navigate('/login'))} className="w-full bg-surface-container-high border border-border-subtle text-primary py-4 rounded-xl text-label-md font-bold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                    <Icon name="gavel" className="text-[20px]" /> {offerSent ? 'Offer Sent ✓' : 'Make an Offer'}
                  </button>
                  <button onClick={() => (user ? setShowBooking(true) : navigate('/login'))} className="w-full bg-surface-container-high border border-border-subtle text-primary py-4 rounded-xl text-label-md font-bold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                    <Icon name="event" className="text-[20px]" /> {bookingDone ? 'Booking Requested ✓' : 'Book a Test Drive'}
                  </button>
                </div>
              )}

              {/* Seller row */}
              {(listing.seller || listing.dealer) && (
                <div className="pt-md flex items-center gap-md border-t border-border-subtle">
                  <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xl border border-border-subtle">
                    {(listing.dealer?.businessName || listing.seller?.name || 'S').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm">
                      <Link to={`/seller/${listing.sellerId}`} className="font-bold text-on-surface truncate hover:text-primary transition-colors">{listing.dealer?.businessName || listing.seller?.name}</Link>
                      {listing.dealer?.isVerified && <span className="bg-trust-emerald/10 text-trust-emerald text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-trust-emerald/20">Verified</span>}
                    </div>
                    <p className="text-label-sm text-on-surface-variant capitalize">{listing.seller?.role || 'Seller'}</p>
                  </div>
                </div>
              )}

              {/* Inquiry box */}
              {showInquiry && (
                <div id="inquiry-box" className="border-t border-border-subtle pt-md">
                  {inquirySent ? (
                    <div className="bg-trust-emerald/10 border border-trust-emerald/30 rounded-xl p-3 text-body-sm text-trust-emerald flex items-center gap-2">
                      <Icon name="check_circle" filled /> Inquiry sent! The seller will contact you soon.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea value={inquiryMsg} onChange={e => setInquiryMsg(e.target.value)} rows={3}
                        placeholder={`Hi, is the ${title} still available?`}
                        className="w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none resize-none" />
                      <button onClick={sendInquiry} className="w-full bg-primary text-on-primary py-sm rounded-xl font-label-md flex items-center justify-center gap-2 hover:opacity-90">
                        <Icon name="send" className="text-[18px]" /> Send Inquiry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transfer readiness */}
            <ReadinessScore listing={listing} />

            {/* Financing calculator */}
            <div className={`${CARD} p-xl space-y-lg`}>
              <h3 className="text-label-md font-bold text-on-surface flex items-center gap-2"><Icon name="calculate" className="text-[20px] text-primary" /> Financing Calculator</h3>
              <div className="space-y-md">
                <div className="flex justify-between text-label-sm text-on-surface-variant">
                  <span>Downpayment (30%)</span>
                  <span className="text-primary font-bold">{formatPrice(down)}</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[30%]" />
                </div>
                <div className="p-lg bg-surface-container rounded-xl border border-border-subtle flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-label-sm text-on-surface-variant/70">Estimated Monthly</span>
                    <span className="text-headline-sm font-bold text-primary">{formatPrice(monthly)}</span>
                  </div>
                  <span className="text-label-sm bg-primary text-on-primary px-3 py-1.5 rounded-lg font-bold">60 Mos</span>
                </div>
              </div>
              <Link to={`/financing?listingId=${id}&price=${listing.price}`} className="block w-full text-center text-label-sm font-bold text-primary hover:underline transition-all">Get Pre-Approved Online</Link>
            </div>

            {/* Trust points */}
            <div className={`${CARD} p-lg space-y-md`}>
              <TrustPoint icon="security" title="Secure Transaction" body="Funds held in Ryderr Escrow until vehicle delivery." />
              <TrustPoint icon="verified_user" title="Authenticity Guaranteed" body="VIN-checked and paper-verified by our legal team." />
              <Link to={`/ownership-transfer?listingId=${id}`} className="flex items-start gap-md group">
                <div className="p-2 bg-primary/10 rounded-lg"><Icon name="fact_check" className="text-primary" /></div>
                <div>
                  <span className="block text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">Ownership Transfer</span>
                  <span className="text-body-sm text-on-surface-variant leading-relaxed">LTO requirements, fees, and document checklist →</span>
                </div>
              </Link>
            </div>

            <div className={`${CARD} p-4 text-center text-label-sm text-on-surface-variant`}>
              {listing.viewCount} views · {listing.inquiryCount} inquiries
            </div>

            {user?.id !== listing.sellerId && (
              <Link to={`/report-dispute?listingId=${id}`} className="flex items-center justify-center gap-1.5 text-label-sm text-on-surface-variant hover:text-error transition-colors">
                <Icon name="flag" className="text-[16px]" /> Report this listing
              </Link>
            )}
          </div>
        </aside>
      </main>

      {showOffer && (
        <MakeOfferModal
          listing={listing}
          onClose={() => setShowOffer(false)}
          onSubmitted={() => { setShowOffer(false); setOfferSent(true); }}
        />
      )}
      {showBooking && (
        <BookTestDriveModal
          listing={listing}
          onClose={() => setShowBooking(false)}
          onBooked={() => { setShowBooking(false); setBookingDone(true); }}
        />
      )}
    </div>
  );
}

function Insight({ icon, ok, label }) {
  return (
    <div className="flex items-center gap-sm text-on-surface">
      <Icon name={ok ? 'check_circle' : icon} className={ok ? 'text-trust-emerald text-[18px]' : 'text-alert-orange text-[18px]'} filled={ok} />
      <span className="text-body-md">{label}</span>
    </div>
  );
}

function TrustPoint({ icon, title, body }) {
  return (
    <div className="flex items-start gap-md">
      <div className="p-2 bg-trust-emerald/10 rounded-lg"><Icon name={icon} className="text-trust-emerald" /></div>
      <div>
        <span className="block text-label-md font-bold text-on-surface">{title}</span>
        <span className="text-body-sm text-on-surface-variant leading-relaxed">{body}</span>
      </div>
    </div>
  );
}

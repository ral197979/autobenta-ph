import { BookOpen, Lock, ExternalLink } from 'lucide-react';

// Provider abstraction — future integrations slot in here
const PROVIDERS = {
  mock: {
    name: 'AutoBenta History',
    available: true,
    fetch: async (/* plateOrChassis */) => ({
      ownerCount: null,
      registrationHistory: [],
      incidents: [],
      dataSource: 'mock',
    }),
  },
  // Future: lto, carfax_ph, etc.
};

// Client-side history card — data from listing fields until real integration ships
export default function VehicleHistoryCard({ listing }) {
  if (!listing) return null;

  const hasDisclosures = listing.hasAccident || listing.hasFlood || listing.ownerCount > 2;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-container-lowest overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-on-surface">Vehicle History</h3>
        {listing.vehicleHistoryAvailable ? (
          <span className="ml-auto rounded-full bg-trust-emerald/15 px-2 py-0.5 text-[11px] font-bold text-trust-emerald">
            Available
          </span>
        ) : (
          <span className="ml-auto rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
            Seller-disclosed
          </span>
        )}
      </div>

      <div className="p-5 space-y-3 text-sm">
        {/* Owner count */}
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Previous owners</span>
          <span className="font-semibold text-on-surface">{listing.ownerCount ?? '—'}</span>
        </div>

        {/* OR/CR */}
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">OR/CR on file</span>
          <span className={`font-semibold ${listing.hasOrCr ? 'text-trust-emerald' : 'text-error'}`}>
            {listing.hasOrCr ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Service history */}
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant">Service records</span>
          <span className={`font-semibold ${listing.serviceHistory ? 'text-trust-emerald' : 'text-on-surface-variant'}`}>
            {listing.serviceHistory ? 'Available' : 'Not available'}
          </span>
        </div>

        {/* Disclosures */}
        {hasDisclosures && (
          <div className="rounded-lg bg-alert-orange/10 border border-alert-orange/30 p-3">
            <p className="text-xs font-semibold text-alert-orange mb-1.5">Seller disclosures</p>
            <ul className="space-y-1">
              {listing.hasAccident && (
                <li className="text-xs text-on-surface-variant">
                  Accident history: {listing.accidentNotes || 'Disclosed by seller'}
                </li>
              )}
              {listing.hasFlood && (
                <li className="text-xs text-on-surface-variant">
                  Flood exposure: {listing.floodNotes || 'Disclosed by seller'}
                </li>
              )}
              {listing.ownerCount > 2 && (
                <li className="text-xs text-on-surface-variant">
                  {listing.ownerCount} previous owners
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Future full report */}
        <div className="rounded-lg border border-border-subtle bg-surface-container px-4 py-3 flex items-center gap-3">
          <Lock className="h-4 w-4 shrink-0 text-on-surface-variant" />
          <div>
            <p className="text-xs font-semibold text-on-surface">Full LTO history report</p>
            <p className="text-[11px] text-on-surface-variant">Integration with LTO data providers is in progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

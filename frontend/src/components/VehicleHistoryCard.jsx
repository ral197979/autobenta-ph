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
    <div className="rounded-2xl border border-cardborder bg-white overflow-hidden">
      <div className="flex items-center gap-3 border-b border-cardborder px-5 py-4">
        <BookOpen className="h-5 w-5 text-deepblue" />
        <h3 className="font-bold text-ink">Vehicle History</h3>
        {listing.vehicleHistoryAvailable ? (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            Available
          </span>
        ) : (
          <span className="ml-auto rounded-full bg-softbg px-2 py-0.5 text-[11px] font-semibold text-slatetext">
            Seller-disclosed
          </span>
        )}
      </div>

      <div className="p-5 space-y-3 text-sm">
        {/* Owner count */}
        <div className="flex items-center justify-between">
          <span className="text-slatetext">Previous owners</span>
          <span className="font-semibold text-ink">{listing.ownerCount ?? '—'}</span>
        </div>

        {/* OR/CR */}
        <div className="flex items-center justify-between">
          <span className="text-slatetext">OR/CR on file</span>
          <span className={`font-semibold ${listing.hasOrCr ? 'text-emerald-600' : 'text-red-500'}`}>
            {listing.hasOrCr ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Service history */}
        <div className="flex items-center justify-between">
          <span className="text-slatetext">Service records</span>
          <span className={`font-semibold ${listing.serviceHistory ? 'text-emerald-600' : 'text-slatetext'}`}>
            {listing.serviceHistory ? 'Available' : 'Not available'}
          </span>
        </div>

        {/* Disclosures */}
        {hasDisclosures && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1.5">Seller disclosures</p>
            <ul className="space-y-1">
              {listing.hasAccident && (
                <li className="text-xs text-amber-800">
                  Accident history: {listing.accidentNotes || 'Disclosed by seller'}
                </li>
              )}
              {listing.hasFlood && (
                <li className="text-xs text-amber-800">
                  Flood exposure: {listing.floodNotes || 'Disclosed by seller'}
                </li>
              )}
              {listing.ownerCount > 2 && (
                <li className="text-xs text-amber-800">
                  {listing.ownerCount} previous owners
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Future full report */}
        <div className="rounded-lg border border-cardborder bg-softbg px-4 py-3 flex items-center gap-3">
          <Lock className="h-4 w-4 shrink-0 text-slatetext" />
          <div>
            <p className="text-xs font-semibold text-ink">Full LTO history report</p>
            <p className="text-[11px] text-slatetext">Integration with LTO data providers is in progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

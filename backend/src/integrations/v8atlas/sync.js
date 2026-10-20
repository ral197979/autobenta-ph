'use strict';
const prisma = require("../../lib/prisma");
const { V8AtlasInventoryProvider } = require('./inventory');
const provider = new V8AtlasInventoryProvider();

/**
 * Sync inventory from V8Atlas for a single dealer.
 * Upserts listings by externalId. Does not delete listings on mismatch
 * (dealer may have Ryderr-only listings too).
 */
async function syncDealerInventory(dealer) {
  const results = { upserted: 0, errors: 0 };
  try {
    const vehicles = await provider.pullInventory(dealer);
    for (const v of vehicles) {
      try {
        await prisma.vehicleListing.upsert({
          where:  { externalId_dealerId: { externalId: v.externalId, dealerId: dealer.id } },
          update: {
            make: v.make, model: v.model, year: v.year, price: v.price,
            mileage: v.mileage, status: v.status, description: v.description,
          },
          create: {
            sellerId:        dealer.userId,
            dealerId:        dealer.id,
            inventorySource: 'V8ATLAS',
            externalId:      v.externalId,
            sellerType:      'dealer',
            location:        dealer.city,
            city:            dealer.city,
            region:          'NCR',
            ...v,
          },
        });
        results.upserted++;
      } catch (e) {
        console.error(`V8Atlas sync: upsert failed for vehicle ${v.externalId}:`, e.message);
        results.errors++;
      }
    }
  } catch (e) {
    console.error(`V8Atlas sync failed for dealer ${dealer.id}:`, e.message);
    results.errors++;
  }
  return results;
}

/**
 * Run sync for ALL V8Atlas-connected dealers.
 * Called by a scheduled job (cron or Render cron).
 */
async function syncAllV8AtlasDealers() {
  const dealers = await prisma.dealer.findMany({
    where: { sourceType: 'V8ATLAS' },
  });
  console.log(`V8Atlas sync: found ${dealers.length} connected dealers`);

  const summary = { dealers: 0, upserted: 0, errors: 0 };
  for (const dealer of dealers) {
    const r = await syncDealerInventory(dealer);
    summary.dealers++;
    summary.upserted += r.upserted;
    summary.errors   += r.errors;
  }

  console.log('V8Atlas sync complete:', summary);
  return summary;
}

module.exports = { syncDealerInventory, syncAllV8AtlasDealers };

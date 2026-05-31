// V8Atlas adapter — implements all four DealerNetwork provider interfaces.
// Registered as 'v8atlas' provider when V8ATLAS_ENABLED=true.
// All V8Atlas-specific logic is isolated here; AutoBentaPH core never imports this directly.

const { DealerProvider } = require('../dealerNetwork/DealerProvider');
const { InventoryProvider } = require('../dealerNetwork/InventoryProvider');
const { LeadProvider } = require('../dealerNetwork/LeadProvider');
const { TrustProvider } = require('../dealerNetwork/TrustProvider');
const { AnalyticsProvider } = require('../dealerNetwork/AnalyticsProvider');

const BASE_URL = process.env.V8ATLAS_BASE_URL;
const API_KEY = process.env.V8ATLAS_API_KEY;
const WEBHOOK_SECRET = process.env.V8ATLAS_WEBHOOK_SECRET;

async function v8atlasRequest(method, path, body = null) {
  if (!BASE_URL || !API_KEY) throw new Error('V8Atlas not configured');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'x-source': 'autobenta-ph',
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`V8Atlas ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Dealer Provider ──────────────────────────────────────────────────────────

class V8AtlasDealerProvider extends DealerProvider {
  constructor() { super('v8atlas'); }

  async getDealerProfile(externalDealerId) {
    const result = await v8atlasRequest('GET', `/v1/dealers/${externalDealerId}`);
    return { name: result.name, address: result.address, city: result.city, licenseNumber: result.licenseNumber, isVerified: result.isVerified, tier: result.tier };
  }

  async syncVerificationStatus(externalDealerId) {
    const result = await v8atlasRequest('GET', `/v1/dealers/${externalDealerId}/verification`);
    return { isVerified: result.isVerified, verifiedAt: result.verifiedAt, tier: result.tier };
  }

  async getBranches(externalDealerId) {
    const result = await v8atlasRequest('GET', `/v1/dealers/${externalDealerId}/branches`);
    return result.map(b => ({ name: b.name, address: b.address, city: b.city, region: b.region, phone: b.phone, isMain: b.isMain }));
  }
}

// ─── Inventory Provider ───────────────────────────────────────────────────────

class V8AtlasInventoryProvider extends InventoryProvider {
  constructor() { super('v8atlas'); }

  async syncInventory(externalDealerId, listings) {
    const result = await v8atlasRequest('POST', `/v1/dealers/${externalDealerId}/inventory/sync`, { listings });
    return { synced: result.synced, errors: result.errors };
  }

  async getInventoryList(externalDealerId) {
    return v8atlasRequest('GET', `/v1/dealers/${externalDealerId}/inventory`);
  }

  async deactivateListing(externalListingId) {
    await v8atlasRequest('DELETE', `/v1/inventory/${externalListingId}`);
    return { success: true };
  }

  // Legacy methods kept for backward compatibility
  async getInventory(externalDealerId) {
    return v8atlasRequest('GET', `/api/inventory?dealerId=${externalDealerId}`);
  }

  async getVehicle(externalVehicleId) {
    return v8atlasRequest('GET', `/api/inventory/${externalVehicleId}`);
  }

  async notifySold(externalVehicleId, soldAt) {
    return v8atlasRequest('PATCH', `/api/inventory/${externalVehicleId}`, { status: 'sold', soldAt });
  }

  async notifyUpdate(externalVehicleId, changes) {
    return v8atlasRequest('PATCH', `/api/inventory/${externalVehicleId}`, changes);
  }
}

// ─── Lead Provider ────────────────────────────────────────────────────────────

class V8AtlasLeadProvider extends LeadProvider {
  constructor() { super('v8atlas'); }

  async pushLead(lead) {
    const result = await v8atlasRequest('POST', '/v1/leads', {
      externalDealerId: lead.dealerExternalId,
      buyer: { name: lead.buyerName, email: lead.buyerEmail, phone: lead.buyerPhone },
      listing: { id: lead.listingId, make: lead.make, model: lead.model, year: lead.year },
      source: 'autobentaph',
      inquiryMessage: lead.notes,
    });
    return { id: result.leadId };
  }

  async updateLeadStatus(externalLeadId, status, notes) {
    await v8atlasRequest('PATCH', `/v1/leads/${externalLeadId}`, { status, notes });
    return { success: true };
  }

  async pullLeadUpdates(externalDealerId, since) {
    return v8atlasRequest('GET', `/v1/dealers/${externalDealerId}/leads?since=${since.toISOString()}`);
  }
}

// ─── Trust Provider ───────────────────────────────────────────────────────────

class V8AtlasTrustProvider extends TrustProvider {
  constructor() { super('v8atlas'); }

  async propagateTrustVerification(listingId, trustFields) {
    await v8atlasRequest('POST', '/v1/trust/verify', { listingId, ...trustFields });
    return { success: true };
  }

  async getTrustStatus(externalListingId) {
    return v8atlasRequest('GET', `/v1/listings/${externalListingId}/trust`);
  }

  // Legacy methods kept for backward compatibility
  async pushTrustUpdate(listingId, badges) {
    return v8atlasRequest('POST', '/api/trust/badge-update', { autobentaListingId: listingId, badges });
  }

  async pushDealerVerification(dealerId, status, tier) {
    return v8atlasRequest('POST', '/api/trust/dealer-verification', {
      autobentaDealerId: dealerId,
      status,
      tier,
      updatedAt: new Date().toISOString(),
    });
  }

  async receiveVerificationClaim(payload) {
    const sig = payload._signature;
    const body = { ...payload };
    delete body._signature;
    const expected = require('crypto')
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    if (sig !== expected) throw new Error('Invalid V8Atlas signature');
    return body;
  }
}

// ─── Analytics Provider ───────────────────────────────────────────────────────

class V8AtlasAnalyticsProvider extends AnalyticsProvider {
  constructor() { super('v8atlas'); }

  async getDealerPerformance(externalDealerId) {
    const result = await v8atlasRequest('GET', `/v1/dealers/${externalDealerId}/analytics`);
    return { totalLeads: result.totalLeads, convertedLeads: result.convertedLeads, avgResponseHours: result.avgResponseHours, performanceScore: result.performanceScore };
  }

  async getMarketplaceStats() {
    return v8atlasRequest('GET', '/v1/marketplace/stats');
  }

  // Legacy methods kept for backward compatibility
  async pushAnalyticsSnapshot(dealerId, metrics) {
    return v8atlasRequest('POST', '/api/analytics/snapshot', {
      autobentaDealerId: dealerId,
      metrics,
      snapshotAt: new Date().toISOString(),
    });
  }

  async pullEnrichment(dealerId) {
    return v8atlasRequest('GET', `/api/analytics/enrichment?dealerId=${dealerId}`);
  }
}

// ─── Registration ─────────────────────────────────────────────────────────────

function registerV8AtlasProviders() {
  if (!process.env.V8ATLAS_ENABLED || process.env.V8ATLAS_ENABLED !== 'true') return;

  const { registerDealerProvider } = require('../dealerNetwork/DealerProvider');
  const { registerInventoryProvider } = require('../dealerNetwork/InventoryProvider');
  const { registerLeadProvider } = require('../dealerNetwork/LeadProvider');
  const { registerTrustProvider } = require('../dealerNetwork/TrustProvider');
  const { registerAnalyticsProvider } = require('../dealerNetwork/AnalyticsProvider');

  registerDealerProvider('v8atlas', new V8AtlasDealerProvider());
  registerInventoryProvider('v8atlas', new V8AtlasInventoryProvider());
  registerLeadProvider('v8atlas', new V8AtlasLeadProvider());
  registerTrustProvider('v8atlas', new V8AtlasTrustProvider());
  registerAnalyticsProvider('v8atlas', new V8AtlasAnalyticsProvider());

  console.log('[V8Atlas] All providers registered');
}

module.exports = {
  registerV8AtlasProviders,
  V8AtlasDealerProvider,
  V8AtlasInventoryProvider,
  V8AtlasLeadProvider,
  V8AtlasTrustProvider,
  V8AtlasAnalyticsProvider,
};

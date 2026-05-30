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
    return v8atlasRequest('GET', `/api/dealers/${externalDealerId}`);
  }

  async syncVerificationStatus(externalDealerId) {
    return v8atlasRequest('GET', `/api/dealers/${externalDealerId}/verification`);
  }

  async getBranches(externalDealerId) {
    return v8atlasRequest('GET', `/api/dealers/${externalDealerId}/branches`);
  }
}

// ─── Inventory Provider ───────────────────────────────────────────────────────

class V8AtlasInventoryProvider extends InventoryProvider {
  constructor() { super('v8atlas'); }

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
    return v8atlasRequest('POST', '/api/leads', {
      source: 'autobenta',
      externalListingId: lead.listingId,
      buyerName: lead.buyerName,
      buyerEmail: lead.buyerEmail,
      buyerPhone: lead.buyerPhone,
      message: lead.message,
      autobentaLeadId: lead.id,
      receivedAt: lead.createdAt,
    });
  }

  async updateLeadStatus(externalLeadId, status, notes) {
    return v8atlasRequest('PATCH', `/api/leads/${externalLeadId}`, { status, notes });
  }

  async pullLeadUpdates(externalDealerId, since) {
    return v8atlasRequest('GET', `/api/leads?dealerId=${externalDealerId}&since=${since.toISOString()}`);
  }
}

// ─── Trust Provider ───────────────────────────────────────────────────────────

class V8AtlasTrustProvider extends TrustProvider {
  constructor() { super('v8atlas'); }

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
    // Validate signature and return normalized claim
    const { crypto } = require('crypto');
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

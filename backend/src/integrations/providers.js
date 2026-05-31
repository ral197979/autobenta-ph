'use strict';

/**
 * Provider Interfaces — Ryderr Marketplace Integration Layer
 *
 * Every dealer system integration must implement these interfaces.
 * Ryderr core never calls provider-specific code directly —
 * it only calls through these interfaces.
 *
 * The ManualProvider is the baseline. All other providers extend it.
 */

/**
 * InventoryProvider
 * Responsible for syncing vehicle listings between a dealer system and Ryderr.
 */
class InventoryProvider {
  /** @returns {Promise<Array>} normalized vehicle objects */
  async pullInventory(dealerId, options = {}) {
    throw new Error('pullInventory() not implemented');
  }

  /** Push an inventory update back to the source system */
  async pushInventoryUpdate(dealerId, vehicleId, changes) {
    throw new Error('pushInventoryUpdate() not implemented');
  }

  /** Remove a listing from the source system */
  async deleteInventory(dealerId, vehicleId) {
    throw new Error('deleteInventory() not implemented');
  }
}

/**
 * LeadProvider
 * Responsible for routing leads from Ryderr into the dealer's system.
 */
class LeadProvider {
  /** Push a new lead to the dealer's system. Returns { externalLeadId } or null */
  async pushLead(dealerId, lead) {
    throw new Error('pushLead() not implemented');
  }

  /** Sync lead status update back from the dealer's system */
  async updateLeadStatus(dealerId, leadId, status) {
    throw new Error('updateLeadStatus() not implemented');
  }
}

/**
 * ManualProvider — baseline implementation
 * Used when dealer has no external system. All ops are Ryderr-native.
 */
class ManualInventoryProvider extends InventoryProvider {
  async pullInventory(dealerId, options = {}) {
    // Manual dealers manage listings directly in Ryderr — nothing to pull
    return [];
  }
  async pushInventoryUpdate(dealerId, vehicleId, changes) {
    // No-op: changes are already in Ryderr DB
    return { ok: true };
  }
  async deleteInventory(dealerId, vehicleId) {
    return { ok: true };
  }
}

class ManualLeadProvider extends LeadProvider {
  async pushLead(dealerId, lead) {
    // Manual dealers receive leads via Ryderr inbox — no external push needed
    return null;
  }
  async updateLeadStatus(dealerId, leadId, status) {
    return { ok: true };
  }
}

/**
 * Provider Registry
 * Maps DealerSourceType enum values to provider implementations.
 * Add new integrations here.
 */
const PROVIDER_REGISTRY = {
  MANUAL: {
    inventory: new ManualInventoryProvider(),
    lead:      new ManualLeadProvider(),
  },
  CSV: {
    inventory: new ManualInventoryProvider(), // CSV uses same provider post-import
    lead:      new ManualLeadProvider(),
  },
  // V8ATLAS and API are loaded dynamically from integrations/
};

/**
 * Get the inventory provider for a dealer's source type.
 * Falls back to ManualInventoryProvider if the type isn't registered.
 */
function getInventoryProvider(sourceType) {
  const entry = PROVIDER_REGISTRY[sourceType];
  if (entry) return entry.inventory;
  // Dynamic load for plugin providers
  try {
    const adapter = require(`./integrations/${sourceType.toLowerCase()}/index.js`);
    return adapter.inventoryProvider;
  } catch {
    console.warn(`No inventory provider for source type: ${sourceType}. Using manual fallback.`);
    return PROVIDER_REGISTRY.MANUAL.inventory;
  }
}

function getLeadProvider(sourceType) {
  const entry = PROVIDER_REGISTRY[sourceType];
  if (entry) return entry.lead;
  try {
    const adapter = require(`./integrations/${sourceType.toLowerCase()}/index.js`);
    return adapter.leadProvider;
  } catch {
    console.warn(`No lead provider for source type: ${sourceType}. Using manual fallback.`);
    return PROVIDER_REGISTRY.MANUAL.lead;
  }
}

module.exports = {
  InventoryProvider,
  LeadProvider,
  ManualInventoryProvider,
  ManualLeadProvider,
  getInventoryProvider,
  getLeadProvider,
};

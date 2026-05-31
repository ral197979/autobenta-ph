// Lead provider interface — DMS systems implement this to receive and sync leads.

const { enqueue, registerHandler } = require('../queue/jobQueue');

class LeadProvider {
  constructor(name) {
    this.name = name;
  }

  // Push a new lead from AutoBentaPH to the external DMS
  async pushLead(lead) {
    throw new Error(`${this.name}: pushLead not implemented`);
  }

  // Update lead status change in external DMS
  async updateLeadStatus(externalLeadId, status, notes) {
    throw new Error(`${this.name}: updateLeadStatus not implemented`);
  }

  // Pull updated leads from external DMS (for bidirectional sync)
  async pullLeadUpdates(externalDealerId, since) {
    throw new Error(`${this.name}: pullLeadUpdates not implemented`);
  }
}

const _providers = {};

function registerLeadProvider(name, provider) {
  _providers[name] = provider;
}

function getLeadProvider(name) {
  if (!_providers[name]) throw new Error(`Lead provider '${name}' not registered`);
  return _providers[name];
}

// Push lead to all registered providers for a dealer, with persistent retry queue
async function distributeLeadToProviders(lead, providerNames = []) {
  const results = [];
  for (const name of providerNames) {
    try {
      const provider = _providers[name];
      if (!provider) continue;
      const result = await provider.pushLead(lead);
      results.push({ provider: name, success: true, externalLeadId: result?.id });
    } catch (err) {
      // Enqueue for persistent retry instead of in-memory queue
      await enqueue('lead_sync', { lead, providerName: name }, { maxAttempts: 5 });
      results.push({ provider: name, success: false, error: err.message, queued: true });
    }
  }
  return results;
}

// Register handler for lead_sync jobs (called by poll loop)
registerHandler('lead_sync', async ({ lead, providerName }) => {
  const provider = _providers[providerName];
  if (!provider) throw new Error(`Provider '${providerName}' not registered`);
  await provider.pushLead(lead);
});

module.exports = { LeadProvider, registerLeadProvider, getLeadProvider, distributeLeadToProviders };

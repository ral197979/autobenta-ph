// Lead provider interface — DMS systems implement this to receive and sync leads.

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
const _queue = [];  // retry queue for failed pushes

function registerLeadProvider(name, provider) {
  _providers[name] = provider;
}

function getLeadProvider(name) {
  if (!_providers[name]) throw new Error(`Lead provider '${name}' not registered`);
  return _providers[name];
}

// Push lead to all registered providers for a dealer, with retry queue
async function distributeLeadToProviders(lead, providerNames = []) {
  const results = [];
  for (const name of providerNames) {
    try {
      const provider = _providers[name];
      if (!provider) continue;
      const result = await provider.pushLead(lead);
      results.push({ provider: name, success: true, externalLeadId: result?.id });
    } catch (err) {
      // Queue for retry — in production this would be a persistent queue (Redis/pg)
      _queue.push({ lead, providerName: name, failedAt: new Date(), attempts: 1, error: err.message });
      results.push({ provider: name, success: false, error: err.message });
    }
  }
  return results;
}

function getRetryQueue() {
  return [..._queue];
}

module.exports = { LeadProvider, registerLeadProvider, getLeadProvider, distributeLeadToProviders, getRetryQueue };

// Dealer provider interface — all dealer DMS integrations implement this contract.
// AutoBentaPH core code depends only on this interface, never on V8Atlas directly.

class DealerProvider {
  constructor(name) {
    this.name = name;
  }

  // Returns dealer profile enrichment data from the external DMS
  async getDealerProfile(externalDealerId) {
    throw new Error(`${this.name}: getDealerProfile not implemented`);
  }

  // Syncs dealer verification status from external DMS
  async syncVerificationStatus(externalDealerId) {
    throw new Error(`${this.name}: syncVerificationStatus not implemented`);
  }

  // Returns list of dealer branches from external DMS
  async getBranches(externalDealerId) {
    throw new Error(`${this.name}: getBranches not implemented`);
  }
}

const _providers = {};

function registerDealerProvider(name, provider) {
  _providers[name] = provider;
}

function getDealerProvider(name) {
  if (!_providers[name]) throw new Error(`Dealer provider '${name}' not registered`);
  return _providers[name];
}

function listDealerProviders() {
  return Object.keys(_providers);
}

module.exports = { DealerProvider, registerDealerProvider, getDealerProvider, listDealerProviders };

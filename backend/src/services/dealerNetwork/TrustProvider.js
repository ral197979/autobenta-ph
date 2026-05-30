// Trust provider interface — external DMS systems can push/pull verification state.

class TrustProvider {
  constructor(name) {
    this.name = name;
  }

  // Push trust badge update to external DMS
  async pushTrustUpdate(listingId, badges) {
    throw new Error(`${this.name}: pushTrustUpdate not implemented`);
  }

  // Push dealer verification status to external DMS
  async pushDealerVerification(dealerId, status, tier) {
    throw new Error(`${this.name}: pushDealerVerification not implemented`);
  }

  // Receive and validate a trust claim from external DMS
  async receiveVerificationClaim(payload) {
    throw new Error(`${this.name}: receiveVerificationClaim not implemented`);
  }
}

const _providers = {};

function registerTrustProvider(name, provider) {
  _providers[name] = provider;
}

function getTrustProvider(name) {
  if (!_providers[name]) throw new Error(`Trust provider '${name}' not registered`);
  return _providers[name];
}

async function broadcastTrustUpdate(listingId, badges) {
  const results = [];
  for (const [name, provider] of Object.entries(_providers)) {
    try {
      await provider.pushTrustUpdate(listingId, badges);
      results.push({ provider: name, success: true });
    } catch (err) {
      results.push({ provider: name, success: false, error: err.message });
    }
  }
  return results;
}

module.exports = { TrustProvider, registerTrustProvider, getTrustProvider, broadcastTrustUpdate };

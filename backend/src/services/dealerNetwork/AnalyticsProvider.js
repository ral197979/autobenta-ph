// Analytics provider interface — push performance metrics to external DMS dashboards.

class AnalyticsProvider {
  constructor(name) {
    this.name = name;
  }

  // Push marketplace analytics snapshot to external DMS
  async pushAnalyticsSnapshot(dealerId, metrics) {
    throw new Error(`${this.name}: pushAnalyticsSnapshot not implemented`);
  }

  // Pull analytics enrichment from external DMS (e.g. offline conversion data)
  async pullEnrichment(dealerId) {
    throw new Error(`${this.name}: pullEnrichment not implemented`);
  }
}

const _providers = {};

function registerAnalyticsProvider(name, provider) {
  _providers[name] = provider;
}

function getAnalyticsProvider(name) {
  if (!_providers[name]) throw new Error(`Analytics provider '${name}' not registered`);
  return _providers[name];
}

module.exports = { AnalyticsProvider, registerAnalyticsProvider, getAnalyticsProvider };

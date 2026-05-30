/**
 * Provider abstraction for vehicle history data.
 * Swap in real integrations (LTO, insurance databases, third-party vendors)
 * by registering a provider that matches this interface.
 */

/**
 * @typedef {Object} VehicleHistoryReport
 * @property {string} provider - Which provider generated this report
 * @property {string|null} plateNumber
 * @property {string|null} chassisNumber
 * @property {number|null} ownerCount - Known number of registered owners
 * @property {{ date: string, event: string }[]} registrationHistory
 * @property {{ date: string, type: string, severity: string, description: string }[]} incidents
 * @property {{ from: string, to: string|null, ownerType: string }[]} ownershipHistory
 * @property {boolean} hasLien - Outstanding chattel mortgage or financing
 * @property {string|null} lienholder
 * @property {string} fetchedAt - ISO timestamp of report generation
 */

const providers = {};

/**
 * Register a vehicle history provider.
 * @param {string} name - e.g. 'mock', 'lto', 'carfax_ph'
 * @param {{ fetch: (identifier: string) => Promise<VehicleHistoryReport> }} provider
 */
function registerProvider(name, provider) {
  if (typeof provider.fetch !== 'function') {
    throw new Error(`Provider "${name}" must implement fetch(identifier)`);
  }
  providers[name] = provider;
}

/**
 * Fetch a vehicle history report using the named provider.
 * @param {string} providerName
 * @param {string} identifier - plate number, chassis number, or listing id
 * @returns {Promise<VehicleHistoryReport>}
 */
async function fetchReport(providerName, identifier) {
  const provider = providers[providerName];
  if (!provider) throw new Error(`Unknown vehicle history provider: ${providerName}`);
  return provider.fetch(identifier);
}

/**
 * Get the list of registered provider names.
 * @returns {string[]}
 */
function listProviders() {
  return Object.keys(providers);
}

module.exports = { registerProvider, fetchReport, listProviders };

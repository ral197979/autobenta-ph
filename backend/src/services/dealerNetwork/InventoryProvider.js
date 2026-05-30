// Inventory provider interface — DMS systems implement this to sync vehicle inventory.

class InventoryProvider {
  constructor(name) {
    this.name = name;
  }

  // Full inventory list for a dealer
  async getInventory(externalDealerId) {
    throw new Error(`${this.name}: getInventory not implemented`);
  }

  // Single vehicle by external ID
  async getVehicle(externalVehicleId) {
    throw new Error(`${this.name}: getVehicle not implemented`);
  }

  // Called when a listing is sold/archived on AutoBentaPH
  async notifySold(externalVehicleId, soldAt) {
    throw new Error(`${this.name}: notifySold not implemented`);
  }

  // Called when a price/mileage/status changes on AutoBentaPH
  async notifyUpdate(externalVehicleId, changes) {
    throw new Error(`${this.name}: notifyUpdate not implemented`);
  }
}

const _providers = {};

function registerInventoryProvider(name, provider) {
  _providers[name] = provider;
}

function getInventoryProvider(name) {
  if (!_providers[name]) throw new Error(`Inventory provider '${name}' not registered`);
  return _providers[name];
}

module.exports = { InventoryProvider, registerInventoryProvider, getInventoryProvider };

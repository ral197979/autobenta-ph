'use strict';
const { InventoryProvider } = require('../providers');

class V8AtlasInventoryProvider extends InventoryProvider {
  constructor() {
    super();
    this.baseURL = process.env.V8ATLAS_API_URL || 'https://v8atlas-backend.onrender.com/api/v1';
  }

  _getToken(dealer) {
    return dealer.integrationMeta?.v8atlas_token || null;
  }

  async pullInventory(dealer, options = {}) {
    const token = this._getToken(dealer);
    if (!token) throw new Error('V8Atlas: no API token configured for dealer ' + dealer.id);

    const params = new URLSearchParams({ limit: 100, status: 'Available', ...options });
    const res = await fetch(`${this.baseURL}/vehicles?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`V8Atlas inventory pull failed: ${err.error || res.status}`);
    }

    const { vehicles } = await res.json();

    // Normalize to Ryderr listing shape
    return vehicles.map(v => ({
      externalId:   v.id,
      make:         v.make,
      model:        v.model,
      year:         v.year,
      variant:      v.trim,
      price:        v.price,
      mileage:      v.mileage,
      fuelType:     v.fuel,
      transmission: v.transmission,
      condition:    normalizeCondition(v.condition),
      status:       normalizeStatus(v.status),
      description:  v.notes || '',
      inventorySource: 'V8ATLAS',
    }));
  }

  async pushInventoryUpdate(dealer, externalId, changes) {
    const token = this._getToken(dealer);
    if (!token) return { ok: false, reason: 'no_token' };

    const res = await fetch(`${this.baseURL}/vehicles/${externalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(changes),
    });

    return { ok: res.ok, status: res.status };
  }

  async deleteInventory(dealer, externalId) {
    const token = this._getToken(dealer);
    if (!token) return { ok: false, reason: 'no_token' };

    const res = await fetch(`${this.baseURL}/vehicles/${externalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    return { ok: res.ok, status: res.status };
  }
}

function normalizeCondition(v8Condition) {
  const map = { 'New': 'excellent', 'Used': 'good', 'Certified': 'excellent' };
  return map[v8Condition] || 'good';
}

function normalizeStatus(v8Status) {
  const map = { 'Available': 'active', 'Sold': 'sold', 'Reserved': 'draft', 'Pending': 'draft' };
  return map[v8Status] || 'draft';
}

module.exports = { V8AtlasInventoryProvider };

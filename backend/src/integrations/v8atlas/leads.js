'use strict';
const { LeadProvider } = require('../providers');

class V8AtlasLeadProvider extends LeadProvider {
  constructor() {
    super();
    this.baseURL = process.env.V8ATLAS_API_URL || 'https://v8atlas-backend.onrender.com/api/v1';
  }

  _getToken(dealer) {
    return dealer.integrationMeta?.v8atlas_token || null;
  }

  async pushLead(dealer, lead) {
    const token = this._getToken(dealer);
    if (!token) {
      console.warn(`V8Atlas: no token for dealer ${dealer.id} — lead stored in Ryderr inbox only`);
      return null;
    }

    const res = await fetch(`${this.baseURL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name:     lead.buyerName,
        email:    lead.buyerEmail,
        phone:    lead.buyerPhone,
        interest: lead.listingTitle,
        source:   'Ryderr Marketplace',
        notes:    lead.message,
        status:   'New',
      }),
    });

    if (!res.ok) {
      console.error(`V8Atlas lead push failed: ${res.status}`);
      return null;
    }

    const { lead: v8Lead } = await res.json();
    return { externalLeadId: v8Lead.id };
  }

  async updateLeadStatus(dealer, externalLeadId, status) {
    const token = this._getToken(dealer);
    if (!token) return { ok: false };

    const statusMap = {
      contacted:    'Contacted',
      qualified:    'Qualified',
      closed_won:   'Closed Won',
      closed_lost:  'Closed Lost',
    };

    const res = await fetch(`${this.baseURL}/leads/${externalLeadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: statusMap[status] || status }),
    });

    return { ok: res.ok };
  }
}

module.exports = { V8AtlasLeadProvider };

'use strict';
const prisma = require("../../lib/prisma");

/**
 * Save a V8Atlas API token for a dealer.
 * Token is stored in dealer.integrationMeta.v8atlas_token
 */
async function saveV8AtlasToken(dealerId, token) {
  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  const meta = dealer?.integrationMeta || {};
  await prisma.dealer.update({
    where: { id: dealerId },
    data:  { integrationMeta: { ...meta, v8atlas_token: token, v8atlas_connected_at: new Date().toISOString() } },
  });
}

/**
 * Remove the V8Atlas connection for a dealer.
 * Listings stay live but are marked as manually managed going forward.
 */
async function disconnectV8Atlas(dealerId) {
  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  const meta = { ...(dealer?.integrationMeta || {}) };
  delete meta.v8atlas_token;
  meta.v8atlas_disconnected_at = new Date().toISOString();

  await prisma.dealer.update({
    where: { id: dealerId },
    data:  {
      integrationMeta: meta,
      sourceType: 'MANUAL', // fall back to manual on disconnect
    },
  });
}

module.exports = { saveV8AtlasToken, disconnectV8Atlas };

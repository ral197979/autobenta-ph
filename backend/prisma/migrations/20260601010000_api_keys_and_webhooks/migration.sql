CREATE TABLE "dealer_api_keys" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "dealerId"    TEXT NOT NULL REFERENCES "dealers"("id") ON DELETE CASCADE,
  "name"        TEXT NOT NULL,
  "keyHash"     TEXT NOT NULL UNIQUE,
  "keyPrefix"   TEXT NOT NULL,
  "permissions" TEXT[] NOT NULL DEFAULT ARRAY['inventory:write','leads:read'],
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "lastUsedAt"  TIMESTAMP(3),
  "expiresAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "dealer_webhooks" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "dealerId"    TEXT NOT NULL REFERENCES "dealers"("id") ON DELETE CASCADE,
  "url"         TEXT NOT NULL,
  "events"      TEXT[] NOT NULL DEFAULT '{}',
  "secret"      TEXT NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT TRUE,
  "lastFiredAt" TIMESTAMP(3),
  "failCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

'use strict';
const crypto = require('crypto');
const prisma = require("../lib/prisma");

/**
 * Fires an event to all registered webhooks for a dealer that subscribe to it.
 *
 * Usage:
 *   await dispatchWebhook(dealerId, 'lead.created', { lead: {...} });
 *
 * - Signs payload with HMAC-SHA256 using the webhook secret
 * - Sets Ryderr-Webhook-Signature header
 * - Retries up to 3 times with exponential backoff
 * - Deactivates webhook after 10 consecutive failures
 */
async function dispatchWebhook(dealerId, event, payload) {
  const webhooks = await prisma.dealerWebhook.findMany({
    where: { dealerId, isActive: true, events: { has: event } },
  });

  for (const webhook of webhooks) {
    fireWithRetry(webhook, event, payload).catch(err => {
      console.error(`Webhook dispatch error [${webhook.id}]:`, err.message);
    });
  }
}

async function fireWithRetry(webhook, event, payload, attempt = 1) {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(body)
    .digest('hex');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(webhook.url, {
      method:  'POST',
      headers: {
        'Content-Type':        'application/json',
        'X-Ryderr-Event':      event,
        'X-Ryderr-Webhook-Id': webhook.id,
        'X-Ryderr-Signature':  `sha256=${signature}`,
        'X-Ryderr-Delivery':   crypto.randomUUID(),
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      // Success — reset fail count and record last fired time
      await prisma.dealerWebhook.update({
        where: { id: webhook.id },
        data:  { lastFiredAt: new Date(), failCount: 0 },
      });
      return;
    }

    throw new Error(`Webhook returned ${res.status}`);
  } catch (err) {
    if (attempt < 3) {
      // Exponential backoff: 2s, 4s
      await sleep(attempt * 2000);
      return fireWithRetry(webhook, event, payload, attempt + 1);
    }

    // Final failure — increment fail count, deactivate if threshold exceeded
    const updated = await prisma.dealerWebhook.update({
      where: { id: webhook.id },
      data:  { failCount: { increment: 1 } },
    });

    if (updated.failCount >= 10) {
      await prisma.dealerWebhook.update({
        where: { id: webhook.id },
        data:  { isActive: false },
      });
      console.warn(`Webhook ${webhook.id} deactivated after 10 consecutive failures`);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { dispatchWebhook };

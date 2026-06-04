'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TRIAL_DAYS = 90;
const FOUNDING_DEALER_PRICE = 3599;

/**
 * Get trial status for a dealer subscription.
 * Returns a structured object the frontend can use directly.
 */
function getTrialStatus(subscription) {
  if (!subscription) {
    return { isOnTrial: false, isExpired: false, daysRemaining: 0, trialEndsAt: null };
  }

  if (subscription.status !== 'trial' || !subscription.trialEndsAt) {
    return { isOnTrial: false, isExpired: subscription.status === 'expired', daysRemaining: 0, trialEndsAt: null };
  }

  const now = new Date();
  const end = new Date(subscription.trialEndsAt);
  const msRemaining = end - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / 86400000));

  return {
    isOnTrial:            true,
    isActive:             daysRemaining > 0,
    isExpired:            daysRemaining === 0,
    daysRemaining,
    trialEndsAt:          subscription.trialEndsAt,
    plan:                 subscription.plan,
    // Conversion prompt thresholds
    showConversionBanner: daysRemaining <= 30,
    showUrgentBanner:     daysRemaining <= 7,
    monthlyPrice:         FOUNDING_DEALER_PRICE,
  };
}

/**
 * Start a 90-day trial for a dealer (idempotent — skips if already on trial).
 */
async function startTrial(dealerId) {
  const existing = await prisma.dealerSubscription.findUnique({ where: { dealerId } });

  if (existing) {
    // Already has a subscription — update to trial if not already
    if (existing.status === 'trial') return existing;
    return prisma.dealerSubscription.update({
      where: { dealerId },
      data: {
        plan:        'pro',
        status:      'trial',
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86400000),
      },
    });
  }

  return prisma.dealerSubscription.create({
    data: {
      dealerId,
      plan:        'pro',
      status:      'trial',
      startedAt:   new Date(),
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86400000),
    },
  });
}

/**
 * Convert a trial to a paying subscription.
 * Called when dealer completes payment.
 */
async function convertTrial(dealerId, paymentRef) {
  return prisma.dealerSubscription.update({
    where: { dealerId },
    data: {
      status:      'active',
      plan:        'pro',
      trialEndsAt: null,
      startedAt:   new Date(),
      expiresAt:   new Date(Date.now() + 30 * 86400000), // first month
    },
  });
}

module.exports = { getTrialStatus, startTrial, convertTrial, TRIAL_DAYS, FOUNDING_DEALER_PRICE };

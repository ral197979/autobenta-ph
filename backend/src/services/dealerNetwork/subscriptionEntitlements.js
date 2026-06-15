// Subscription entitlement definitions and feature gate checker.

const prisma = require("../../lib/prisma");

const PLAN_FEATURES = {
  free: {
    maxListings: 5,
    analytics: false,
    crm: false,
    priorityPlacement: false,
    v8atlasSync: false,
    multiBranch: false,
    verificationBadge: false,
    apiAccess: false,
    leadRouting: 'standard',
  },
  verified: {
    maxListings: 25,
    analytics: false,
    crm: true,
    priorityPlacement: false,
    v8atlasSync: false,
    multiBranch: false,
    verificationBadge: true,
    apiAccess: false,
    leadRouting: 'standard',
  },
  pro: {
    maxListings: 100,
    analytics: true,
    crm: true,
    priorityPlacement: true,
    v8atlasSync: false,
    multiBranch: false,
    verificationBadge: true,
    apiAccess: false,
    leadRouting: 'priority',
  },
  enterprise: {
    maxListings: -1,   // unlimited
    analytics: true,
    crm: true,
    priorityPlacement: true,
    v8atlasSync: true,
    multiBranch: true,
    verificationBadge: true,
    apiAccess: true,
    leadRouting: 'priority',
  },
};

function getFeatures(plan) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
}

function hasFeature(plan, feature) {
  const features = getFeatures(plan);
  return !!features[feature];
}

function canAddListing(plan, currentCount) {
  const { maxListings } = getFeatures(plan);
  if (maxListings === -1) return true;  // unlimited
  return currentCount < maxListings;
}

// Middleware factory: gate a route behind a plan feature
function requireFeature(feature) {
  return async (req, res, next) => {
    try {
      const dealer = await prisma.dealer.findFirst({
        where: { userId: req.user.id },
        include: { subscription: true },
      });
      const plan = dealer?.subscription?.plan || 'free';
      if (!hasFeature(plan, feature)) {
        return res.status(403).json({
          error: `This feature requires a higher plan`,
          requiredFeature: feature,
          currentPlan: plan,
          upgradeUrl: '/dealer/subscription',
        });
      }
      req.dealer = dealer;
      req.dealerPlan = plan;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { PLAN_FEATURES, getFeatures, hasFeature, canAddListing, requireFeature };

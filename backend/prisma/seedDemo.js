// Usage: node backend/prisma/seedDemo.js
// Seeds a realistic demo environment for AutoBentaPH sales demonstrations.
// Idempotent — skips entirely if demo@autobentaph.com already exists.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- helpers ---
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n) => new Date(Date.now() + n * 86400000);

// --- static data ---
const LOCATIONS = ['Quezon City', 'Makati', 'Pasig', 'Mandaluyong', 'Marikina', 'Las Piñas', 'Alabang', 'Antipolo'];
const COLORS = ['White', 'Silver', 'Black', 'Gray', 'Red', 'Blue', 'Pearl White', 'Champagne'];
const FUEL_TYPES = ['gasoline', 'diesel', 'hybrid'];
const BODY_TYPES = ['sedan', 'suv', 'pickup', 'van', 'hatchback', 'crossover'];
const CONDITIONS = ['excellent', 'excellent', 'excellent', 'good', 'good', 'fair']; // weighted

const VEHICLES = [
  // Toyota x12
  { make: 'Toyota', model: 'Vios',      bodyType: 'sedan',   fuel: 'gasoline', priceMin: 450000,  priceMax: 780000  },
  { make: 'Toyota', model: 'Vios',      bodyType: 'sedan',   fuel: 'gasoline', priceMin: 480000,  priceMax: 800000  },
  { make: 'Toyota', model: 'Innova',    bodyType: 'van',     fuel: 'diesel',   priceMin: 700000,  priceMax: 1200000 },
  { make: 'Toyota', model: 'Innova',    bodyType: 'van',     fuel: 'diesel',   priceMin: 750000,  priceMax: 1250000 },
  { make: 'Toyota', model: 'Fortuner',  bodyType: 'suv',     fuel: 'diesel',   priceMin: 1200000, priceMax: 2200000 },
  { make: 'Toyota', model: 'Fortuner',  bodyType: 'suv',     fuel: 'diesel',   priceMin: 1100000, priceMax: 2000000 },
  { make: 'Toyota', model: 'Hilux',     bodyType: 'pickup',  fuel: 'diesel',   priceMin: 800000,  priceMax: 1500000 },
  { make: 'Toyota', model: 'Hilux',     bodyType: 'pickup',  fuel: 'diesel',   priceMin: 850000,  priceMax: 1600000 },
  { make: 'Toyota', model: 'Wigo',      bodyType: 'hatchback', fuel: 'gasoline', priceMin: 350000, priceMax: 550000 },
  { make: 'Toyota', model: 'Rush',      bodyType: 'suv',     fuel: 'gasoline', priceMin: 700000,  priceMax: 1100000 },
  { make: 'Toyota', model: 'Avanza',    bodyType: 'van',     fuel: 'gasoline', priceMin: 550000,  priceMax: 900000  },
  { make: 'Toyota', model: 'Corolla',   bodyType: 'sedan',   fuel: 'gasoline', priceMin: 700000,  priceMax: 1300000 },
  // Honda x8
  { make: 'Honda',  model: 'CR-V',      bodyType: 'crossover', fuel: 'gasoline', priceMin: 900000, priceMax: 1800000 },
  { make: 'Honda',  model: 'CR-V',      bodyType: 'crossover', fuel: 'diesel',   priceMin: 950000, priceMax: 1900000 },
  { make: 'Honda',  model: 'Civic',     bodyType: 'sedan',   fuel: 'gasoline', priceMin: 700000,  priceMax: 1300000 },
  { make: 'Honda',  model: 'Civic',     bodyType: 'sedan',   fuel: 'gasoline', priceMin: 750000,  priceMax: 1350000 },
  { make: 'Honda',  model: 'Jazz',      bodyType: 'hatchback', fuel: 'gasoline', priceMin: 500000, priceMax: 900000  },
  { make: 'Honda',  model: 'City',      bodyType: 'sedan',   fuel: 'gasoline', priceMin: 550000,  priceMax: 950000  },
  { make: 'Honda',  model: 'BRV',       bodyType: 'crossover', fuel: 'gasoline', priceMin: 650000, priceMax: 1100000 },
  { make: 'Honda',  model: 'HR-V',      bodyType: 'crossover', fuel: 'gasoline', priceMin: 750000, priceMax: 1300000 },
  // Mitsubishi x7
  { make: 'Mitsubishi', model: 'Montero Sport', bodyType: 'suv', fuel: 'diesel', priceMin: 1100000, priceMax: 2100000 },
  { make: 'Mitsubishi', model: 'Montero Sport', bodyType: 'suv', fuel: 'diesel', priceMin: 1000000, priceMax: 1900000 },
  { make: 'Mitsubishi', model: 'Outlander',     bodyType: 'suv', fuel: 'gasoline', priceMin: 900000, priceMax: 1600000 },
  { make: 'Mitsubishi', model: 'Strada',        bodyType: 'pickup', fuel: 'diesel', priceMin: 750000, priceMax: 1400000 },
  { make: 'Mitsubishi', model: 'Strada',        bodyType: 'pickup', fuel: 'diesel', priceMin: 800000, priceMax: 1500000 },
  { make: 'Mitsubishi', model: 'Xpander',       bodyType: 'van',  fuel: 'gasoline', priceMin: 800000, priceMax: 1400000 },
  { make: 'Mitsubishi', model: 'Mirage',        bodyType: 'hatchback', fuel: 'gasoline', priceMin: 380000, priceMax: 650000 },
  // Ford x5
  { make: 'Ford',   model: 'Ranger',    bodyType: 'pickup',  fuel: 'diesel',   priceMin: 900000,  priceMax: 1700000 },
  { make: 'Ford',   model: 'Ranger',    bodyType: 'pickup',  fuel: 'diesel',   priceMin: 1000000, priceMax: 1900000 },
  { make: 'Ford',   model: 'Raptor',    bodyType: 'pickup',  fuel: 'diesel',   priceMin: 1800000, priceMax: 2800000 },
  { make: 'Ford',   model: 'Everest',   bodyType: 'suv',     fuel: 'diesel',   priceMin: 1200000, priceMax: 2200000 },
  { make: 'Ford',   model: 'EcoSport',  bodyType: 'crossover', fuel: 'gasoline', priceMin: 550000, priceMax: 950000 },
  // Hyundai x5
  { make: 'Hyundai', model: 'Tucson',   bodyType: 'crossover', fuel: 'gasoline', priceMin: 900000, priceMax: 1700000 },
  { make: 'Hyundai', model: 'Santa Fe', bodyType: 'suv',     fuel: 'diesel',   priceMin: 1100000, priceMax: 2000000 },
  { make: 'Hyundai', model: 'Accent',   bodyType: 'sedan',   fuel: 'gasoline', priceMin: 450000,  priceMax: 780000  },
  { make: 'Hyundai', model: 'Accent',   bodyType: 'hatchback', fuel: 'gasoline', priceMin: 430000, priceMax: 750000 },
  { make: 'Hyundai', model: 'Kona',     bodyType: 'crossover', fuel: 'gasoline', priceMin: 700000, priceMax: 1200000 },
  // Nissan x4
  { make: 'Nissan',  model: 'Navara',   bodyType: 'pickup',  fuel: 'diesel',   priceMin: 800000,  priceMax: 1500000 },
  { make: 'Nissan',  model: 'NP300',    bodyType: 'pickup',  fuel: 'diesel',   priceMin: 600000,  priceMax: 1100000 },
  { make: 'Nissan',  model: 'Terra',    bodyType: 'suv',     fuel: 'diesel',   priceMin: 1000000, priceMax: 1800000 },
  { make: 'Nissan',  model: 'Almera',   bodyType: 'sedan',   fuel: 'gasoline', priceMin: 400000,  priceMax: 700000  },
  // Kia x4
  { make: 'Kia',     model: 'Seltos',   bodyType: 'crossover', fuel: 'gasoline', priceMin: 850000, priceMax: 1500000 },
  { make: 'Kia',     model: 'Sportage', bodyType: 'crossover', fuel: 'gasoline', priceMin: 900000, priceMax: 1700000 },
  { make: 'Kia',     model: 'Stonic',   bodyType: 'crossover', fuel: 'gasoline', priceMin: 700000, priceMax: 1200000 },
  { make: 'Kia',     model: 'Picanto',  bodyType: 'hatchback', fuel: 'gasoline', priceMin: 380000, priceMax: 650000 },
  // Mazda x3
  { make: 'Mazda',   model: 'CX-5',     bodyType: 'crossover', fuel: 'gasoline', priceMin: 1000000, priceMax: 1900000 },
  { make: 'Mazda',   model: 'Mazda3',   bodyType: 'sedan',   fuel: 'gasoline', priceMin: 750000,  priceMax: 1300000 },
  { make: 'Mazda',   model: 'BT-50',    bodyType: 'pickup',  fuel: 'diesel',   priceMin: 700000,  priceMax: 1200000 },
  // Suzuki x2
  { make: 'Suzuki',  model: 'Ertiga',   bodyType: 'van',     fuel: 'gasoline', priceMin: 500000,  priceMax: 900000  },
  { make: 'Suzuki',  model: 'Jimny',    bodyType: 'suv',     fuel: 'gasoline', priceMin: 850000,  priceMax: 1400000 },
];

const DESCRIPTIONS = [
  'Well-maintained unit with complete service records from casa. No accidents, non-flood. Smoke-free interior.',
  'Single owner since new, regularly serviced at authorized dealer. Fresh paint, pristine interior condition.',
  'Carefully used family vehicle. All original parts, complete documents, LTO registered up to date.',
  'Excellent daily driver. Cold aircon, responsive engine, zero major issues. Ready for transfer.',
  'Low mileage for the year. Used mainly for weekend trips, garage-kept. Minor wear only.',
  'Fully loaded variant with leather seats, push-start, backup camera. Must see to appreciate.',
  'Priced to sell fast. Negotiable for serious buyers. Clean title, no encumbrance.',
  'Fleet unit, regularly maintained. All fluids changed on schedule, brand new tires included.',
  'Imported from Japan with auction sheet. Grade 4 condition verified. Ready for local registration.',
  'Owner-driven, first owner. Complete set of keys and manuals. Bank financing accepted.',
];

const BUYER_NAMES = [
  'Juan dela Cruz', 'Maria Santos', 'Roberto Garcia', 'Ana Reyes', 'Carlo Mendoza',
  'Liza Cruz', 'Mark Villanueva', 'Grace Tan', 'Jose Bautista', 'Sheena Fernandez',
  'Paolo Gomez', 'Christine Aquino',
];

const STAGES = [
  { stage: 'new',                   count: 8,  scoreMin: 20, scoreMax: 40  },
  { stage: 'contacted',             count: 10, scoreMin: 30, scoreMax: 50  },
  { stage: 'qualified',             count: 9,  scoreMin: 50, scoreMax: 70  },
  { stage: 'test_drive_scheduled',  count: 6,  scoreMin: 60, scoreMax: 80  },
  { stage: 'negotiating',           count: 7,  scoreMin: 70, scoreMax: 90  },
  { stage: 'closed_won',            count: 6,  scoreMin: 90, scoreMax: 100 },
  { stage: 'closed_lost',           count: 4,  scoreMin: 10, scoreMax: 30  },
];

const INQUIRY_MESSAGES = [
  'Interested in this unit. Is it still available for viewing?',
  'Magkano ang pinakamababang presyo? Open for nego ba?',
  'May makina pa ba itong OK? Gusto ko sana mag-test drive.',
  'Hello, interested po ako. Pwede ba mag-meet sa Makati area?',
  'Is bank financing available? What documents are needed?',
  'Is this unit flood-free? Last owner lang ba?',
  'How many owners? May service record pa ba from casa?',
  'Puwede bang makita ng weekends? Laging busy sa weekdays.',
  'What is the lowest you can go? Need the unit ASAP.',
  'Are the tires still good? Planning to use daily for work.',
];

// Activity content per stage
function activitiesForInquiry(inquiryId, stage, buyerName, make, model) {
  const acts = [];
  acts.push({ type: 'status_changed', content: `New inquiry received from ${buyerName} for ${make} ${model}. Lead created and assigned.` });
  if (['contacted','qualified','test_drive_scheduled','negotiating','closed_won','closed_lost'].includes(stage)) {
    acts.push({ type: pick(['call_made','sms_sent']), content: `Reached out to ${buyerName}. Confirmed interest and unit availability. Will follow up within 24 hours.` });
  }
  if (['qualified','test_drive_scheduled','negotiating','closed_won','closed_lost'].includes(stage)) {
    acts.push({ type: 'note_added', content: `Buyer ${buyerName} is a qualified lead. Has budget ready, looking for immediate purchase. Prefers automatic transmission.` });
  }
  if (['test_drive_scheduled','negotiating','closed_won'].includes(stage)) {
    acts.push({ type: 'test_drive_completed', content: `Test drive completed with ${buyerName}. Feedback: very satisfied with engine response and AC. Proceeding to negotiation.` });
  }
  if (['negotiating','closed_won'].includes(stage)) {
    acts.push({ type: 'meeting_held', content: `Met with ${buyerName} at the lot. Discussed final price and terms. Buyer requested 2-week processing window for bank loan.` });
  }
  if (stage === 'closed_won') {
    acts.push({ type: 'status_changed', content: `Deal closed! ${buyerName} purchased the ${make} ${model}. Payment: bank financing via BDO. OR/CR transfer in progress.` });
  }
  if (stage === 'closed_lost') {
    acts.push({ type: 'status_changed', content: `Lead lost. ${buyerName} went with another dealer. Reason: found a lower-priced unit in nearby area. Marked as closed-lost.` });
  }
  return acts;
}

async function main() {
  // 1. Check idempotency
  const existing = await prisma.user.findUnique({ where: { email: 'demo@autobentaph.com' } });
  if (existing) {
    console.log('Demo dealer already exists. Skipping seed.');
    return;
  }

  console.log('Creating demo dealer user...');
  const demoUser = await prisma.user.create({
    data: { email: 'demo@autobentaph.com', name: 'AutoBenta Demo Dealer', role: 'dealer' },
  });

  const demoDealer = await prisma.dealer.create({
    data: {
      userId: demoUser.id,
      businessName: 'AutoBenta Demo Motors',
      tier: 'pro',
      isVerified: true,
      dealerScore: 87,
      rank: 'A',
      subscriptionPlan: 'pro',
      listingCount: 50,
      responseTimeAvg: 1.4,
    },
  });
  console.log(`Demo dealer created: ${demoDealer.id}`);

  // 2. Create 12 buyer users
  console.log('Creating buyer users...');
  const buyerRecords = await Promise.all(
    BUYER_NAMES.map((name, i) =>
      prisma.user.create({
        data: {
          email: `buyer${i + 1}@demo.autobentaph.com`,
          name,
          role: 'buyer',
        },
      })
    )
  );

  // 3. Create 50 vehicle listings
  console.log('Creating 50 vehicle listings...');
  const STATUSES = [
    ...Array(40).fill('active'),
    ...Array(7).fill('sold'),
    ...Array(3).fill('pending'),
  ];
  const listingData = VEHICLES.map((v, i) => ({
    dealerId: demoDealer.id,
    make: v.make,
    model: v.model,
    year: rand(2018, 2024),
    price: rand(v.priceMin, v.priceMax),
    mileage: rand(8000, 95000),
    color: pick(COLORS),
    fuelType: v.fuel,
    transmission: pick(['automatic', 'automatic', 'manual']),
    bodyType: v.bodyType,
    condition: pick(CONDITIONS),
    status: STATUSES[i],
    description: pick(DESCRIPTIONS),
    location: pick(LOCATIONS),
    isVerified: i < 10,
    isFeatured: i < 5,
    viewCount: rand(50, 800),
    createdAt: daysAgo(rand(1, 90)),
  }));

  await prisma.vehicleListing.createMany({ data: listingData });
  const listings = await prisma.vehicleListing.findMany({ where: { dealerId: demoDealer.id } });
  console.log(`Created ${listings.length} listings.`);

  // 4. Create 50 inquiries across stages
  console.log('Creating 50 inquiries...');
  const inquiryRows = [];
  for (const stageDef of STAGES) {
    for (let i = 0; i < stageDef.count; i++) {
      const buyer = pick(buyerRecords);
      const listing = pick(listings);
      const isActive = !['closed_won', 'closed_lost'].includes(stageDef.stage);
      inquiryRows.push({
        listingId: listing.id,
        dealerId: demoDealer.id,
        buyerId: buyer.id,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        buyerPhone: `09${rand(100000000, 999999999)}`,
        message: pick(INQUIRY_MESSAGES),
        status: stageDef.stage,
        stage: stageDef.stage,
        leadScore: rand(stageDef.scoreMin, stageDef.scoreMax),
        nextFollowUpAt: isActive ? daysFromNow(rand(1, 7)) : null,
        createdAt: daysAgo(rand(1, 30)),
      });
    }
  }

  await prisma.inquiry.createMany({ data: inquiryRows });
  const inquiries = await prisma.inquiry.findMany({ where: { dealerId: demoDealer.id } });
  console.log(`Created ${inquiries.length} inquiries.`);

  // 5. Create activity logs (2-5 per inquiry)
  console.log('Creating activity logs...');
  const activityRows = [];
  for (const inq of inquiries) {
    const listing = listings.find((l) => l.id === inq.listingId) || listings[0];
    const acts = activitiesForInquiry(inq.id, inq.stage, inq.buyerName, listing.make, listing.model);
    for (const act of acts) {
      activityRows.push({
        dealerId: demoDealer.id,
        inquiryId: inq.id,
        type: act.type,
        content: act.content,
        createdAt: daysAgo(rand(0, 25)),
      });
    }
  }
  await prisma.dealerActivity.createMany({ data: activityRows });
  console.log(`Created ${activityRows.length} activity log entries.`);

  // 6. Create 200 analytics events over last 30 days
  console.log('Creating analytics events...');
  const eventRows = [];
  // ~150 listing_view
  for (let i = 0; i < 150; i++) {
    const listing = pick(listings);
    const daysBack = rand(0, 29);
    const date = daysAgo(daysBack);
    // weekday weighting: skip ~30% of weekend days
    const day = date.getDay();
    if ((day === 0 || day === 6) && Math.random() < 0.35) continue;
    eventRows.push({
      dealerId: demoDealer.id,
      listingId: listing.id,
      eventType: 'listing_view',
      properties: { make: listing.make, model: listing.model, source: pick(['organic','search','featured']) },
      createdAt: date,
    });
  }
  // ~30 lead_created
  for (let i = 0; i < 30; i++) {
    const listing = pick(listings);
    eventRows.push({
      dealerId: demoDealer.id,
      listingId: listing.id,
      eventType: 'lead_created',
      properties: { stage: 'new', listingMake: listing.make },
      createdAt: daysAgo(rand(0, 29)),
    });
  }
  // ~20 lead_status_changed
  for (let i = 0; i < 20; i++) {
    eventRows.push({
      dealerId: demoDealer.id,
      listingId: pick(listings).id,
      eventType: 'lead_status_changed',
      properties: { from: pick(['new','contacted','qualified']), to: pick(['contacted','qualified','test_drive_scheduled','negotiating']) },
      createdAt: daysAgo(rand(0, 29)),
    });
  }
  await prisma.analyticsEvent.createMany({ data: eventRows });
  console.log(`Created ${eventRows.length} analytics events.`);

  // 7. Lead credits
  console.log('Creating lead credits...');
  await prisma.leadCredit.create({
    data: { dealerId: demoDealer.id, balance: 45, lifetimeCredits: 120 },
  });

  // 8. Featured listings (3)
  console.log('Creating featured listings...');
  const featuredTargets = listings.filter((l) => l.isFeatured).slice(0, 3);
  const featureTypes = ['homepage', 'search_boost', 'sponsored'];
  const featurePrices = [2999, 999, 1499];
  await prisma.featuredListing.createMany({
    data: featuredTargets.map((l, i) => ({
      listingId: l.id,
      dealerId: demoDealer.id,
      featureType: featureTypes[i],
      status: 'active',
      endAt: daysFromNow(30),
      pricePhp: featurePrices[i],
      createdAt: daysAgo(rand(1, 5)),
    })),
  });

  console.log('Demo seed complete. Summary:');
  console.log('  Dealer:            1 (demo@autobentaph.com)');
  console.log('  Buyers:            12');
  console.log('  Listings:          50');
  console.log('  Inquiries:         50');
  console.log(`  Activity logs:     ${activityRows.length}`);
  console.log(`  Analytics events:  ${eventRows.length}`);
  console.log('  Lead credits:      balance=45, lifetime=120');
  console.log('  Featured listings: 3');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

// Usage: node backend/prisma/seedAccounts.js
// Creates 5 test accounts for dashboard demo and QA.
// Idempotent — skips any account whose email already exists.
//
// Accounts created:
//   dealer1@autobentaph.test  — Cruz Vehicles (verified dealer, 8 listings)
//   dealer2@autobentaph.test  — Soriano Motors (unverified dealer, 4 listings)
//   seller1@autobentaph.test  — Juan Reyes (private seller, 3 listings)
//   seller2@autobentaph.test  — Maria Santos (private seller, 2 listings)
//   buyer1@autobentaph.test   — Carlos dela Cruz (buyer, no listings)
//
// Password for ALL accounts: AutoBenta2026!

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PASSWORD = 'AutoBenta2026!';

const ACCOUNTS = [
  {
    email: 'dealer1@autobentaph.test',
    name: 'Maria Cruz',
    phone: '09171234001',
    role: 'dealer',
    dealer: {
      businessName: 'Cruz Vehicles',
      city: 'Pasig',
      address: '123 Ortigas Ave, Pasig City',
      description: 'Trusted pre-owned vehicle dealer in Pasig since 2015. Specializing in Toyota and Honda.',
      isVerified: true,
      tier: 'verified_pro',
      plan: 'pro',
    },
    listings: [
      { make: 'Toyota', model: 'Fortuner', year: 2021, variant: '2.4 V Diesel 4x2 AT', price: 1780000, mileage: 35000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'suv', condition: 'excellent', city: 'Pasig' },
      { make: 'Toyota', model: 'Hilux',    year: 2020, variant: 'G 4x2 MT',             price: 1050000, mileage: 42000, fuelType: 'diesel', transmission: 'manual',    bodyType: 'pickup', condition: 'good', city: 'Pasig' },
      { make: 'Toyota', model: 'Innova',   year: 2022, variant: 'E Diesel MT',           price: 1180000, mileage: 18000, fuelType: 'diesel', transmission: 'manual',    bodyType: 'van',  condition: 'excellent', city: 'Pasig' },
      { make: 'Honda',  model: 'CR-V',     year: 2020, variant: '1.5 Turbo Prestige CVT', price: 1250000, mileage: 42000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'crossover', condition: 'excellent', city: 'Pasig' },
      { make: 'Honda',  model: 'Civic',    year: 2019, variant: '1.8 E CVT',             price: 820000,  mileage: 58000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'sedan', condition: 'good', city: 'Pasig' },
      { make: 'Mitsubishi', model: 'Montero Sport', year: 2021, variant: 'GLS 2WD AT',  price: 1490000, mileage: 27000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'suv', condition: 'excellent', city: 'Pasig' },
      { make: 'Ford',   model: 'Ranger',   year: 2020, variant: 'Wildtrak 2.0 AT',       price: 1350000, mileage: 48000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'pickup', condition: 'good', city: 'Pasig' },
      { make: 'Hyundai', model: 'Tucson',  year: 2019, variant: '2.0 GL AT',             price: 890000,  mileage: 62000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'crossover', condition: 'good', city: 'Pasig' },
    ],
  },
  {
    email: 'dealer2@autobentaph.test',
    name: 'Ernesto Soriano',
    phone: '09182345002',
    role: 'dealer',
    dealer: {
      businessName: 'Soriano Motor Works',
      city: 'Caloocan',
      address: '456 EDSA Extension, Caloocan City',
      description: 'Family-run dealership with 20 years in the business. Budget-friendly options.',
      isVerified: false,
      tier: 'basic',
      plan: 'free',
    },
    listings: [
      { make: 'Toyota', model: 'Vios',   year: 2018, variant: '1.3 E MT',       price: 490000,  mileage: 75000, fuelType: 'gasoline', transmission: 'manual',    bodyType: 'sedan',   condition: 'good', city: 'Caloocan' },
      { make: 'Toyota', model: 'Wigo',   year: 2020, variant: '1.0 G AT',        price: 420000,  mileage: 38000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'hatchback', condition: 'good', city: 'Caloocan' },
      { make: 'Mitsubishi', model: 'Mirage', year: 2019, variant: 'GLS CVT',     price: 430000,  mileage: 54000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'hatchback', condition: 'good', city: 'Caloocan' },
      { make: 'Suzuki', model: 'Ertiga', year: 2020, variant: 'GL MT',           price: 580000,  mileage: 44000, fuelType: 'gasoline', transmission: 'manual',    bodyType: 'van',     condition: 'good', city: 'Caloocan' },
    ],
  },
  {
    email: 'seller1@autobentaph.test',
    name: 'Juan Reyes',
    phone: '09193456003',
    role: 'seller',
    dealer: null,
    listings: [
      { make: 'Toyota', model: 'Corolla Altis', year: 2017, variant: '1.6 V AT', price: 720000, mileage: 68000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'sedan', condition: 'good', city: 'Quezon City', sellerType: 'private' },
      { make: 'Honda',  model: 'Jazz',          year: 2018, variant: '1.5 V CVT', price: 650000, mileage: 55000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'hatchback', condition: 'excellent', city: 'Quezon City', sellerType: 'private' },
      { make: 'Nissan', model: 'Navara',        year: 2019, variant: 'EL 4x2 AT', price: 980000, mileage: 61000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'pickup', condition: 'good', city: 'Quezon City', sellerType: 'private' },
    ],
  },
  {
    email: 'seller2@autobentaph.test',
    name: 'Maria Santos',
    phone: '09204567004',
    role: 'seller',
    dealer: null,
    listings: [
      { make: 'Hyundai', model: 'Starex', year: 2017, variant: 'GL MT', price: 850000, mileage: 125000, fuelType: 'diesel', transmission: 'manual', bodyType: 'van', condition: 'fair', city: 'Davao City', sellerType: 'private' },
      { make: 'Ford',    model: 'EcoSport', year: 2020, variant: '1.5 Trend AT', price: 620000, mileage: 32000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'crossover', condition: 'excellent', city: 'Cebu City', sellerType: 'private' },
    ],
  },
  {
    email: 'buyer1@autobentaph.test',
    name: 'Carlos dela Cruz',
    phone: '09215678005',
    role: 'buyer',
    dealer: null,
    listings: [],
  },
];

async function seed() {
  console.log('\n🌱  AutoBentaPH — Seed Accounts\n');

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const results = [];

  for (const account of ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { email: account.email } });

    if (existing) {
      console.log(`  ⏭  Skipped (exists): ${account.email}`);
      results.push({ ...account, skipped: true });
      continue;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: account.email,
        name: account.name,
        phone: account.phone,
        role: account.role,
        passwordHash,
        isVerified: true,
        isActive: true,
      },
    });

    // Create dealer record if needed
    let dealerId = null;
    if (account.dealer) {
      const dealer = await prisma.dealer.create({
        data: {
          userId: user.id,
          businessName: account.dealer.businessName,
          city: account.dealer.city,
          address: account.dealer.address,
          description: account.dealer.description,
          isVerified: account.dealer.isVerified,
          tier: account.dealer.tier,
        },
      });
      dealerId = dealer.id;

      // Create subscription
      await prisma.dealerSubscription.create({
        data: {
          dealerId: dealer.id,
          plan: account.dealer.plan,
          status: 'active',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 86400000),
        },
      });
    }

    // Create listings
    let listingCount = 0;
    for (const v of account.listings) {
      await prisma.vehicleListing.create({
        data: {
          sellerId: user.id,
          dealerId: dealerId,
          make: v.make,
          model: v.model,
          year: v.year,
          variant: v.variant,
          price: v.price,
          mileage: v.mileage,
          fuelType: v.fuelType,
          transmission: v.transmission,
          bodyType: v.bodyType,
          condition: v.condition,
          location: v.city,
          city: v.city,
          region: v.region || 'NCR',
          description: `${v.year} ${v.make} ${v.model} ${v.variant} in ${v.condition} condition. Well-maintained, complete documents.`,
          status: 'active',
          sellerType: v.sellerType || (dealerId ? 'dealer' : 'private'),
        },
      });
      listingCount++;
    }

    console.log(`  ✅  Created: ${account.email} (${account.role}${listingCount > 0 ? `, ${listingCount} listings` : ''})`);
    results.push({ ...account, skipped: false });
  }

  // Print credential table
  console.log('\n' + '═'.repeat(72));
  console.log('  SEED ACCOUNT CREDENTIALS');
  console.log('═'.repeat(72));
  console.log(`  Password (all accounts): ${PASSWORD}\n`);
  console.log('  Email                          Role      Name');
  console.log('  ' + '─'.repeat(68));
  for (const a of ACCOUNTS) {
    const role = a.role.padEnd(9);
    const email = a.email.padEnd(36);
    console.log(`  ${email} ${role} ${a.name}`);
    if (a.dealer) {
      console.log(`  ${''.padEnd(36)} ${' '.repeat(9)} → ${a.dealer.businessName} (${a.dealer.plan}, ${a.dealer.isVerified ? 'verified ✓' : 'unverified'})`);
    }
  }
  console.log('═'.repeat(72) + '\n');
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

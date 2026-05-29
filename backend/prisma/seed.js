require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PH_CITIES = [
  { city: 'Quezon City', region: 'NCR' },
  { city: 'Makati', region: 'NCR' },
  { city: 'Mandaluyong', region: 'NCR' },
  { city: 'Pasig', region: 'NCR' },
  { city: 'Cebu City', region: 'Region VII' },
  { city: 'Davao City', region: 'Region XI' },
  { city: 'Angeles City', region: 'Region III' },
  { city: 'Bacoor', region: 'Region IV-A' },
  { city: 'San Pedro', region: 'Region IV-A' },
];

// Wikimedia Commons — free, model-specific car photos
const W = (path) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;

const PH_CAR_LISTINGS = [
  {
    make: 'Toyota', model: 'Vios', year: 2020, variant: '1.3 XLE CVT',
    mileage: 42000, price: 620000, fuelType: 'gasoline', transmission: 'cvt',
    color: 'Silver', bodyType: 'Sedan', ownerCount: 1, condition: 'good',
    hasOrCr: true, serviceHistory: true, hasAccident: false, hasFlood: false,
    description: 'Casa-maintained Toyota Vios 1.3 XLE CVT. Complete service records from Toyota Pasig. All original parts, no reconditioning. Plate ending 8. Reason for selling: upgrading to SUV.',
    sellerType: 'private',
    city: 'Pasig', region: 'NCR', location: 'Pasig City',
    photos: [
      { url: W('0/07/2020_Toyota_Vios_1.3_J_in_Alumina_Jade_Metallic%2C_front_left%2C_08-11-2024.jpg'), isPrimary: true },
    ],
  },
  {
    make: 'Mitsubishi', model: 'Montero Sport', year: 2019, variant: 'GLS Premium 2WD AT',
    mileage: 68000, price: 1250000, fuelType: 'diesel', transmission: 'automatic',
    color: 'White Pearl', bodyType: 'SUV', ownerCount: 2, condition: 'good',
    hasOrCr: true, serviceHistory: true, hasAccident: false, hasFlood: false,
    description: 'Mitsubishi Montero Sport GLS Premium. Diesel, automatic, 4x2. Complete PMS records. Slightly modified with TRD running boards and roof rack. Selling due to migration.',
    sellerType: 'private',
    city: 'Quezon City', region: 'NCR', location: 'Quezon City',
    photos: [
      { url: W('7/7b/2021_Mitsubishi_Montero_Sport_Limited_%28cropped%29.jpg'), isPrimary: true },
    ],
  },
  {
    make: 'Toyota', model: 'Fortuner', year: 2021, variant: 'V Diesel 4x2 AT',
    mileage: 35000, price: 1780000, fuelType: 'diesel', transmission: 'automatic',
    color: 'Black', bodyType: 'SUV', ownerCount: 1, condition: 'excellent',
    hasOrCr: true, serviceHistory: true, hasAccident: false, hasFlood: false,
    description: 'Toyota Fortuner V Diesel. Top of the line variant. Full casa PMS, all sticker complete. Selling as-is. Price is slightly negotiable for serious buyers. Viewing in Makati.',
    sellerType: 'dealer',
    city: 'Makati', region: 'NCR', location: 'Makati City',
    photos: [
      { url: W('d/d5/2022_Toyota_Fortuner_2.8_VRZ_GR_Sport_4x2_GUN166R_%2820220428%29.jpg'), isPrimary: true },
    ],
  },
  {
    make: 'Honda', model: 'City', year: 2022, variant: '1.5 RS CVT',
    mileage: 18000, price: 870000, fuelType: 'gasoline', transmission: 'cvt',
    color: 'Sonic Gray Pearl', bodyType: 'Sedan', ownerCount: 1, condition: 'excellent',
    hasOrCr: true, serviceHistory: true, hasAccident: false, hasFlood: false,
    description: 'Honda City RS 6th generation. Almost brand new condition. Has Honda Sensing package. Clean interior with factory plastic still on some panels. Must see.',
    sellerType: 'private',
    city: 'Mandaluyong', region: 'NCR', location: 'Mandaluyong City',
    photos: [
      { url: W('c/c6/2019_Honda_City_RS.jpg'), isPrimary: true },
    ],
  },
  {
    make: 'Ford', model: 'Ranger', year: 2018, variant: 'Wildtrak 2.2 4x4 AT',
    mileage: 95000, price: 1050000, fuelType: 'diesel', transmission: 'automatic',
    color: 'Frozen White', bodyType: 'Pickup', ownerCount: 2, condition: 'good',
    hasOrCr: true, serviceHistory: false, hasAccident: true, hasFlood: false,
    accidentNotes: 'Minor fender bender at rear — already repaired at Ford-accredited shop. No frame damage.',
    description: 'Ford Ranger Wildtrak 4x4. High trim, loaded with features. Used for provincial trips. Accident disclosed — minor rear bumper damage, professionally repaired. Priced accordingly.',
    sellerType: 'private',
    city: 'Angeles City', region: 'Region III', location: 'Angeles City, Pampanga',
    photos: [
      { url: W('5/58/Ford_Ranger_Wildtrak_%28T6%2C_P375%29_1X7A6170.jpg'), isPrimary: true },
    ],
  },
  {
    make: 'Nissan', model: 'Navara', year: 2020, variant: 'EL Calibre 4x2 AT',
    mileage: 55000, price: 1080000, fuelType: 'diesel', transmission: 'automatic',
    color: 'Blade Silver', bodyType: 'Pickup', ownerCount: 1, condition: 'good',
    hasOrCr: true, serviceHistory: true, hasAccident: false, hasFlood: false,
    description: 'Nissan Navara EL Calibre. Single owner, company-owned. Complete service records from Nissan Cebu. Good tires, clean interior. No modifications. Plate ending 5.',
    sellerType: 'dealer',
    city: 'Cebu City', region: 'Region VII', location: 'Cebu City',
    photos: [
      { url: W('a/a7/2017_Nissan_Navara_Tekna_DCi_2.3_Front.jpg'), isPrimary: true },
    ],
  },
  {
    make: 'Suzuki', model: 'Ertiga', year: 2021, variant: 'GL AT',
    mileage: 28000, price: 740000, fuelType: 'gasoline', transmission: 'automatic',
    color: 'Premium Silver', bodyType: 'MPV', ownerCount: 1, condition: 'excellent',
    hasOrCr: true, serviceHistory: true, hasAccident: false, hasFlood: false,
    description: 'Suzuki Ertiga GL Automatic. Family van, very well maintained. Seats 7 comfortably. Fuel efficient for daily city use. Has dashcam and tint. Cavite area only for viewing.',
    sellerType: 'private',
    city: 'Bacoor', region: 'Region IV-A', location: 'Bacoor, Cavite',
    photos: [
      { url: W('e/e7/2018_Suzuki_Ertiga_GL%2C_Royal_Plaza%2C_South_Surabaya.jpg'), isPrimary: true },
    ],
  },
  {
    make: 'Hyundai', model: 'Starex', year: 2017, variant: 'GL Diesel MT',
    mileage: 125000, price: 850000, fuelType: 'diesel', transmission: 'manual',
    color: 'Milky Beige', bodyType: 'Van', ownerCount: 3, condition: 'fair',
    hasOrCr: true, serviceHistory: false, hasAccident: false, hasFlood: false,
    description: 'Hyundai Starex GL Diesel Manual. 11-seater van, used as shuttle. High mileage but well-maintained engine. Needs minor interior touch-up. Good for business use. Located in Davao.',
    sellerType: 'repossessed',
    city: 'Davao City', region: 'Region XI', location: 'Davao City',
    photos: [
      { url: W('0/09/00_hyundai_starex_van_1_%28cropped%29.jpg'), isPrimary: true },
    ],
  },
];

async function main() {
  console.log('Seeding AutoBenta PH database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autobenta.ph' },
    update: {},
    create: {
      email: 'admin@autobenta.ph',
      passwordHash: adminPassword,
      name: 'AutoBenta Admin',
      role: 'admin',
      isVerified: true,
    },
  });
  console.log('Admin user created:', admin.email);

  // Inspector
  const inspectorPassword = await bcrypt.hash('inspector123', 12);
  const inspector = await prisma.user.upsert({
    where: { email: 'inspector@autobenta.ph' },
    update: {},
    create: {
      email: 'inspector@autobenta.ph',
      passwordHash: inspectorPassword,
      name: 'Jose Reyes',
      role: 'inspector',
      isVerified: true,
    },
  });

  // Dealer user
  const dealerPassword = await bcrypt.hash('dealer123', 12);
  const dealerUser = await prisma.user.upsert({
    where: { email: 'dealer@lto-motors.ph' },
    update: {},
    create: {
      email: 'dealer@lto-motors.ph',
      passwordHash: dealerPassword,
      name: 'Mario Santos',
      role: 'dealer',
      phone: '09171234567',
      isVerified: true,
    },
  });

  const dealer = await prisma.dealer.upsert({
    where: { userId: dealerUser.id },
    update: {},
    create: {
      userId: dealerUser.id,
      businessName: 'LTO Motors PH',
      description: 'Trusted pre-owned vehicle dealer in Metro Manila. Serving buyers since 2010. All units are inspected and tested.',
      address: 'Epifanio de los Santos Avenue, Mandaluyong',
      city: 'Mandaluyong',
      website: 'https://ltomotors.ph',
      licenseNumber: 'LTO-2024-001234',
      isVerified: true,
    },
  });

  // Second dealer
  const dealer2Password = await bcrypt.hash('dealer123', 12);
  const dealer2User = await prisma.user.upsert({
    where: { email: 'dealer@cebu-autocenter.ph' },
    update: {},
    create: {
      email: 'dealer@cebu-autocenter.ph',
      passwordHash: dealer2Password,
      name: 'Ana Villanueva',
      role: 'dealer',
      phone: '09281234567',
      isVerified: true,
    },
  });

  const dealer2 = await prisma.dealer.upsert({
    where: { userId: dealer2User.id },
    update: {},
    create: {
      userId: dealer2User.id,
      businessName: 'Cebu Auto Center',
      description: 'Visayas\' leading pre-owned car dealer. Quality assured, financing available.',
      address: 'M.J. Cuenco Avenue, Cebu City',
      city: 'Cebu City',
      licenseNumber: 'LTO-2024-005678',
      isVerified: true,
    },
  });

  // Buyer users
  const buyerPassword = await bcrypt.hash('buyer123', 12);
  const buyer1 = await prisma.user.upsert({
    where: { email: 'juan@example.com' },
    update: {},
    create: {
      email: 'juan@example.com',
      passwordHash: buyerPassword,
      name: 'Juan dela Cruz',
      role: 'buyer',
      phone: '09151234567',
    },
  });

  // Private sellers
  const sellerPassword = await bcrypt.hash('seller123', 12);
  const seller1 = await prisma.user.upsert({
    where: { email: 'carlo@example.com' },
    update: {},
    create: {
      email: 'carlo@example.com',
      passwordHash: sellerPassword,
      name: 'Carlo Mendoza',
      role: 'seller',
      phone: '09201234567',
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'marissa@example.com' },
    update: {},
    create: {
      email: 'marissa@example.com',
      passwordHash: sellerPassword,
      name: 'Marissa Reyes',
      role: 'seller',
      phone: '09301234567',
    },
  });

  console.log('Users created.');

  // Create listings
  const sellerMap = {
    private: [seller1.id, seller2.id],
    dealer: dealerUser.id,
    repossessed: dealerUser.id,
  };

  for (const carData of PH_CAR_LISTINGS) {
    const { photos, ...listingData } = carData;

    let sellerId;
    let dealerId = null;
    if (listingData.sellerType === 'dealer') {
      sellerId = dealerUser.id;
      dealerId = dealer.id;
    } else if (listingData.sellerType === 'repossessed') {
      sellerId = dealer2User.id;
      dealerId = dealer2.id;
    } else {
      sellerId = sellerMap.private[Math.floor(Math.random() * sellerMap.private.length)];
    }

    const existingListing = await prisma.vehicleListing.findFirst({
      where: { make: listingData.make, model: listingData.model, year: listingData.year, sellerId },
    });

    let listing;
    if (!existingListing) {
      listing = await prisma.vehicleListing.create({
        data: {
          ...listingData,
          sellerId,
          dealerId,
          status: 'active',
          viewCount: Math.floor(Math.random() * 200) + 10,
          inquiryCount: Math.floor(Math.random() * 15),
        },
      });
      console.log(`Created listing: ${listing.year} ${listing.make} ${listing.model}`);
    } else {
      listing = existingListing;
      // Replace photos so URL changes in seed data are picked up on re-seed
      await prisma.vehiclePhoto.deleteMany({ where: { listingId: listing.id } });
      console.log(`Updated photos for: ${listingData.year} ${listingData.make} ${listingData.model}`);
    }

    if (photos?.length) {
      await prisma.vehiclePhoto.createMany({
        data: photos.map((p, idx) => ({ ...p, listingId: listing.id, sortOrder: idx })),
      });
    }

    // Add a sample inquiry for buyer
    const existingInquiry = await prisma.inquiry.findFirst({ where: { buyerId: buyer1.id, listingId: listing.id } });
    if (!existingInquiry && listing.status === 'active') {
      await prisma.inquiry.create({
        data: {
          buyerId: buyer1.id,
          listingId: listing.id,
          message: `Hi, is the ${listing.year} ${listing.make} ${listing.model} still available? I'm interested and would like to schedule a viewing this weekend.`,
          contactPhone: '09151234567',
        },
      });
    }
  }

  // Create a sample inspection request
  const firstListing = await prisma.vehicleListing.findFirst({ where: { status: 'active' } });
  if (firstListing) {
    const existingInspection = await prisma.inspectionRequest.findFirst({ where: { buyerId: buyer1.id, listingId: firstListing.id } });
    if (!existingInspection) {
      await prisma.inspectionRequest.create({
        data: {
          buyerId: buyer1.id,
          listingId: firstListing.id,
          status: 'requested',
          notes: 'Please check the engine and suspension thoroughly.',
          preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Create a sample financing request
  if (firstListing) {
    const existingFinancing = await prisma.financingRequest.findFirst({ where: { buyerId: buyer1.id, listingId: firstListing.id } });
    if (!existingFinancing) {
      await prisma.financingRequest.create({
        data: {
          buyerId: buyer1.id,
          listingId: firstListing.id,
          vehiclePrice: firstListing.price,
          downPayment: parseFloat(firstListing.price) * 0.2,
          loanAmount: parseFloat(firstListing.price) * 0.8,
          termMonths: 60,
          incomeRange: '50k_100k',
          employmentType: 'employed',
          monthlyPayment: Math.round(parseFloat(firstListing.price) * 0.8 * 0.021),
          status: 'requested',
        },
      });
    }
  }

  console.log('\nSeed complete! Test credentials:');
  console.log('  Admin:    admin@autobenta.ph / admin123');
  console.log('  Inspector: inspector@autobenta.ph / inspector123');
  console.log('  Dealer:   dealer@lto-motors.ph / dealer123');
  console.log('  Buyer:    juan@example.com / buyer123');
  console.log('  Seller:   carlo@example.com / seller123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

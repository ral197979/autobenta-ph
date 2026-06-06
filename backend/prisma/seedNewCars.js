// Seeds a starter catalog of popular Philippine new-car models.
// Prices/specs are representative starting points, not an official price list —
// meant to be edited/expanded via admin later.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const W = (p) => `https://upload.wikimedia.org/wikipedia/commons/${p}`;

const MODELS = [
  {
    make: 'Toyota', model: 'Vios', bodyType: 'Sedan', fuelType: 'gasoline', startingPrice: 745000, year: 2025,
    imageUrl: W('0/07/2020_Toyota_Vios_1.3_J_in_Alumina_Jade_Metallic%2C_front_left%2C_08-11-2024.jpg'),
    description: 'The Philippines’ best-selling subcompact sedan — efficient, practical, and proven.',
    isFeatured: true,
    specs: { Engine: '1.3L / 1.5L DOHC', Transmission: 'MT / CVT', Seating: '5', Drivetrain: 'FWD', 'Fuel Economy': '~18 km/L' },
    variants: [
      { name: '1.3 XLE MT', price: 745000, transmission: 'manual', fuelType: 'gasoline' },
      { name: '1.3 XLE CVT', price: 805000, transmission: 'cvt', fuelType: 'gasoline' },
      { name: '1.5 GR-S CVT', price: 1020000, transmission: 'cvt', fuelType: 'gasoline' },
    ],
  },
  {
    make: 'Toyota', model: 'Raize', bodyType: 'Crossover', fuelType: 'gasoline', startingPrice: 786000, year: 2025,
    description: 'A compact urban crossover with bold styling and a high driving position.',
    isFeatured: true,
    specs: { Engine: '1.0L Turbo / 1.2L', Transmission: 'CVT', Seating: '5', Drivetrain: 'FWD', 'Fuel Economy': '~20 km/L' },
    variants: [
      { name: '1.2 E CVT', price: 786000, transmission: 'cvt', fuelType: 'gasoline' },
      { name: '1.0 Turbo CVT', price: 1075000, transmission: 'cvt', fuelType: 'gasoline' },
    ],
  },
  {
    make: 'Mitsubishi', model: 'Xpander', bodyType: 'MPV', fuelType: 'gasoline', startingPrice: 1108000, year: 2025,
    imageUrl: W('7/7b/2021_Mitsubishi_Montero_Sport_Limited_%28cropped%29.jpg'),
    description: 'A 7-seat MPV built for Filipino families — spacious, flexible, and frugal.',
    isFeatured: true,
    specs: { Engine: '1.5L MIVEC', Transmission: 'MT / AT', Seating: '7', Drivetrain: 'FWD', 'Fuel Economy': '~16 km/L' },
    variants: [
      { name: 'GLX MT', price: 1108000, transmission: 'manual', fuelType: 'gasoline' },
      { name: 'GLS AT', price: 1280000, transmission: 'automatic', fuelType: 'gasoline' },
      { name: 'Cross AT', price: 1375000, transmission: 'automatic', fuelType: 'gasoline' },
    ],
  },
  {
    make: 'Honda', model: 'City', bodyType: 'Sedan', fuelType: 'gasoline', startingPrice: 973000, year: 2025,
    description: 'A refined subcompact sedan with a roomy cabin and Honda SENSING safety.',
    specs: { Engine: '1.5L DOHC i-VTEC', Transmission: 'CVT', Seating: '5', Drivetrain: 'FWD', 'Fuel Economy': '~19 km/L' },
    variants: [
      { name: 'S CVT', price: 973000, transmission: 'cvt', fuelType: 'gasoline' },
      { name: 'RS CVT', price: 1208000, transmission: 'cvt', fuelType: 'gasoline' },
    ],
  },
  {
    make: 'Ford', model: 'Territory', bodyType: 'SUV', fuelType: 'gasoline', startingPrice: 1310000, year: 2025,
    description: 'A tech-forward compact SUV with a large panoramic display and turbo power.',
    isFeatured: true,
    specs: { Engine: '1.5L EcoBoost Turbo', Transmission: 'CVT', Seating: '5', Drivetrain: 'FWD', 'Fuel Economy': '~15 km/L' },
    variants: [
      { name: 'Trend', price: 1310000, transmission: 'cvt', fuelType: 'gasoline' },
      { name: 'Titanium X', price: 1610000, transmission: 'cvt', fuelType: 'gasoline' },
    ],
  },
  {
    make: 'Nissan', model: 'Almera', bodyType: 'Sedan', fuelType: 'gasoline', startingPrice: 728000, year: 2025,
    description: 'A turbocharged subcompact sedan that punches above its class on efficiency.',
    specs: { Engine: '1.0L Turbo', Transmission: 'MT / CVT', Seating: '5', Drivetrain: 'FWD', 'Fuel Economy': '~22 km/L' },
    variants: [
      { name: 'VE MT', price: 728000, transmission: 'manual', fuelType: 'gasoline' },
      { name: 'VL CVT', price: 1019000, transmission: 'cvt', fuelType: 'gasoline' },
    ],
  },
  {
    make: 'Toyota', model: 'Fortuner', bodyType: 'SUV', fuelType: 'diesel', startingPrice: 1765000, year: 2025,
    imageUrl: W('d/d5/2022_Toyota_Fortuner_2.8_VRZ_GR_Sport_4x2_GUN166R_%2820220428%29.jpg'),
    description: 'A rugged, dependable midsize diesel SUV built for any Philippine road.',
    specs: { Engine: '2.4L / 2.8L Turbo Diesel', Transmission: 'MT / AT', Seating: '7', Drivetrain: '4x2 / 4x4', 'Fuel Economy': '~13 km/L' },
    variants: [
      { name: '2.4 G 4x2 MT', price: 1765000, transmission: 'manual', fuelType: 'diesel' },
      { name: '2.4 V 4x2 AT', price: 2090000, transmission: 'automatic', fuelType: 'diesel' },
      { name: '2.8 LTD 4x4 AT', price: 2548000, transmission: 'automatic', fuelType: 'diesel' },
    ],
  },
  {
    make: 'BYD', model: 'Sealion 7', bodyType: 'SUV', fuelType: 'electric', startingPrice: 2588000, year: 2025,
    isElectric: true, isFeatured: true,
    description: 'A fully electric performance SUV with long range and rapid charging.',
    specs: { Motor: 'Dual / Single', Range: '~480 km', Battery: '82.5 kWh', Seating: '5', Drivetrain: 'RWD / AWD', '0-100': '~4.5s' },
    variants: [
      { name: 'Premium RWD', price: 2588000, transmission: 'automatic', fuelType: 'electric' },
      { name: 'Performance AWD', price: 2988000, transmission: 'automatic', fuelType: 'electric' },
    ],
  },
  {
    make: 'Hyundai', model: 'Creta', bodyType: 'Crossover', fuelType: 'gasoline', startingPrice: 1150000, year: 2025,
    description: 'A stylish compact crossover with a premium cabin and modern tech.',
    specs: { Engine: '1.5L Smartstream', Transmission: 'IVT', Seating: '5', Drivetrain: 'FWD', 'Fuel Economy': '~17 km/L' },
    variants: [
      { name: 'GL IVT', price: 1150000, transmission: 'cvt', fuelType: 'gasoline' },
      { name: 'GLS IVT', price: 1395000, transmission: 'cvt', fuelType: 'gasoline' },
    ],
  },
];

async function main() {
  await prisma.newCarVariant.deleteMany();
  await prisma.newCarModel.deleteMany();
  for (const m of MODELS) {
    const { variants, ...model } = m;
    await prisma.newCarModel.create({ data: { ...model, variants: { create: variants } } });
  }
  const count = await prisma.newCarModel.count();
  console.log(`Seeded ${count} new-car models.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

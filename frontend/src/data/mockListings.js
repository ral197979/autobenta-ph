// Mock PH car listings for homepage display when API has no data yet.
// Wikimedia Commons — free, model-specific car photos
const W = (path) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;

export const MOCK_LISTINGS = [
  {
    id: 'mock-1',
    year: 2021, make: 'Toyota', model: 'Vios', variant: '1.3 XLE CVT',
    price: 685000, mileage: 32000, transmission: 'cvt', fuelType: 'gasoline',
    bodyType: 'Sedan', condition: 'excellent', city: 'Quezon City', sellerType: 'dealer',
    photos: [{ url: W('0/07/2020_Toyota_Vios_1.3_J_in_Alumina_Jade_Metallic%2C_front_left%2C_08-11-2024.jpg') }],
    inspectionRequests: [{ status: 'completed' }], dealer: { isVerified: true },
  },
  {
    id: 'mock-2',
    year: 2020, make: 'Mitsubishi', model: 'Montero Sport', variant: 'GLS 4x2 AT',
    price: 1495000, mileage: 48000, transmission: 'automatic', fuelType: 'diesel',
    bodyType: 'SUV', condition: 'excellent', city: 'Makati', sellerType: 'dealer',
    photos: [{ url: W('7/7b/2021_Mitsubishi_Montero_Sport_Limited_%28cropped%29.jpg') }],
    inspectionRequests: [{ status: 'completed' }], dealer: { isVerified: true },
  },
  {
    id: 'mock-3',
    year: 2022, make: 'Toyota', model: 'Fortuner', variant: 'G 4x2 AT Diesel',
    price: 1820000, mileage: 21500, transmission: 'automatic', fuelType: 'diesel',
    bodyType: 'SUV', condition: 'excellent', city: 'Pasig', sellerType: 'dealer',
    photos: [{ url: W('d/d5/2022_Toyota_Fortuner_2.8_VRZ_GR_Sport_4x2_GUN166R_%2820220428%29.jpg') }],
    inspectionRequests: [{ status: 'completed' }], dealer: { isVerified: true },
  },
  {
    id: 'mock-4',
    year: 2019, make: 'Honda', model: 'City', variant: '1.5 VX Navi CVT',
    price: 595000, mileage: 56000, transmission: 'cvt', fuelType: 'gasoline',
    bodyType: 'Sedan', condition: 'good', city: 'Cebu City', sellerType: 'private',
    photos: [{ url: W('c/c6/2019_Honda_City_RS.jpg') }],
    inspectionRequests: [], dealer: null,
  },
  {
    id: 'mock-5',
    year: 2021, make: 'Ford', model: 'Ranger', variant: 'Wildtrak 2.0 Bi-Turbo 4x4',
    price: 1685000, mileage: 38000, transmission: 'automatic', fuelType: 'diesel',
    bodyType: 'Pickup', condition: 'excellent', city: 'Davao City', sellerType: 'dealer',
    photos: [{ url: W('5/58/Ford_Ranger_Wildtrak_%28T6%2C_P375%29_1X7A6170.jpg') }],
    inspectionRequests: [{ status: 'completed' }], dealer: { isVerified: true },
  },
  {
    id: 'mock-6',
    year: 2020, make: 'Nissan', model: 'Navara', variant: 'VL 4x4 AT',
    price: 1295000, mileage: 52000, transmission: 'automatic', fuelType: 'diesel',
    bodyType: 'Pickup', condition: 'good', city: 'Cagayan de Oro', sellerType: 'private',
    photos: [{ url: W('a/a7/2017_Nissan_Navara_Tekna_DCi_2.3_Front.jpg') }],
    inspectionRequests: [], dealer: null,
  },
  {
    id: 'mock-7',
    year: 2022, make: 'Suzuki', model: 'Ertiga', variant: '1.5 GL AT',
    price: 845000, mileage: 18900, transmission: 'automatic', fuelType: 'gasoline',
    bodyType: 'MPV', condition: 'excellent', city: 'Manila', sellerType: 'dealer',
    photos: [{ url: W('e/e7/2018_Suzuki_Ertiga_GL%2C_Royal_Plaza%2C_South_Surabaya.jpg') }],
    inspectionRequests: [{ status: 'completed' }], dealer: { isVerified: true },
  },
  {
    id: 'mock-8',
    year: 2019, make: 'Hyundai', model: 'Starex', variant: 'GL TCI 2.5 MT',
    price: 1150000, mileage: 71000, transmission: 'manual', fuelType: 'diesel',
    bodyType: 'Van', condition: 'good', city: 'Taguig', sellerType: 'private',
    photos: [{ url: W('0/09/00_hyundai_starex_van_1_%28cropped%29.jpg') }],
    inspectionRequests: [], dealer: null,
  },
  // Brand new units
  {
    id: 'mock-new-1',
    year: 2025, make: 'Toyota', model: 'Fortuner', variant: 'GR Sport 4x4 AT Diesel',
    price: 2590000, mileage: 0, transmission: 'automatic', fuelType: 'diesel',
    bodyType: 'SUV', condition: 'brand_new', city: 'Makati', sellerType: 'dealer',
    photos: [{ url: W('d/d5/2022_Toyota_Fortuner_2.8_VRZ_GR_Sport_4x2_GUN166R_%2820220428%29.jpg') }],
    inspectionRequests: [], dealer: { isVerified: true },
  },
  {
    id: 'mock-new-2',
    year: 2025, make: 'Mitsubishi', model: 'Outlander', variant: 'PHEV Ultimate 4WD CVT',
    price: 3190000, mileage: 0, transmission: 'cvt', fuelType: 'hybrid',
    bodyType: 'SUV', condition: 'brand_new', city: 'Quezon City', sellerType: 'dealer',
    photos: [{ url: W('7/7b/2021_Mitsubishi_Montero_Sport_Limited_%28cropped%29.jpg') }],
    inspectionRequests: [], dealer: { isVerified: true },
  },
  {
    id: 'mock-new-3',
    year: 2025, make: 'Honda', model: 'Civic', variant: 'RS Turbo CVT',
    price: 1438000, mileage: 0, transmission: 'cvt', fuelType: 'gasoline',
    bodyType: 'Sedan', condition: 'brand_new', city: 'Pasig', sellerType: 'dealer',
    photos: [{ url: W('c/c6/2019_Honda_City_RS.jpg') }],
    inspectionRequests: [], dealer: { isVerified: true },
  },
  {
    id: 'mock-new-4',
    year: 2025, make: 'Ford', model: 'Ranger', variant: 'Raptor V6 4x4 AT',
    price: 2399000, mileage: 0, transmission: 'automatic', fuelType: 'gasoline',
    bodyType: 'Pickup', condition: 'brand_new', city: 'Cebu City', sellerType: 'dealer',
    photos: [{ url: W('5/58/Ford_Ranger_Wildtrak_%28T6%2C_P375%29_1X7A6170.jpg') }],
    inspectionRequests: [], dealer: { isVerified: true },
  },
];

// Rough monthly estimate at 20% down, 60 months, ~7.5% effective.
// Result kept simple/illustrative — not a real loan quote.
export const estimateMonthly = (price) => {
  const principal = price * 0.8;
  const monthlyRate = 0.075 / 12;
  const n = 60;
  const m = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  return Math.round(m / 100) * 100;
};

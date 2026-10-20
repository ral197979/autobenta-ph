// Seeds a few original starter articles for the News & Reviews section.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ARTICLES = [
  {
    slug: 'how-to-spot-a-flooded-car',
    title: 'How to Spot a Flooded Car Before You Buy',
    category: 'Guide',
    authorName: 'Ryderr Team',
    excerpt: 'Five quick checks that reveal water damage a fresh detail job can hide.',
    body: `Flood-damaged units resurface every rainy season, often cleaned up and re-listed far from where they were submerged. A careful 10-minute inspection protects you.

Check under the carpets and spare-tyre well for silt, rust, or a musty smell. Damp padding long after dry weather is a red flag.

Look at the seatbelts — pull each one all the way out and check the lower webbing for water lines or staining.

Inspect electrical connectors and fuse boxes for corrosion, and test every electronic feature: windows, lights, infotainment, and sensors.

Smell the cabin. A strong air-freshener masking a damp odour deserves suspicion.

When in doubt, request a Ryderr Certified inspection. Our 180-point check specifically flags flood and water-intrusion indicators.`,
  },
  {
    slug: 'gas-vs-diesel-vs-hybrid-philippines',
    title: 'Gas vs Diesel vs Hybrid: Which Fits Your Drive?',
    category: 'Guide',
    authorName: 'Ryderr Team',
    excerpt: 'A practical guide to picking the right powertrain for Philippine roads and budgets.',
    body: `The cheapest car to buy isn't always the cheapest to own. Match the powertrain to how you actually drive.

Gasoline engines are affordable up front and smooth in the city, but use more fuel on long hauls. Great for light, mostly-urban use.

Diesel shines on highways and with heavy loads — better torque and economy over distance — at a higher purchase price and noisier idle. Ideal for provincial trips and big SUVs.

Hybrids and e-POWER drivetrains sip fuel in stop-and-go traffic and run quietly, with a price premium that pays back fastest for high-mileage city drivers.

Estimate your monthly kilometres and fuel spend before deciding — and use the Ryderr financing calculator to compare true monthly cost.`,
  },
  {
    slug: 'ev-ownership-philippines-2025',
    title: 'Is an EV Practical in the Philippines Yet?',
    category: 'Feature',
    authorName: 'Ryderr Team',
    excerpt: 'Charging, range, and incentives — what EV ownership really looks like today.',
    body: `Electric vehicles have gone from novelty to a genuine option, but the right fit depends on your charging situation.

Home charging is the make-or-break factor. If you can install a wall box and have a predictable daily route, an EV is cheap and convenient to run.

Public fast-charging is expanding quickly along major routes and in malls, though coverage is still thinner outside the metro.

Modern EVs comfortably cover typical daily distances on a charge, and lower running and maintenance costs offset the higher sticker price over time.

Browse the Electric & Hybrid models in our New Cars catalog to compare range and pricing side by side.`,
  },
  {
    slug: 'used-car-paperwork-checklist',
    title: 'The Used-Car Paperwork Checklist Every Buyer Needs',
    category: 'Guide',
    authorName: 'Ryderr Team',
    excerpt: 'Don’t hand over a peso until these documents check out.',
    body: `A great price means nothing if the paperwork isn't clean. Verify these before closing.

Confirm the Original Receipt (OR) and Certificate of Registration (CR) match the unit and the seller's name.

Check that the engine and chassis numbers on the documents match the vehicle.

Ask for the deed of sale and valid IDs, and make sure registration is current and free of unpaid dues.

Run the ownership-transfer checklist on Ryderr so you know the LTO steps, fees, and timeline before you pay.`,
  },
];

async function main() {
  for (const a of ARTICLES) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: { ...a, published: true, publishedAt: new Date() },
      create: { ...a, published: true, publishedAt: new Date() },
    });
  }
  console.log(`Seeded ${await prisma.article.count()} articles.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

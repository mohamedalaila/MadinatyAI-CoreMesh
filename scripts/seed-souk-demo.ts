/**
 * seed-souk-demo.ts
 *
 * Seeds Souk ElKanto with realistic demo data including:
 * - 10 fake sellers (Egyptian phone numbers)
 * - 30 listings across all categories with Picsum photos
 * - 15 offers (pending, accepted, declined, countered)
 * - 25 favorites
 * - 5 completed handovers with ratings
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-souk-demo.ts
 *
 * Idempotent: safe to run multiple times. Skips phones already present.
 */

import { PrismaClient, SoukCategory, SoukCondition, SoukListingStatus, SoukOfferStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────── Config ───────────────
const SELLER_COUNT = 10;
const LISTINGS_PER_SELLER = 3;
const OFFER_COUNT = 15;
const FAVORITE_COUNT = 25;
const HANDOVER_COUNT = 5;

// Deterministic fake data so re-runs feel consistent
const FIRST_NAMES = [
  'Ahmed', 'Mohamed', 'Omar', 'Youssef', 'Karim',
  'Mona', 'Sara', 'Nada', 'Aya', 'Laila',
  'Hassan', 'Tarek', 'Amr', 'Khaled', 'Mostafa',
];

const ARABIC_TITLES: Record<SoukCategory, string[]> = {
  FURNITURE: ['كنبة جلد ثلاثية', 'مكتبة خشب زان', 'طقم سفرة 6 كراسي', 'سرير نوم مزدوج', 'كرسي rocking قديم'],
  ELECTRONICS: ['آيفون 14 برو 256ج', 'سماعات Sony WH-1000XM5', 'شاشة Samsung 27 بوصة', 'لابتوب Dell i7', 'ماوس gaming لوجيتك'],
  APPLIANCES: ['غسالة LG 7 كيلو', 'ثلاجة توشيبا 16 قدم', 'ميكروويف سامسونج', 'مكنسة Kirby', 'دفاية زيت 11 ريشة'],
  FASHION: ['فستان سهرة أسود', 'جاكيت جلد طبيعي', 'حذاء رياضي Nike 43', 'شنطة يد MK أصلية', 'طقم ملابس رياضي'],
  KIDS_TOYS: ['مجموعة LEGO City', 'سيارة remote control', 'دمى Barbie سيت', 'لوحة سبورة ذكية', 'دراجة أطفال مقاس 12'],
  KIDS_CLOTHING: ['بدلة أطفال 3-6 شهور', 'فستان بناتي عيد 4-5 سنين', 'جاكيت أولادي شتوي', 'طقم بيجاما قطن 5 قطع', 'تيشيرتات أطفال 3 قطع'],
  KIDS_GEAR: ['عربة أطفال Graco', 'كرسي سيارة Maxi-Cosi', 'سرير أطفال محمول', 'حمالة أطفال BabyBjorn', 'بايب وسطام'],
  BOOKS_MEDIA: ['مجموعة هاري بوتر 7 كتب', 'PS5 مع 2 يد', 'آيباد Air 5', 'مجموعة أفلام 4K', 'كورسات Udemy ممتازة'],
  SPORTS_OUTDOOR: ['دراجة هوائية Trek', 'أوزان dumbbell سيت', 'مضرب تنس Wilson', 'طقم camping كامل', 'سكوتر كهربائي Xiaomi'],
  HOME_DECOR: ['لوحة فنية كبيرة', 'مرآة حائط فضية', 'سجادة Persian 2x3 م', 'ستاند نباتات معدني', 'إضاءة LED سقف'],
  KITCHEN_DINING: ['طقم أواني جرانيت 15pc', 'ماكينة قهوة DeLonghi', 'محضر طعام Kenwood', 'طقم كاسات كريستال', 'فرن كهرباء 60 لتر'],
  BABY_MATERNITY: ['سرير أطفال خشب بلوط', 'مضخة حليب Medela', 'كرسي هزاز 4moms', 'طقم ملابس مواليد 10pc', 'بطانية صوف طبيعي'],
  MOBILE_TABLETS: ['آيفون 13 عادي 128ج', 'جالاكسي S23 الترا', 'آيباد برو 11 M2', 'شاومي 13T برو', 'هواوي P60 برو'],
  VINTAGE_COLLECTIBLES: ['عملات مصرية قديمة 1950', 'تمثال خزف صيني', 'ساعة جيب أنتيك', 'طابع بريد نادر 1867', 'راديو قديم Zenith 1960'],
  MOVING_BUNDLE: ['طقم غرفة نوم كامل', 'أثاث شقة صغيرة bundle', 'أجهزة مطبخ كاملة', 'package moving bundle', 'أثاث مكتب كامل bundle'],
  OTHER: ['صندوق أدوات كامل', 'خيمة 4 أشخاص', 'آلة خياطة سنجر', 'طابعة 3D Creality', 'كاميرا مراقبة Arlo'],
};

const ARABIC_DESCRIPTIONS = [
  'استخدام خفيف جداً، بحالة ممتازة تقريباً زي الجديد.',
  'استخدام سنة واحدة فقط، محافظ عليه تماماً.',
  'سبب البيع: مغادرة مصر. مستعجل على السعر.',
  'اشتريته جديد من B-Tech، مع الفاتورة الأصلية.',
  'في حالة جيدة، فيه خدوش بسيطة بس شغال 100%.',
  'معاه كل الأكسسوارات الأصلية والكرتونة.',
  'ممكن التفاوض في السعر لكن بشكل معقول.',
  'متوفر للتسليم في أي وقت في مدينتي.',
  'السعر غير قابل للتفاوض — سعر السوق بالضبط.',
  'اشتريته قبل شهرين، محتاج فلوس بسرعة.',
];

const CONDITIONS: SoukCondition[] = ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR', 'FOR_PARTS'];
const DISTRICTS = ['B5', 'C1', 'GATE', 'MALL', 'CLUB', 'WEST', 'PARK', 'LAKE', 'SPORTS', 'CRAFT'];
const PRICES = [800, 1200, 1800, 2500, 3200, 4500, 6000, 8500, 12000, 18000, 25000];

// Picsum seed deterministically derived from listing index for stable images
function photoUrl(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

async function ensureSellers(): Promise<{ id: string; phone: string; name: string }[]> {
  const sellers: { id: string; phone: string; name: string }[] = [];

  for (let i = 0; i < SELLER_COUNT; i++) {
    const phone = `+201012345${String(i).padStart(3, '0')}`;
    const name = FIRST_NAMES[i % FIRST_NAMES.length];

    const existing = await prisma.globalUser.findUnique({ where: { phoneNumber: phone } });
    if (existing) {
      sellers.push({ id: existing.id, phone, name });
      continue;
    }

    const user = await prisma.globalUser.create({
      data: {
        phoneNumber: phone,
        isVerified: true,
        metadata: { displayName: name },
        trustScore: 50 + Math.floor(Math.random() * 50), // 50-100
      },
    });
    sellers.push({ id: user.id, phone, name });
  }

  return sellers;
}

async function seedListings(sellers: { id: string }[]): Promise<{ id: string; sellerId: string }[]> {
  const listings: { id: string; sellerId: string }[] = [];
  const categories = Object.keys(ARABIC_TITLES) as SoukCategory[];

  for (const seller of sellers) {
    for (let j = 0; j < LISTINGS_PER_SELLER; j++) {
      const cat = categories[(sellers.indexOf(seller) * LISTINGS_PER_SELLER + j) % categories.length];
      const titlePool = ARABIC_TITLES[cat];
      const title = titlePool[j % titlePool.length];
      const description = `${ARABIC_DESCRIPTIONS[j % ARABIC_DESCRIPTIONS.length]} ${title} — السعر قابل للتفاوض.`;
      const condition = CONDITIONS[j % CONDITIONS.length];
      const price = PRICES[j % PRICES.length];
      const district = DISTRICTS[j % DISTRICTS.length];
      const status: SoukListingStatus = j % 10 === 0 ? 'RESERVED' : j % 7 === 0 ? 'SOLD' : 'ACTIVE';

      const listing = await prisma.soukListing.create({
        data: {
          sellerId: seller.id,
          title,
          description,
          category: cat,
          condition,
          askingPrice: price,
          currency: 'EGP',
          district,
          status,
          viewCount: Math.floor(Math.random() * 100),
          favoriteCount: 0,
        },
      });

      // Seed 1–3 photos per listing using deterministic Picsum URLs
      const photoCount = 1 + (j % 3);
      for (let p = 0; p < photoCount; p++) {
        const seed = `kanto-${listing.id}-${p}`;
        await prisma.soukListingPhoto.create({
          data: {
            listingId: listing.id,
            r2Key: `demo/${listing.id}/${p}.jpg`,
            url: photoUrl(seed, 640, 480),
            width: 640,
            height: 480,
            bytes: 45000 + Math.floor(Math.random() * 20000),
            position: p,
          },
        });
      }

      listings.push({ id: listing.id, sellerId: seller.id });
    }
  }

  return listings;
}

async function seedOffers(
  listings: { id: string; sellerId: string }[],
  sellers: { id: string }[],
): Promise<{ id: string; listingId: string; buyerId: string; sellerId: string; status: SoukOfferStatus }[]> {
  const offers: { id: string; listingId: string; buyerId: string; sellerId: string; status: SoukOfferStatus }[] = [];

  for (let i = 0; i < OFFER_COUNT; i++) {
    const listing = listings[i % listings.length];
    // Pick a buyer who is NOT the seller
    const otherSellers = sellers.filter((s) => s.id !== listing.sellerId);
    if (otherSellers.length === 0) continue;
    const buyer = otherSellers[i % otherSellers.length];

    const statuses: SoukOfferStatus[] = ['PENDING', 'ACCEPTED', 'DECLINED', 'COUNTERED', 'WITHDRAWN'];
    const status = statuses[i % statuses.length];
    const amount = Math.max(500, Math.floor(listing.sellerId ? 2500 : 1000) + Math.floor(Math.random() * 2000));

    const offer = await prisma.soukOffer.create({
      data: {
        listingId: listing.id,
        buyerId: buyer.id,
        sellerId: listing.sellerId,
        amount,
        note: `عرض تلقائي #${i + 1}`,
        status,
        ...(status === 'ACCEPTED' ? { acceptedAt: new Date() } : {}),
        ...(status === 'DECLINED' ? { declinedAt: new Date() } : {}),
        ...(status === 'WITHDRAWN' ? { withdrawnAt: new Date() } : {}),
      },
    });

    // Update listing status for accepted offers
    if (status === 'ACCEPTED') {
      await prisma.soukListing.update({
        where: { id: listing.id },
        data: { status: 'RESERVED' },
      });
    }

    offers.push({ id: offer.id, listingId: listing.id, buyerId: buyer.id, sellerId: listing.sellerId, status });
  }

  return offers;
}

async function seedFavorites(listings: { id: string; sellerId: string }[], sellers: { id: string }[]) {
  let count = 0;
  for (let i = 0; i < FAVORITE_COUNT; i++) {
    const listing = listings[i % listings.length];
    const buyer = sellers[(i + 1) % sellers.length]; // offset so not same as seller
    if (buyer.id === listing.sellerId) continue;

    try {
      await prisma.soukFavorite.create({
        data: { userId: buyer.id, listingId: listing.id },
      });
      count++;
    } catch {
      // unique constraint violation — already favorited, skip
    }
  }

  // Sync favoriteCount on listings
  const counts = await prisma.soukFavorite.groupBy({
    by: ['listingId'],
    _count: { listingId: true },
  });
  for (const c of counts) {
    await prisma.soukListing.update({
      where: { id: c.listingId },
      data: { favoriteCount: c._count.listingId },
    });
  }

  return count;
}

async function seedHandoversAndRatings(
  offers: { id: string; status: SoukOfferStatus; listingId: string; buyerId: string; sellerId: string }[],
) {
  const accepted = offers.filter((o) => o.status === 'ACCEPTED');
  let count = 0;

  for (let i = 0; i < Math.min(HANDOVER_COUNT, accepted.length); i++) {
    const offer = accepted[i];

    // Create handover
    const handover = await prisma.soukHandover.create({
      data: {
        offerId: offer.id,
        buyerConfirmedAt: new Date(),
        sellerConfirmedAt: new Date(),
        bothConfirmedAt: new Date(),
        ratingWindowEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Mark offer as CONFIRMED and listing as SOLD
    await prisma.soukOffer.update({
      where: { id: offer.id },
      data: { status: 'CONFIRMED' },
    });
    await prisma.soukListing.update({
      where: { id: offer.listingId },
      data: { status: 'SOLD' },
    });

    // Add ratings from both sides
    const score = 3 + (i % 3); // 3, 4, or 5
    const severityMap: Record<number, number> = { 5: 0, 4: 0, 3: 1, 2: 3, 1: 5 };
    const mappedSeverity = severityMap[score] ?? 0;

    await prisma.soukRating.create({
      data: {
        offerId: offer.id,
        raterId: offer.buyerId,
        targetId: offer.sellerId,
        score,
        comment: 'تعامل ممتاز، البائع صريح ومحترم.',
        mappedSeverity,
      },
    });

    await prisma.soukRating.create({
      data: {
        offerId: offer.id,
        raterId: offer.sellerId,
        targetId: offer.buyerId,
        score: 5,
        comment: 'الدفع كان سريع والتسليم سهل.',
        mappedSeverity: 0,
      },
    });

    count++;
  }

  return count;
}

async function main(): Promise<void> {
  console.log('[seed-souk-demo] Starting…');

  // 1. Sellers
  console.log(`[seed-souk-demo] Creating ${SELLER_COUNT} sellers…`);
  const sellers = await ensureSellers();
  console.log(`[seed-souk-demo] ${sellers.length} sellers ready.`);

  // 2. Listings + photos
  console.log(`[seed-souk-demo] Seeding ${SELLER_COUNT * LISTINGS_PER_SELLER} listings with photos…`);
  const listings = await seedListings(sellers);
  console.log(`[seed-souk-demo] ${listings.length} listings + photos seeded.`);

  // 3. Offers
  console.log(`[seed-souk-demo] Seeding ${OFFER_COUNT} offers…`);
  const offers = await seedOffers(listings, sellers);
  console.log(`[seed-souk-demo] ${offers.length} offers seeded.`);

  // 4. Favorites
  console.log(`[seed-souk-demo] Seeding ~${FAVORITE_COUNT} favorites…`);
  const favCount = await seedFavorites(listings, sellers);
  console.log(`[seed-souk-demo] ${favCount} favorites seeded.`);

  // 5. Handovers + ratings
  console.log(`[seed-souk-demo] Seeding up to ${HANDOVER_COUNT} completed handovers with ratings…`);
  const handoverCount = await seedHandoversAndRatings(offers);
  console.log(`[seed-souk-demo] ${handoverCount} handovers + ${handoverCount * 2} ratings seeded.`);

  // Summary
  const [listingTotal, offerTotal, favTotal, ratingTotal] = await Promise.all([
    prisma.soukListing.count(),
    prisma.soukOffer.count(),
    prisma.soukFavorite.count(),
    prisma.soukRating.count(),
  ]);

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  Souk ElKanto Demo Data Summary');
  console.log('═══════════════════════════════════════════');
  console.log(`  Sellers      : ${sellers.length}`);
  console.log(`  Listings     : ${listingTotal}`);
  console.log(`  Photos       : ${await prisma.soukListingPhoto.count()}`);
  console.log(`  Offers       : ${offerTotal}`);
  console.log(`  Favorites    : ${favTotal}`);
  console.log(`  Handovers    : ${await prisma.soukHandover.count()}`);
  console.log(`  Ratings      : ${ratingTotal}`);
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e: Error) => {
    console.error('[seed-souk-demo] Fatal error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

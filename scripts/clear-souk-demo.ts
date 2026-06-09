/**
 * clear-souk-demo.ts
 *
 * Wipes all Souk ElKanto demo data before production launch.
 *
 * Deletes in dependency-safe order:
 *   ratings → handovers → offers → favorites → listing_photos → listings → safe_meet_spots
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/clear-souk-demo.ts --dry-run
 *   npx ts-node -r tsconfig-paths/register scripts/clear-souk-demo.ts --force
 *
 * Flags:
 *   --dry-run   Show counts, do NOT delete
 *   --force     Skip confirmation prompt (for CI / automation)
 *   --users     Also delete GlobalUser records created by the seed script
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface Counts {
  ratings: number;
  handovers: number;
  offers: number;
  favorites: number;
  photos: number;
  listings: number;
  safeMeetSpots: number;
  users: number;
}

async function getCounts(): Promise<Counts> {
  const [
    ratings,
    handovers,
    offers,
    favorites,
    photos,
    listings,
    safeMeetSpots,
    users,
  ] = await Promise.all([
    prisma.soukRating.count(),
    prisma.soukHandover.count(),
    prisma.soukOffer.count(),
    prisma.soukFavorite.count(),
    prisma.soukListingPhoto.count(),
    prisma.soukListing.count(),
    prisma.soukSafeMeetSpot.count(),
    prisma.globalUser.count(),
  ]);
  return { ratings, handovers, offers, favorites, photos, listings, safeMeetSpots, users };
}

function printCounts(counts: Counts): void {
  console.log('  ratings        :', counts.ratings);
  console.log('  handovers      :', counts.handovers);
  console.log('  offers         :', counts.offers);
  console.log('  favorites      :', counts.favorites);
  console.log('  listing photos :', counts.photos);
  console.log('  listings       :', counts.listings);
  console.log('  safeMeetSpots  :', counts.safeMeetSpots);
  console.log('  users          :', counts.users);
}

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const alsoUsers = args.includes('--users');

  console.log('[clear-souk-demo] Scanning database…\n');
  const before = await getCounts();

  const hasData = Object.values(before).some((n) => n > 0);
  if (!hasData) {
    console.log('✓ Souk ElKanto schema is already empty. Nothing to do.');
    return;
  }

  console.log('Current record counts:');
  printCounts(before);
  console.log('');

  if (dryRun) {
    console.log('[--dry-run] No records were deleted.');
    console.log('Run again without --dry-run to execute deletion.');
    return;
  }

  if (!force) {
    const answer: string = await askQuestion(
      '⚠️  Type "DELETE" to permanently remove all Souk ElKanto data: ',
    );
    if (answer !== 'delete') {
      console.log('Aborted. No records were deleted.');
      return;
    }
  }

  console.log('[clear-souk-demo] Deleting in dependency order…\n');

  // 1. Ratings (depend on offers)
  const ratingsDeleted = await prisma.soukRating.deleteMany({});
  console.log(`  ✓ ratings        deleted: ${ratingsDeleted.count}`);

  // 2. Handovers (depend on offers)
  const handoversDeleted = await prisma.soukHandover.deleteMany({});
  console.log(`  ✓ handovers      deleted: ${handoversDeleted.count}`);

  // 3. Offers (depend on listings)
  const offersDeleted = await prisma.soukOffer.deleteMany({});
  console.log(`  ✓ offers         deleted: ${offersDeleted.count}`);

  // 4. Favorites (depend on listings)
  const favoritesDeleted = await prisma.soukFavorite.deleteMany({});
  console.log(`  ✓ favorites      deleted: ${favoritesDeleted.count}`);

  // 5. Listing photos (depend on listings)
  const photosDeleted = await prisma.soukListingPhoto.deleteMany({});
  console.log(`  ✓ listing photos deleted: ${photosDeleted.count}`);

  // 6. Listings
  const listingsDeleted = await prisma.soukListing.deleteMany({});
  console.log(`  ✓ listings       deleted: ${listingsDeleted.count}`);

  // 7. Safe meet spots
  const spotsDeleted = await prisma.soukSafeMeetSpot.deleteMany({});
  console.log(`  ✓ safeMeetSpots  deleted: ${spotsDeleted.count}`);

  // 8. Users (optional — only if --users flag passed)
  if (alsoUsers) {
    const usersDeleted = await prisma.globalUser.deleteMany({});
    console.log(`  ✓ users          deleted: ${usersDeleted.count}`);
  }

  console.log('\n[clear-souk-demo] Done. Post-deletion counts:');
  const after = await getCounts();
  printCounts(after);

  if (Object.values(after).every((n) => n === 0)) {
    console.log('\n✓ Souk ElKanto schema is now empty and ready for production.');
  } else {
    console.log('\n⚠ Some tables still have records (possibly from other tenants or manual inserts).');
  }
}

main()
  .catch((e: Error) => {
    console.error('[clear-souk-demo] Fatal error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

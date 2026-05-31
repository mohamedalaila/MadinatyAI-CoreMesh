import { PrismaClient, TenantTier } from '@prisma/client';

/**
 * Seeds the core schema with the four ecosystem tenants and a sample user.
 * Idempotent: safe to run repeatedly.
 */
const prisma = new PrismaClient();

const TENANTS = [
  { subdomain: 'souq', schemaName: 'tenant_souq', tierLevel: TenantTier.STANDARD },
  { subdomain: 'kitchen', schemaName: 'tenant_kitchen', tierLevel: TenantTier.STANDARD },
  { subdomain: 'tutor', schemaName: 'tenant_tutor', tierLevel: TenantTier.FREE },
  { subdomain: 'timebank', schemaName: 'tenant_timebank', tierLevel: TenantTier.FREE },
];

async function main(): Promise<void> {
  for (const t of TENANTS) {
    await prisma.tenant.upsert({
      where: { subdomain: t.subdomain },
      update: { schemaName: t.schemaName, tierLevel: t.tierLevel, isActive: true },
      create: t,
    });
  }

  await prisma.globalUser.upsert({
    where: { phoneNumber: '+201000000000' },
    update: {},
    create: {
      phoneNumber: '+201000000000',
      isVerified: true,
      // Raw payment handle stored as opaque metadata (Transparent Broker).
      metadata: { instapayHandle: 'demo@instapay', vodafoneCash: '01000000000' },
    },
  });

  // ── Sample Kitchen businesses ──
  const sampleUser = await prisma.globalUser.findUnique({
    where: { phoneNumber: '+201000000000' },
  });

  if (sampleUser) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_kitchen."KitchenBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, "cuisineType", address, phone, "openingHours", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'ali-kitchen', 'Ali Kitchen', true,
         '{"primaryColor":"#FF6B35","secondaryColor":"#004E89","fontFamily":"Cairo","logoUrl":"/storage/kitchen/ali/logo.png"}'::jsonb,
         'Authentic Egyptian home-cooked meals', 'Egyptian', 'Cairo, Madinaty', '01000000001',
         '{"mon":"9-22","tue":"9-22","wed":"9-22","thu":"9-22","fri":"10-23","sat":"10-23","sun":"closed"}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_kitchen."KitchenBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, "cuisineType", address, phone, "openingHours", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'sara-sushi', 'Sara Sushi', true,
         '{"primaryColor":"#1B4332","secondaryColor":"#D4A373","fontFamily":"Noto Sans","logoUrl":"/storage/kitchen/sara/logo.png"}'::jsonb,
         'Fresh Asian fusion cuisine', 'Asian', 'Cairo, Madinaty', '01000000002',
         '{"mon":"11-23","tue":"11-23","wed":"11-23","thu":"11-23","fri":"12-00","sat":"12-00","sun":"closed"}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    // ── Sample Tutor businesses ──
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_tutor."TutorBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, subjects, qualifications, "hourlyRate", address, phone, availability, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'ahmed-math', 'Ahmed Math Academy', true,
         '{"primaryColor":"#2196F3","secondaryColor":"#FFC107","fontFamily":"Cairo","logoUrl":"/storage/tutor/ahmed/logo.png"}'::jsonb,
         'Expert math tutoring for all levels', ARRAY['Math','Calculus','Statistics'], 'PhD Mathematics - Cairo University', 150.0,
         'Cairo, Madinaty', '01000000003',
         '{"mon":["9-12","14-18"],"tue":["9-12"],"wed":["9-12","14-18"],"thu":["14-18"],"fri":[],"sat":["10-14"],"sun":[]}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO tenant_tutor."TutorBusiness"
        (id, "ownerGlobalUserId", slug, name, "isActive", branding, description, subjects, qualifications, "hourlyRate", address, phone, availability, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), '${sampleUser.id}', 'nora-arabic', 'Nora Arabic Center', true,
         '{"primaryColor":"#4CAF50","secondaryColor":"#FF5722","fontFamily":"Amiri","logoUrl":"/storage/tutor/nora/logo.png"}'::jsonb,
         'Arabic language and Quran tutoring', ARRAY['Arabic','Quran','Grammar'], 'MA Arabic Literature - Al-Azhar', 120.0,
         'Cairo, Madinaty', '01000000004',
         '{"mon":["10-14"],"tue":["10-14"],"wed":["10-14"],"thu":["10-14"],"fri":[],"sat":["10-12"],"sun":[]}'::jsonb,
         NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${TENANTS.length} tenants + 1 sample user + 2 kitchen businesses + 2 tutor businesses.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

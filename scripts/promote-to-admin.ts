#!/usr/bin/env tsx
/**
 * CLI: promote a user to PLATFORM_ADMIN by phone number.
 *
 * Usage:
 *   npx tsx scripts/promote-to-admin.ts +201234567890
 *   npx tsx scripts/promote-to-admin.ts 01234567890
 *
 * This is a project-owner operation. The promoted user gains access to
 * /admin dashboard and all PLATFORM_ADMIN-gated endpoints.
 */

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.error('Usage: npx tsx scripts/promote-to-admin.ts <phoneNumber>');
    console.error('Example: npx tsx scripts/promote-to-admin.ts +201234567890');
    process.exit(1);
  }

  // Normalize to +20 format
  const normalized = phone.startsWith('+20')
    ? phone
    : phone.startsWith('0')
      ? '+20' + phone.slice(1)
      : '+20' + phone;

  const user = await prisma.globalUser.findUnique({
    where: { phoneNumber: normalized },
    select: { id: true, phoneNumber: true, role: true },
  });

  if (!user) {
    console.error(`User not found: ${normalized}`);
    process.exit(1);
  }

  if (user.role === Role.PLATFORM_ADMIN) {
    console.log(`User ${normalized} is already PLATFORM_ADMIN.`);
    process.exit(0);
  }

  await prisma.globalUser.update({
    where: { id: user.id },
    data: { role: Role.PLATFORM_ADMIN },
  });

  console.log(`✅ Promoted ${normalized} to PLATFORM_ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

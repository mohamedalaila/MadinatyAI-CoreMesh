import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.expressCourier.updateMany({
    where: { phone: '01000000000' },
    data: {
      status: 'PENDING',
      isOnline: false,
      nationalIdPhoto: null,
      personalPhoto: null,
    },
  });
  console.log('RESET RESULT:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());

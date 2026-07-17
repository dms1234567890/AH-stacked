const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['error'] });

async function checkDatabase() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection succeeded.');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch((error) => {
  const code = error && typeof error === 'object'
    ? error.code || error.errorCode
    : undefined;
  const suffix = code ? ` (${code})` : '';
  console.error(`Database connection failed${suffix}. Check DATABASE_URL and database availability.`);
  process.exitCode = 1;
});

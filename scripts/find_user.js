const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const user = await p.user.findFirst();
  console.log('User:', user);
  await p.$disconnect();
}

main().catch(console.error);

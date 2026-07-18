const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const studentsCount = await prisma.student.count();
  const batchesCount = await prisma.batch.count();
  const teachersCount = await prisma.teacher.count();
  const subjectsCount = await prisma.subject.count();
  const headAssignmentsCount = await prisma.headAssignment.count();
  
  console.log('PostgreSQL database status:');
  console.log('Students count:', studentsCount);
  console.log('Batches count:', batchesCount);
  console.log('Teachers count:', teachersCount);
  console.log('Subjects count:', subjectsCount);
  console.log('Head assignments count:', headAssignmentsCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

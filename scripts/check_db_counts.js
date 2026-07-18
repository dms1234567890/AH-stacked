const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const sc = await p.student.count();
  const ac = await p.student.count({ where: { status: 'ACTIVE', deletedAt: null } });
  const bc = await p.batch.count({ where: { deletedAt: null, isActive: true } });
  const adm = await p.admission.count({ where: { deletedAt: null } });
  console.log({ totalStudents: sc, activeStudents: ac, batches: bc, admissions: adm });
  
  const samp = await p.student.findFirst({
    select: { id: true, studentId: true, studentName: true, status: true, batchId: true }
  });
  console.log('Sample student:', samp);
  
  const sampBatch = await p.batch.findFirst({
    select: { id: true, name: true, isActive: true, deletedAt: true }
  });
  console.log('Sample batch:', sampBatch);
  
  await p.$disconnect();
}

main().catch(console.error);

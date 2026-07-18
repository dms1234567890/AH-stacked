const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../apps/backend/dist/app.module');
const { StudentsService } = require('../apps/backend/dist/students/students.service');
const { AdmissionsService } = require('../apps/backend/dist/students/admissions.service');
const { BatchesService } = require('../apps/backend/dist/batches/batches.service');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const studentsService = app.get(StudentsService);
  const admissionsService = app.get(AdmissionsService);
  const batchesService = app.get(BatchesService);

  console.log('\n--- Testing BatchesService.findAll() ---');
  try {
    const batches = await batchesService.findAll();
    console.log(`Success: Found ${batches.length} batches.`);
    if (batches.length > 0) {
      console.log('Sample batch:', batches[0]);
    }
  } catch (err) {
    console.error('Error in BatchesService.findAll():', err.message, err.stack);
  }

  console.log('\n--- Testing StudentsService.findAll({status: "ACTIVE", limit: 200}) ---');
  try {
    const res = await studentsService.findAll({ status: 'ACTIVE', limit: 200 });
    console.log(`Success: Found total ${res.meta.total} active students, returned array length: ${res.data.length}`);
    if (res.data.length > 0) {
      console.log('Sample student:', res.data[0]);
    }
  } catch (err) {
    console.error('Error in StudentsService.findAll():', err.message, err.stack);
  }

  console.log('\n--- Testing AdmissionsService.getNewStudents() ---');
  try {
    const newStudents = await admissionsService.getNewStudents();
    console.log(`Success: Found ${newStudents.length} new students.`);
    if (newStudents.length > 0) {
      console.log('Sample new student:', newStudents[0]);
    }
  } catch (err) {
    console.error('Error in AdmissionsService.getNewStudents():', err.message, err.stack);
  }

  await app.close();
}

main().catch(console.error);

const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Logging in as admin...');
  const loginRes = await postJson('http://localhost:3001/api/v1/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  console.log('Login Status:', loginRes.statusCode);
  const token = loginRes.data?.tokens?.accessToken;
  if (!token) {
    console.error('Could not get token:', loginRes.data);
    return;
  }
  console.log('JWT Token successfully retrieved.');

  console.log('\nFetching /api/v1/batches ...');
  const batchesRes = await getJson('http://localhost:3001/api/v1/batches', token);
  console.log('Status:', batchesRes.statusCode);
  console.log('Count:', batchesRes.data?.length);
  if (batchesRes.data?.length > 0) {
    console.log('First batch name:', batchesRes.data[0].name);
  }

  console.log('\nFetching /api/v1/students?status=ACTIVE&limit=200 ...');
  const studentsRes = await getJson('http://localhost:3001/api/v1/students?status=ACTIVE&limit=200', token);
  console.log('Status:', studentsRes.statusCode);
  console.log('Meta:', studentsRes.data?.meta);
  console.log('Data count:', studentsRes.data?.data?.length);

  console.log('\nFetching /api/v1/students/new ...');
  const newStudentsRes = await getJson('http://localhost:3001/api/v1/students/new', token);
  console.log('Status:', newStudentsRes.statusCode);
  console.log('New Students count:', newStudentsRes.data?.length);
}

main().catch(console.error);

const http = require('http');

const url = 'http://localhost:3001/students?status=ACTIVE&limit=3';

http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});

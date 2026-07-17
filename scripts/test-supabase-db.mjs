import dns from 'dns';
import { createConnection } from 'net';

console.log('Testing DNS resolution...');

dns.resolve4('db.eekxnosfptejywsncowa.supabase.co', (err, addresses) => {
  if (err) {
    console.log('IPv4 (A record):', err.message);
  } else {
    console.log('IPv4 (A record):', addresses);
    addresses.forEach(addr => testConnection(addr, 6543));
  }
});

dns.resolve6('db.eekxnosfptejywsncowa.supabase.co', (err, addresses) => {
  if (err) {
    console.log('IPv6 (AAAA record):', err.message);
  } else {
    console.log('IPv6 (AAAA record):', addresses);
  }
});

function testConnection(host, port) {
  const sock = createConnection({ host, port, timeout: 5000 });
  sock.on('connect', () => {
    console.log(`SUCCESS: Connected to ${host}:${port}`);
    sock.end();
  });
  sock.on('timeout', () => {
    console.log(`TIMEOUT: Could not connect to ${host}:${port}`);
    sock.destroy();
  });
  sock.on('error', (err) => {
    console.log(`ERROR connecting to ${host}:${port}: ${err.message}`);
  });
}
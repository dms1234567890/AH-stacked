const dns = require('dns');
dns.lookup('db.eekxnosfptejywsncowa.supabase.co', { all: true }, (err, addresses) => {
  if (err) console.log('Lookup error:', err.message);
  else console.log('All addresses:', JSON.stringify(addresses));
  process.exit(0);
});
import net from 'net';

const host = 'db.eekxnosfptejywsncowa.supabase.co';
const password = 'Happy@26005TPC';
const encodedPassword = encodeURIComponent(password);

console.log('Password encoded:', encodedPassword);

// Test TCP connection on port 6543 (pooler)
const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
  console.log('TCP connection SUCCESS on port 6543');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('TCP connection FAILED on port 6543:', err.message);
});

socket.on('timeout', () => {
  console.log('TCP connection TIMEOUT on port 6543');
  socket.destroy();
});

socket.connect(6543, host);

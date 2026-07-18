const fs = require('fs');
const content = fs.readFileSync('d:\\\\prime\\\\acedmic headd app\\\\index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('task') || line.toLowerCase().includes('rating') || line.toLowerCase().includes('button')) {
    if (line.trim().length < 150) {
      console.log(`${i+1}: ${line.trim()}`);
    }
  }
});

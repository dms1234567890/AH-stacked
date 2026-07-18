const fs = require('fs');
const content = fs.readFileSync('d:\\\\prime\\\\student full report prime\\\\index.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('id=') || line.toLowerCase().includes('class=') || line.toLowerCase().includes('button')) {
    if (line.trim().length < 150 && (line.includes('nav') || line.includes('tab') || line.includes('section') || line.includes('container') || line.includes('report') || line.includes('leaderboard'))) {
      console.log(`${i+1}: ${line.trim()}`);
    }
  }
});

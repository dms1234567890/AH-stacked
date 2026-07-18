const fs = require('fs');
const content = fs.readFileSync('d:\\\\prime\\\\student full report prime\\\\code.gs', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('SHEET_ID') || line.includes('openById') || line.includes('getSheetByName')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});

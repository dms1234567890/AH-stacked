const fs = require('fs');
const content = fs.readFileSync('d:\\\\prime\\\\student full report prime\\\\code.gs', 'utf8');
const regex = /^function\s+([a-zA-Z0-9_]+)/gm;
let match;
const functions = [];
while ((match = regex.exec(content)) !== null) {
  functions.push(match[1]);
}
console.log('Functions in student full report code.gs:', functions);

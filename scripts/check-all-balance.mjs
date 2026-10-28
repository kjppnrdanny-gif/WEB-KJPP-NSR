import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Function to check tag balance for an HTML string
function checkTagBalance(html, tagName) {
  const openRegex = new RegExp(`<${tagName}(\\s|>|/)`, 'gi');
  const closeRegex = new RegExp(`</${tagName}>`, 'gi');
  
  let opens = 0;
  let closes = 0;
  
  let m;
  while ((m = openRegex.exec(html)) !== null) {
    if (!m[0].endsWith('/>')) opens++;
  }
  while ((m = closeRegex.exec(html)) !== null) {
    closes++;
  }
  return { opens, closes, diff: opens - closes };
}

console.log('Total document div balance:', checkTagBalance(content, 'div'));
console.log('Total document form balance:', checkTagBalance(content, 'form'));
console.log('Total document main balance:', checkTagBalance(content, 'main'));
console.log('Total document section balance:', checkTagBalance(content, 'section'));

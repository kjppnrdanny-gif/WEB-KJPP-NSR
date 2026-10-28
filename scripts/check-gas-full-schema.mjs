import fs from 'fs';
const gasCode = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-absensi-Code.gs', 'utf8');

const functions = gasCode.match(/function\s+([a-zA-Z0-9_]+)\s*\(/g);
console.log('Functions in gas-absensi-Code.gs:');
console.log(functions ? functions.map(f => f.replace('function ', '').replace('(', '')) : []);

const configMatch = gasCode.match(/const\s+CONFIG\s*=\s*\{[\s\S]*?\};/);
if (configMatch) {
  console.log('\nCONFIG object in GAS:\n', configMatch[0]);
}

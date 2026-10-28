import fs from 'fs';

console.log('=== AUDITING PORTAL NOLAP ECOSYSTEM ===');

const nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');
const nolapCabangHtml = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
const gasNolap = fs.readFileSync('gas-nolap-Code.gs', 'utf8');
const phpHandler = fs.readFileSync('nolap-data-handler.php', 'utf8');

// 1. Audit Network Endpoints in portal-nolap.html
console.log('\n--- 1. NETWORK ENDPOINTS IN portal-nolap.html ---');
const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g;
let match;
while ((match = fetchRegex.exec(nolapHtml)) !== null) {
  console.log('portal-nolap fetch:', match[1]);
}

// 2. Audit Network Endpoints in portal-nolap-cabang.html
console.log('\n--- 2. NETWORK ENDPOINTS IN portal-nolap-cabang.html ---');
while ((match = fetchRegex.exec(nolapCabangHtml)) !== null) {
  console.log('portal-nolap-cabang fetch:', match[1]);
}

// 3. Check GAS Web App URLs
console.log('\n--- 3. GOOGLE APPS SCRIPT URL REFERENCES ---');
const gasRegex = /https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec/g;
const gasMatches1 = [...new Set(nolapHtml.match(gasRegex) || [])];
const gasMatches2 = [...new Set(nolapCabangHtml.match(gasRegex) || [])];
console.log('In portal-nolap.html:', gasMatches1);
console.log('In portal-nolap-cabang.html:', gasMatches2);

// 4. Audit Duplication Check Logic
console.log('\n--- 4. DUPLICATION CHECK FUNCTIONS ---');
['cekDuplikasi', 'validasiDuplikat', 'isDuplicate', 'isNomorSudahTerpakai'].forEach(fn => {
  console.log(`portal-nolap has ${fn}:`, nolapHtml.includes(fn));
  console.log(`portal-nolap-cabang has ${fn}:`, nolapCabangHtml.includes(fn));
  console.log(`gas-nolap-Code.gs has ${fn}:`, gasNolap.includes(fn));
  console.log(`nolap-data-handler.php has ${fn}:`, phpHandler.includes(fn));
});

// 5. Audit Print / Preview / Download Functions
console.log('\n--- 5. PRINT / PREVIEW / EXPORT FUNCTIONS ---');
['cetak', 'print', 'preview', 'download', 'unduh', 'export'].forEach(fn => {
  const c1 = (nolapHtml.match(new RegExp(`function\\s+[a-zA-Z0-9_]*${fn}[a-zA-Z0-9_]*`, 'gi')) || []).length;
  const c2 = (nolapCabangHtml.match(new RegExp(`function\\s+[a-zA-Z0-9_]*${fn}[a-zA-Z0-9_]*`, 'gi')) || []).length;
  console.log(`Function pattern *${fn}*: portal-nolap (${c1}), portal-nolap-cabang (${c2})`);
});

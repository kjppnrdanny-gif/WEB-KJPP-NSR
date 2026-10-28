import fs from 'fs';
const gas = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-absensi-Code.gs', 'utf8');

function showFunc(name, maxLen = 1200) {
  const p = gas.indexOf('function ' + name);
  console.log(`\n=== function ${name} ===`);
  console.log(gas.substring(p, p + maxLen));
}

showFunc('mintaOTP', 800);
showFunc('verifikasiOTP', 1200);

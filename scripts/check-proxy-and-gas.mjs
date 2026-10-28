import fs from 'fs';
import path from 'path';

const proxyFile = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/netlify/functions/absensi-data-proxy.mjs';
const content = fs.readFileSync(proxyFile, 'utf8');

const p = content.indexOf("action === 'simpanAbsensi'");
console.log('simpanAbsensi snippet:\n', content.substring(p, p + 1500));

// Check if proxy calls GAS
const hasGAS = content.includes('script.google.com');
console.log('Proxy calls GAS?', hasGAS);

const gasFile = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-absensi-Code.gs';
const gasContent = fs.readFileSync(gasFile, 'utf8');
console.log('\nGAS doGet / doPost:');
const pDoPost = gasContent.indexOf('function doPost');
console.log(gasContent.substring(pDoPost, pDoPost + 1200));

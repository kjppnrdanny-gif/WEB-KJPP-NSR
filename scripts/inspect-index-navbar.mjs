// scripts/inspect-index-navbar.mjs
import fs from 'node:fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

const navStart = html.indexOf('<nav');
const navEnd = html.indexOf('</nav>', navStart) + 6;

console.log('Nav block length:', navEnd - navStart);
console.log(html.substring(navStart, navStart + 1500));

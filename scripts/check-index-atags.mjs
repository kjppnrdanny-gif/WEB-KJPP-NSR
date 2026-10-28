import fs from 'fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

// Find all <a> tags with presensi or absen
const aTags = html.match(/<a[^>]*href=[^>]*>/gi) || [];
console.log('Total <a> tags:', aTags.length);
const matching = aTags.filter(a => /presensi|absen/i.test(a));
console.log('Matching <a> tags:', matching);

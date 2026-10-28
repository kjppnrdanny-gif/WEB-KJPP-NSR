import fs from 'fs';

const code = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/lib/opini-nsr-modal-engine.js', 'utf8');

const p = code.indexOf('function bukaModalPortal');
console.log(code.substring(p, p + 1800));

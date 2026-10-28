import fs from 'fs';

const code = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/lib/opini-nsr-modal-engine.js', 'utf8');
console.log('Size:', code.length, 'lines:', code.split('\n').length);
console.log('End snippet:\n', code.substring(code.length - 1500));

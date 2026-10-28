import fs from 'fs';

const template = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/gas-portal-absensi-template.html', 'utf8');

const p = template.indexOf('id="modal-privasi-karyawan"');
console.log('Index of modal-privasi-karyawan:', p);
if (p !== -1) {
  console.log(template.substring(p - 100, p + 2500));
}

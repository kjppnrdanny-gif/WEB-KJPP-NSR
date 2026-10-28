import fs from 'fs';

const absensi = fs.readFileSync('portal-absensi.html', 'utf8');
const presensi = fs.readFileSync('portal-presensi.html', 'utf8');

console.log('portal-absensi.html line count:', absensi.split('\n').length);
console.log('portal-presensi.html line count:', presensi.split('\n').length);

console.log('\n--- HEAD of portal-absensi.html ---');
console.log(absensi.split('\n').slice(0, 30).join('\n'));

console.log('\n--- HEAD of portal-presensi.html ---');
console.log(presensi.split('\n').slice(0, 30).join('\n'));

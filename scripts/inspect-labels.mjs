import fs from 'fs';

const c = fs.readFileSync('portal-presensi.html', 'utf8');
const m1 = c.match(/<label for="auth-nik-input"[\s\S]*?<\/label>/);
console.log('NIK Label:');
console.log(m1 ? m1[0] : 'not found');

const m2 = c.match(/<label for="auth-pin-input"[\s\S]*?<\/label>/);
console.log('\nPIN Label:');
console.log(m2 ? m2[0] : 'not found');

import crypto from 'crypto';

const salt = 'KJPP_NSR_2026_PROFESSIONAL_SIGNER_SALT::';
const hashNanang = crypto.createHash('sha256').update(salt + 'NSR-NR-2026!P').digest('hex');
const hashDeni = crypto.createHash('sha256').update(salt + 'NSR-DS-2026!P').digest('hex');

console.log('Hash Nanang:', hashNanang);
console.log('Hash Deni:', hashDeni);

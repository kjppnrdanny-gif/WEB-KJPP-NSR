import fs from 'fs';

let raw = fs.readFileSync('portal-nolap.html', 'utf8');
const isCrlf = raw.includes('\r\n');
console.log('Is CRLF:', isCrlf);

// Check needles by searching substring
console.log('Has form-pengajuan-nolap:', raw.includes('id="form-pengajuan-nolap"'));
console.log('Has seksi-smart-mitigasi-embedded:', raw.includes('id="seksi-smart-mitigasi-embedded"'));
console.log('Has sec-umum-f:', raw.includes('id="sec-umum-f"'));

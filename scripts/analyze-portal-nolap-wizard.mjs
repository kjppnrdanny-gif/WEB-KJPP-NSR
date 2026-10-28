import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (
    line.includes('form-pengajuan-nolap') ||
    line.includes('sec-umum-f') ||
    line.includes('box-sub-spm') ||
    line.includes('Beri Persetujuan Resmi') ||
    line.includes('ajukanPermohonanNoLap') ||
    line.includes('applyRBAC') ||
    line.includes('Tab 2') ||
    line.includes('smart-mitigasi') ||
    line.includes('Seksi D')
  ) {
    console.log(`${i + 1}: ${line.trim().slice(0, 100)}`);
  }
}

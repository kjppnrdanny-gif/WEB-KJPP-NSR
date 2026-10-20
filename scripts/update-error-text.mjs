import fs from 'fs';

const target = 'Token tidak valid. Pastikan memasukkan token resmi KJPP NSR (Admin Pusat, Admin Cabang, Marketing, Reviewer, atau Penilai).';
const replacement = 'Token tidak valid. Pastikan memasukkan token resmi KJPP NSR (Admin Pusat, Admin Cabang, Reviewer, Penilai, Surveyor, Marketing, atau Keuangan).';

['index.html', 'portal-penugasan-jo.html'].forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    if (c.includes(target)) {
      c = c.replaceAll(target, replacement);
      fs.writeFileSync(f, c, 'utf8');
      console.log(`✓ Updated error message in ${f}`);
    }
  }
});

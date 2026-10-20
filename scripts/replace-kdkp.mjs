import fs from 'fs';

// 1. alur-kerja-penugasan-nolap-kwitansi.html
let sop = fs.readFileSync('alur-kerja-penugasan-nolap-kwitansi.html', 'utf8');

sop = sop.replace(
  '<h4 class="font-black text-slate-900 text-xs mt-0.5 mb-2">Order, KDKP &amp; Job Order (JO)</h4>',
  '<h4 class="font-black text-slate-900 text-xs mt-0.5 mb-2">Order, Mitigasi Risiko Hukum &amp; Kepatuhan &amp; JO</h4>'
);

sop = sop.replace(
  'Registrasi order awal klien, telaah KDKP &amp; SPI 103, penawaran fee, SPK, dan pembentukan ID Penugasan resmi.',
  'Registrasi order awal klien, telaah Mitigasi Risiko Hukum &amp; Kepatuhan (SPI 103), penawaran fee, SPK, dan pembentukan ID Penugasan resmi.'
);

sop = sop.replace(
  '<h4 class="font-bold text-slate-950 text-sm">Telaah Penerimaan Penugasan &amp; Kepatuhan SPI 103 (KDKP)</h4>',
  '<h4 class="font-bold text-slate-950 text-sm">Telaah Penerimaan Penugasan: Mitigasi Risiko Hukum &amp; Kepatuhan (SPI 103)</h4>'
);

sop = sop.replace(
  '<td class="p-2.5 text-left font-medium">2. Telaah KDKP &amp; Kepatuhan SPI 103</td>',
  '<td class="p-2.5 text-left font-medium">2. Mitigasi Risiko Hukum &amp; Kepatuhan (SPI 103)</td>'
);

fs.writeFileSync('alur-kerja-penugasan-nolap-kwitansi.html', sop, 'utf8');
console.log('✓ alur-kerja-penugasan-nolap-kwitansi.html: Berhasil mengganti istilah KDKP');

// 2. panduan-operasional-portal-nolap.html
let panduan = fs.readFileSync('panduan-operasional-portal-nolap.html', 'utf8');
panduan = panduan.replace(
  'Penilaian risiko kepatuhan awal dan telaah penerimaan penugasan (KDKP).',
  'Penilaian risiko kepatuhan awal dan Mitigasi Risiko Hukum &amp; Kepatuhan (SPI 103).'
);
fs.writeFileSync('panduan-operasional-portal-nolap.html', panduan, 'utf8');
console.log('✓ panduan-operasional-portal-nolap.html: Berhasil mengganti istilah KDKP');

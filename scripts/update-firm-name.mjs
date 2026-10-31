import fs from 'fs';
import path from 'path';

// 1. daftar-token-akses-internal.html
const tokenFile = path.resolve('daftar-token-akses-internal.html');
let tokenHtml = fs.readFileSync(tokenFile, 'utf8');

tokenHtml = tokenHtml.replace(
  '<title>Direktori Rahasia Kredensial & Matriks Otorisasi 2-Lapis | KJPP Nanang Rahayu & Rekan</title>',
  '<title>Direktori Rahasia Kredensial & Matriks Otorisasi 2-Lapis | KJPP Nanang Rahayu Sigit Paryanto dan Rekan</title>'
);

tokenHtml = tokenHtml.replace(
  'Portal Nomor Laporan &amp; Penugasan Terpadu KJPP Nanang Rahayu &amp; Rekan.',
  'Portal Nomor Laporan &amp; Penugasan Terpadu KJPP Nanang Rahayu Sigit Paryanto dan Rekan.'
);

tokenHtml = tokenHtml.replace(
  '<span class="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">KJPP NANANG RAHAYU &amp; REKAN</span>',
  '<span class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</span>'
);

tokenHtml = tokenHtml.replace(
  '<p class="font-bold text-slate-400">MANAJEMEN &bull; KOMITE PENGENDALIAN MUTU &bull; KJPP NANANG RAHAYU &amp; REKAN</p>',
  '<p class="font-bold text-slate-400">MANAJEMEN &bull; KOMITE PENGENDALIAN MUTU &bull; KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</p>'
);

fs.writeFileSync(tokenFile, tokenHtml, 'utf8');
console.log('daftar-token-akses-internal.html updated!');

// 2. panduan-operasional-portal-nolap.html
const panduanFile = path.resolve('panduan-operasional-portal-nolap.html');
if (fs.existsSync(panduanFile)) {
  let panduanHtml = fs.readFileSync(panduanFile, 'utf8');

  panduanHtml = panduanHtml.replace(
    '<title>Panduan Operasional & Tutorial Lengkap Portal NoLap | KJPP Nanang Rahayu & Rekan</title>',
    '<title>Panduan Operasional & Tutorial Lengkap Portal NoLap | KJPP Nanang Rahayu Sigit Paryanto dan Rekan</title>'
  );

  panduanHtml = panduanHtml.replace(
    '<span class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">KJPP NANANG RAHAYU &amp; REKAN</span>',
    '<span class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</span>'
  );

  panduanHtml = panduanHtml.replace(
    'Sekretariat Kantor Pusat KJPP Nanang Rahayu &amp; Rekan',
    'Sekretariat Kantor Pusat KJPP Nanang Rahayu Sigit Paryanto dan Rekan'
  );

  panduanHtml = panduanHtml.replace(
    '<p class="font-bold text-slate-700">KOMITE PENGENDALIAN MUTU &amp; OPERASIONAL &bull; KJPP NANANG RAHAYU &amp; REKAN</p>',
    '<p class="font-bold text-slate-700">KOMITE PENGENDALIAN MUTU &amp; OPERASIONAL &bull; KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</p>'
  );

  fs.writeFileSync(panduanFile, panduanHtml, 'utf8');
  console.log('panduan-operasional-portal-nolap.html updated!');
}

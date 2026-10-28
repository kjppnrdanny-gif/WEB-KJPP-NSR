import fs from 'fs';

['portal-nolap-cabang.html', 'dist/portal-nolap-cabang.html'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/onclick=["']bukaModalPinAdminCabang\(\)["']/g, 'onclick="bukaModalKebijakanDefinitif()"');
  c = c.replace(/<span>📋 Terbitkan Nomor Laporan Definitif Cabang &rarr;<\/span>/g, '<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>📋 Ketentuan Penerbitan NoLap Definitif (SOP 2026) &rarr;</span>');
  c = c.replace(/Otorisasi PIN/g, 'SOP 2026 Terpadu');
  c = c.replace(/dengan verifikasi PIN Admin Cabang &amp; integrasi pengawasan\./g, 'disinkronkan melalui register server terverifikasi guna mencegah nomor ganda.');
  fs.writeFileSync(f, c, 'utf8');
  console.log(`✔ [${f}] Card Mode B finalized.`);
});

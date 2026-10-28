import https from 'node:https';

function fetchContent(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => resolve(''));
  });
}

async function main() {
  console.log('=== VERIFIKASI IDENTIFIER RESMI COMMIT 956eefc DI SERVER LIVE ===');
  const html = await fetchContent('https://kjppnanangrahayu.com/portal-penugasan-jo.html');
  console.log('Ukuran Portal JO Live:', html.length, 'bytes');

  const terms = [
    'sub-wilayah-info',
    'sub-tanggal-info',
    'helper-nomor-terakhir',
    'appr-kantor-wilayah',
    'appr-tanggal-surat',
    'appr-jenis-laporan',
    'appr-spk-seq',
    'appr-nomor-lp',
    'appr-jo-seq',
    'appr-nomor-adm',
    'appr-spk-last',
    'appr-spk-saran',
    'appr-jo-last',
    'appr-jo-saran',
    'appr-warning-loncatan',
    'appr-warning-duplikat',
    'modal-riwayat-register-spk-jo',
    'isBranchSubmittingPusat',
    '[Ditetapkan oleh Admin Pusat saat Approval]',
    'MENUNGGU_PENETAPAN_PUSAT',
    'sinkronkanSeqKeNomorLp',
    'sinkronkanSeqKeNomorAdm',
    'gunakanSaranSpk',
    'gunakanSaranJo',
    'bukaModalRiwayatRegisterSpkJo'
  ];

  let found = 0;
  for (const t of terms) {
    const ok = html.includes(t);
    console.log(`  ${ok ? '✅' : '❌'} [${t}] -> ${ok ? 'TERPASANG DI LIVE' : 'TIDAK DITEMUKAN'}`);
    if (ok) found++;
  }

  console.log(`\nHASIL: ${found}/${terms.length} IDENTIFIER TERVERIFIKASI AKTIF DI HOSTING CPANEL!`);
}

main().catch(console.error);

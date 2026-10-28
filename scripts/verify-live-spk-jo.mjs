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
  console.log('=== PEMERIKSAAN KONTEN SPK/JO LIVE PADA CPANEL ===');
  const html = await fetchContent('https://kjppnanangrahayu.com/portal-penugasan-jo.html');
  console.log('Ukuran Portal JO Live:', html.length);
  
  const checks = [
    'Section 01: Smart Register SPK & JO Resmi',
    'modal-riwayat-smart-register-spk-jo',
    'bukaModalRiwayatRegisterSpkJo',
    'suggestNextNumber',
    'MASTER_KANTOR_OFFICIAL',
    'nomor_lp_manual',
    'nomor_adm_manual',
    'pengaju_nama_display',
    'pengaju_nik_input',
    'badge-master-personel'
  ];
  
  for (const k of checks) {
    const present = html.includes(k);
    console.log(`[CHECK] '${k}': ${present ? 'ADA' : 'TIDAK ADA'}`);
  }
}

main().catch(console.error);

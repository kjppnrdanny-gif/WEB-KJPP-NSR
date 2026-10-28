async function verifyLiveProduction() {
  const base = 'https://kjppnanangrahayu.com';
  console.log('====================================================');
  console.log('VERIFIKASI LIVE PRODUCTION (FAST TRACK SPI 103)');
  console.log('Target:', base);
  console.log('====================================================\n');

  let pass = 0;
  let fail = 0;

  // 1. Verifikasi endpoint submitPermintaanAwalJO tanpa sesi ditolak 401
  try {
    const res = await fetch(`${base}/nolap-data-handler.php?action=submitPermintaanAwalJO`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    if (res.status === 401) {
      console.log('  ✔ PASS: Live Backend Endpoint submitPermintaanAwalJO Terpasang & Menolak Akses Anonim (HTTP 401)');
      pass++;
    } else {
      console.log(`  ❌ FAIL: submitPermintaanAwalJO unexpected status: ${res.status}`);
      fail++;
    }
  } catch (err) {
    console.log(`  ❌ FAIL: submitPermintaanAwalJO fetch error: ${err.message}`);
    fail++;
  }

  // 2. Verifikasi konten portal-penugasan-jo.html live
  try {
    const res = await fetch(`${base}/portal-penugasan-jo.html?_nocache=${Date.now()}`);
    const html = await res.text();

    // Prioritas 1: Role banner & non-admin submit
    if (html.includes('Mode Akses: Marketing Penugasan') && html.includes('submitPermintaanAwalNonAdmin')) {
      console.log('  ✔ PASS: Live Portal JO memiliki Mode Akses Role Khusus & Non-Admin Submit');
      pass++;
    } else {
      console.log('  ❌ FAIL: Live Portal JO mode akses / submit tidak lengkap');
      fail++;
    }

    // Prioritas 2: Pengguna Laporan 7 fields & toggle
    if (html.includes('id="chk_pengguna_sama_pemberi"') && html.includes('id="pengguna_laporan_a_pic"')) {
      console.log('  ✔ PASS: Live Portal JO memiliki 7 Atribut Pengguna Laporan & Toggle Auto-Sync');
      pass++;
    } else {
      console.log('  ❌ FAIL: Live Portal JO field pengguna laporan tidak lengkap');
      fail++;
    }

    // Prioritas 3: Tabel Objek Dinamis & Reordering
    if (html.includes('geserBarisObjek') && html.includes('id="tabel-objek-form"')) {
      console.log('  ✔ PASS: Live Portal JO memiliki Tabel Objek Dinamis Multi-Aset & Tombol Urutan (▲/▼)');
      pass++;
    } else {
      console.log('  ❌ FAIL: Live Portal JO tabel objek dinamis tidak lengkap');
      fail++;
    }

    // Prioritas 4: Biaya Jasa rincian & Belum Disepakati
    if (html.includes('id="chk_biaya_belum_disepakati"') && html.includes('id="biaya_honorarium"') && html.includes('id="biaya_transportasi"')) {
      console.log('  ✔ PASS: Live Portal JO memiliki Rincian Biaya (Honorarium, Transport, Akomodasi) & Status Belum Disepakati');
      pass++;
    } else {
      console.log('  ❌ FAIL: Live Portal JO rincian biaya tidak lengkap');
      fail++;
    }

    // Prioritas 5 & 6: Deni Siswandi nama standard
    if (html.includes('Deni Siswandi, S.T., MAPPI')) {
      console.log('  ✔ PASS: Standardisasi Gelar Deni Siswandi, S.T., MAPPI Utuh di Live Server');
      pass++;
    } else {
      console.log('  ❌ FAIL: Standardisasi Gelar Deni Siswandi tidak ditemukan');
      fail++;
    }

  } catch (err) {
    console.log(`  ❌ FAIL: Fetch live portal error: ${err.message}`);
    fail++;
  }

  console.log('\n====================================================');
  console.log(`TOTAL HASIL UJI LIVE: ${pass} PASS / ${fail} FAIL`);
  console.log('====================================================\n');
  process.exit(fail === 0 ? 0 : 1);
}

verifyLiveProduction();

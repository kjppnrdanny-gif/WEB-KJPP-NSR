import { spawn } from 'child_process';

async function runSessionLockdownTests() {
  console.log('=== MEMULAI TEST ENFORCEMENT PENGUNCIAN NIK (SESSION-BOUND ANTI-PROXY) ===\n');

  // Jalankan server PHP lokal
  const phpServer = spawn('php', ['-S', '127.0.0.1:8088', 'absensi-data-handler.php']);
  await new Promise(r => setTimeout(r, 1200));

  try {
    // 1. TEST VERIFY_GATE (GERBANG AWAL)
    console.log('1. TEST VERIFY_GATE DENGAN KREDENSIAL SALAH:');
    const resInvalid = await fetch('http://127.0.0.1:8088/?action=verify_gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nik: 'NSR-2019-005', token: 'WRONGPIN99' })
    });
    const dataInvalid = await resInvalid.json();
    console.log('   Status Code:', resInvalid.status, '| Success:', dataInvalid.success, '| Message:', dataInvalid.message);
    if (resInvalid.status === 401 && !dataInvalid.success) {
      console.log('   ✓ LULUS: Kredensial salah berhasil ditolak 401.');
    } else {
      throw new Error('Test 1 Gagal');
    }

    console.log('\n2. TEST VERIFY_GATE DENGAN KREDENSIAL SAH (DANNY TAUFIK):');
    const resGateValid = await fetch('http://127.0.0.1:8088/?action=verify_gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nik: 'NSR-2019-005', token: '889900' })
    });
    const cookieHeader = resGateValid.headers.get('set-cookie') || '';
    const dataGateValid = await resGateValid.json();
    console.log('   Status Code:', resGateValid.status, '| Success:', dataGateValid.success, '| NIK:', dataGateValid.nik, '| Token:', dataGateValid.sessionToken?.slice(0, 16) + '...');
    if (resGateValid.status === 200 && dataGateValid.success && dataGateValid.sessionToken) {
      console.log('   ✓ LULUS: Gerbang Akses berhasil menerbitkan sesi terkunci.');
    } else {
      throw new Error('Test 2 Gagal');
    }

    const sessionToken005 = dataGateValid.sessionToken;

    console.log('\n3. TEST VERIFY_GATE DENGAN CABANG MAKASSAR (TOKEN OPINI2026):');
    const resMks = await fetch('http://127.0.0.1:8088/?action=verify_gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nik: 'NSR-MKS-2019-30', token: 'OPINI2026' })
    });
    const dataMks = await resMks.json();
    console.log('   Status Code:', resMks.status, '| Success:', dataMks.success, '| Kantor:', dataMks.kantor);
    if (resMks.status === 200 && dataMks.success) {
      console.log('   ✓ LULUS: Karyawan cabang Makassar berhasil login gerbang via token operasional.');
    } else {
      throw new Error('Test 3 Gagal');
    }

    console.log('\n4. TEST PENCEGAHAN TITIP ABSEN (FRAUDULENT PROXY ATTENDANCE TAMPERING):');
    console.log('   Skenario: Karyawan login sebagai NSR-2019-005, tapi mencoba mengirim presensi atas nama NSR-2019-001 (Nanang Rahayu)');
    const resProxy = await fetch('http://127.0.0.1:8088/?action=simpanAbsensi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken005,
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        sessionToken: sessionToken005,
        nik: 'NSR-2019-001', // NIK ORANG LAIN!
        jenis: 'Masuk',
        lokasi: 'KANTOR',
        gps: '-6.28797,106.82478'
      })
    });
    const dataProxy = await resProxy.json();
    console.log('   Status Code:', resProxy.status, '| Code:', dataProxy.code, '| Message:', dataProxy.message);
    if (resProxy.status === 403 && dataProxy.code === 'PROXY_ATTENDANCE_FORBIDDEN') {
      console.log('   ✓ LULUS 100%: Manipulasi NIK ditolak seketika oleh server dengan 403 Forbidden!');
      console.log('   Pesan Resmi Server: "' + dataProxy.message + '"');
    } else {
      throw new Error('Test 4 Gagal: Server tidak memblokir titip absen!');
    }

    console.log('\n5. TEST PRESENSI SAH DENGAN NIK SESI SENDIRI (SESSION-BOUND IDENTICAL):');
    const resLegit = await fetch('http://127.0.0.1:8088/?action=simpanAbsensi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken005,
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        sessionToken: sessionToken005,
        nik: 'NSR-2019-005', // NIK SESUAI SESI SAH!
        jenis: 'Masuk',
        lokasi: 'WFH',
        gps: '-6.1936673,106.9441382'
      })
    });
    const dataLegit = await resLegit.json();
    console.log('   Status Code:', resLegit.status, '| Success:', dataLegit.success || dataLegit.status, '| Message:', dataLegit.message);
    if (resLegit.status !== 403 && dataLegit.code !== 'PROXY_ATTENDANCE_FORBIDDEN') {
      console.log('   ✓ LULUS: Pengiriman dengan NIK sesi sendiri diterima dan lolos filter anti-proxy!');
    } else {
      throw new Error('Test 5 Gagal: NIK sah justru ditolak');
    }

    console.log('\n6. TEST PERMINTAAN PRESENSI TANPA SESI (UNAUTHENTICATED):');
    const resNoAuth = await fetch('http://127.0.0.1:8088/?action=simpanAbsensi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nik: 'NSR-2019-005',
        jenis: 'Masuk',
        lokasi: 'KANTOR',
        gps: '-6.28797,106.82478'
      })
    });
    const dataNoAuth = await resNoAuth.json();
    console.log('   Status Code:', resNoAuth.status, '| Message:', dataNoAuth.message);
    if (resNoAuth.status === 401) {
      console.log('   ✓ LULUS: Permintaan tanpa sesi aktif ditolak 401.');
    } else {
      throw new Error('Test 6 Gagal');
    }

    console.log('\n=======================================================');
    console.log('✨ SELURUH TEST SECURITY & SESSION-BOUND PENGUNCIAN NIK LULUS 100%!');
    console.log('=======================================================');
  } finally {
    phpServer.kill();
  }
}

runSessionLockdownTests().catch(err => {
  console.error('\n❌ TEST GAGAL:', err.message);
  process.exit(1);
});

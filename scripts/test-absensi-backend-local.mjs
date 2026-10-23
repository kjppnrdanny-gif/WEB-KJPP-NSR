import { spawn } from 'node:child_process';

const PORT = 8894;
const BASE_URL = `http://127.0.0.1:${PORT}/absensi-data-handler.php`;

async function runLocalSmokeTest() {
  console.log('========================================================================');
  console.log('  TESTING BACKEND PRESENSI (PHP SSOT KANTOR PUSAT)');
  console.log('========================================================================\n');

  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', process.cwd()]);
  await new Promise(r => setTimeout(r, 1000));

  try {
    // 1. STATUS
    console.log('--- TEST 1: Healthcheck STATUS ---');
    const resStatus = await fetch(`${BASE_URL}?action=STATUS`);
    const jsonStatus = await resStatus.json();
    console.log('Status code:', resStatus.status);
    console.log('Total Karyawan Pusat:', jsonStatus.total_karyawan_pusat);
    console.log('Source Master:', jsonStatus.source_master);
    if (jsonStatus.total_karyawan_pusat !== 22) throw new Error('Expected 22 Pusat employees, got: ' + jsonStatus.total_karyawan_pusat);
    console.log('  ✅ PASS: STATUS returns 22 employees of Kantor Pusat Jakarta.\n');

    // 2. cekKaryawan Danny Taufik (NSR-2019-005)
    console.log('--- TEST 2: cekKaryawan Danny Taufik Hidayat (NSR-2019-005) ---');
    const resDanny = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cekKaryawan', nik: 'NSR-2019-005' })
    });
    const jsonDanny = await resDanny.json();
    console.log('Nama:', jsonDanny.nama);
    console.log('Jabatan:', jsonDanny.jabatan);
    console.log('Cabang:', jsonDanny.cabang);
    console.log('isAdminHR:', jsonDanny.isAdminHR);
    if (jsonDanny.nama !== 'Danny Taufik Hidayat' || !jsonDanny.isAdminHR) throw new Error('Danny data mismatch');
    console.log('  ✅ PASS: Danny Taufik recognized as Admin HR Pusat.\n');

    // 3. cekKaryawan Nanang Rahayu (NSR-2019-001)
    console.log('--- TEST 3: cekKaryawan Nanang Rahayu (NSR-2019-001) ---');
    const resNanang = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cekKaryawan', nik: 'NSR-2019-001' })
    });
    const jsonNanang = await resNanang.json();
    console.log('Nama:', jsonNanang.nama);
    console.log('Email:', jsonNanang.maskedEmail);
    if (jsonNanang.nama !== 'Nanang Rahayu') throw new Error('Nanang data mismatch');
    console.log('  ✅ PASS: Nanang Rahayu successfully verified from master.\n');

    // 4. Strict NIK test: Partial NIK "005" must be REJECTED
    console.log('--- TEST 4: Partial NIK "005" MUST BE REJECTED ---');
    const resPartial = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cekKaryawan', nik: '005' })
    });
    console.log('Status code for partial NIK:', resPartial.status);
    const jsonPartial = await resPartial.json();
    console.log('Message:', jsonPartial.message);
    if (resPartial.status !== 404) throw new Error('Partial NIK was not rejected!');
    console.log('  ✅ PASS: Partial NIK strictly rejected.\n');

    // 5. Unknown NIK test: "NSR-9999-999" must be REJECTED
    console.log('--- TEST 5: Unknown NIK "NSR-9999-999" MUST BE REJECTED ---');
    const resUnknown = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cekKaryawan', nik: 'NSR-9999-999' })
    });
    console.log('Status code for unknown NIK:', resUnknown.status);
    if (resUnknown.status !== 404) throw new Error('Unknown NIK was not rejected!');
    console.log('  ✅ PASS: Unknown NIK strictly rejected.\n');

    // 6. Test OTP Flow
    console.log('--- TEST 6: OTP Flow (mintaOTP & verifikasiOTP) ---');
    const resMinta = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mintaOTP', nik: 'NSR-2019-005' })
    });
    const jsonMinta = await resMinta.json();
    console.log('Masked Email:', jsonMinta.maskedEmail);
    console.log('Hint OTP (test env):', jsonMinta.test_otp_hint);
    if (!jsonMinta.test_otp_hint) throw new Error('Failed to generate OTP');

    // Verify with WRONG OTP
    const resWrong = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verifikasiOTP', nik: 'NSR-2019-005', otp: '111111' })
    });
    console.log('Status for wrong OTP:', resWrong.status);
    if (resWrong.status !== 401) throw new Error('Wrong OTP was not rejected!');

    // Verify with CORRECT OTP
    const resCorrect = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verifikasiOTP', nik: 'NSR-2019-005', otp: jsonMinta.test_otp_hint })
    });
    const jsonCorrect = await resCorrect.json();
    console.log('Verification success:', jsonCorrect.success);
    console.log('SessionToken length:', jsonCorrect.sessionToken?.length);
    console.log('isAdminHR:', jsonCorrect.isAdminHR);
    if (!jsonCorrect.sessionToken || !jsonCorrect.isAdminHR) throw new Error('Failed to verify OTP correctly');
    console.log('  ✅ PASS: OTP flow verified.\n');

    const sessionToken = jsonCorrect.sessionToken;

    // 7. Presensi Pulang BEFORE Masuk must be REJECTED
    console.log('--- TEST 7: Pulang BEFORE Masuk MUST BE REJECTED ---');
    const resPulangEarly = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simpanAbsensi',
        nik: 'NSR-2019-005',
        jenis: 'Pulang',
        lokasi: 'KANTOR',
        gps: '-6.28797,106.82477',
        sessionToken
      })
    });
    console.log('Status code for early Pulang:', resPulangEarly.status);
    const jsonEarly = await resPulangEarly.json();
    console.log('Message:', jsonEarly.message);
    if (resPulangEarly.status !== 400 || jsonEarly.code !== 'MISSING_PRESENSI_MASUK') {
      throw new Error('Early Pulang was not rejected properly!');
    }
    console.log('  ✅ PASS: Pulang without Masuk rejected with code MISSING_PRESENSI_MASUK.\n');

    // 8. Presensi Masuk
    console.log('--- TEST 8: Presensi Masuk at Pusat Jakarta Geofence ---');
    const resMasuk = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simpanAbsensi',
        nik: 'NSR-2019-005',
        jenis: 'Masuk',
        lokasi: 'KANTOR',
        gps: '-6.2879726,106.8247786',
        sessionToken
      })
    });
    const jsonMasuk = await resMasuk.json();
    console.log('Status validasi:', jsonMasuk.statusValidasi);
    console.log('Jarak meter:', jsonMasuk.jarak);
    if (jsonMasuk.statusValidasi !== 'VALID') throw new Error('Geofence failed for valid office coordinate');
    console.log('  ✅ PASS: Presensi Masuk succeeded and validated within geofence.\n');

    // 9. Presensi Masuk GANDA must be REJECTED
    console.log('--- TEST 9: Duplicate Masuk MUST BE REJECTED ---');
    const resMasukDupl = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simpanAbsensi',
        nik: 'NSR-2019-005',
        jenis: 'Masuk',
        lokasi: 'KANTOR',
        gps: '-6.2879726,106.8247786',
        sessionToken
      })
    });
    console.log('Status code for duplicate Masuk:', resMasukDupl.status);
    const jsonDupl = await resMasukDupl.json();
    console.log('Message:', jsonDupl.message);
    if (resMasukDupl.status !== 409 || jsonDupl.code !== 'DUPLICATE_PRESENSI_MASUK') {
      throw new Error('Duplicate Masuk was not rejected!');
    }
    console.log('  ✅ PASS: Duplicate Masuk rejected with HTTP 409.\n');

    // 10. Presensi Pulang
    console.log('--- TEST 10: Presensi Pulang & Work Duration Computation ---');
    const resPulang = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simpanAbsensi',
        nik: 'NSR-2019-005',
        jenis: 'Pulang',
        lokasi: 'KANTOR',
        gps: '-6.2879726,106.8247786',
        sessionToken
      })
    });
    const jsonPulang = await resPulang.json();
    console.log('Status validasi:', jsonPulang.statusValidasi);
    console.log('Durasi kerja:', jsonPulang.durasi_kerja);
    if (!jsonPulang.durasi_kerja) throw new Error('Durasi kerja not calculated');
    console.log('  ✅ PASS: Presensi Pulang succeeded and calculated work duration.\n');

    // 11. Presensi Pulang GANDA must be REJECTED
    console.log('--- TEST 11: Duplicate Pulang MUST BE REJECTED ---');
    const resPulangDupl = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simpanAbsensi',
        nik: 'NSR-2019-005',
        jenis: 'Pulang',
        lokasi: 'KANTOR',
        gps: '-6.2879726,106.8247786',
        sessionToken
      })
    });
    console.log('Status code for duplicate Pulang:', resPulangDupl.status);
    if (resPulangDupl.status !== 409) throw new Error('Duplicate Pulang was not rejected!');
    console.log('  ✅ PASS: Duplicate Pulang rejected with HTTP 409.\n');

    // 12. Dashboard HR Pusat
    console.log('--- TEST 12: Dashboard HR Pusat Retrieval ---');
    const resDash = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getDashboardHR',
        sessionToken,
        nik: 'NSR-2019-005'
      })
    });
    const jsonDash = await resDash.json();
    console.log('Total Karyawan Pusat:', jsonDash.ringkasan.total_karyawan_pusat);
    console.log('Hadir Masuk:', jsonDash.ringkasan.hadir_masuk);
    console.log('Sudah Pulang:', jsonDash.ringkasan.sudah_pulang);
    console.log('Belum Presensi:', jsonDash.ringkasan.belum_presensi);
    console.log('Jumlah Roster Karyawan:', jsonDash.karyawan_pusat.length);
    if (jsonDash.ringkasan.total_karyawan_pusat !== 22) throw new Error('Dashboard count mismatch');
    console.log('  ✅ PASS: Dashboard HR Pusat successfully verified.\n');

    console.log('========================================================================');
    console.log('  ALL 12 BACKEND TESTS PASSED (100% SUKSES)');
    console.log('========================================================================');

  } finally {
    php.kill();
  }
}

runLocalSmokeTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

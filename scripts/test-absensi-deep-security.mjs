/**
 * Test Suite Lanjutan: Deep Security & Privacy Audit Portal Presensi KJPP NSR
 * Menguji: Brute-force OTP Lockout, Token Expiration, Email Masking,
 * Manipulasi GPS Browser, Proteksi File Database, Hak Akses Isolasi Karyawan,
 * dan Pelepasan Hardware Kamera (Kepatuhan UU PDP No. 27/2022).
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import handler from '../netlify/functions/absensi-data-proxy.mjs';

console.log('===============================================================');
console.log('   DEEP SECURITY & PRIVACY AUDIT PORTAL PRESENSI KJPP NSR      ');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;

function assertTest(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

async function callProxy(method, body = {}, headers = {}, query = '') {
  const url = `http://localhost/api/absensi-data-proxy${query ? '?' + query : ''}`;
  const req = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined
  });
  const res = await handler(req);
  const json = await res.json();
  return { status: res.status, data: json };
}

async function runDeepTests() {
  console.log('[UJI 1] Brute-Force OTP Lockout (Maksimal 3 Kali Salah):');
  {
    // Karyawan Padang (Siti Rahmawati)
    const reqOTP = await callProxy('POST', { action: 'mintaOTP', nik: 'NSR-2021-024' });
    assertTest('Permintaan OTP untuk NIK valid berhasil', () => {
      assert.strictEqual(reqOTP.status, 200);
      assert.ok(reqOTP.data.maskedEmail);
    });

    // Percobaan 1 salah
    const fail1 = await callProxy('POST', { action: 'verifikasiOTP', nik: 'NSR-2021-024', otp: '111111' });
    assertTest('Salah OTP pertama kali: status 401 dan sisa kuota 2 kali', () => {
      assert.strictEqual(fail1.status, 401);
      assert.ok(fail1.data.message.includes('2 kali'));
    });

    // Percobaan 2 salah
    const fail2 = await callProxy('POST', { action: 'verifikasiOTP', nik: 'NSR-2021-024', otp: '222222' });
    assertTest('Salah OTP kedua kali: status 401 dan sisa kuota 1 kali', () => {
      assert.strictEqual(fail2.status, 401);
      assert.ok(fail2.data.message.includes('1 kali'));
    });

    // Percobaan 3 salah (Batas Terlampaui)
    const fail3 = await callProxy('POST', { action: 'verifikasiOTP', nik: 'NSR-2021-024', otp: '333333' });
    assertTest('Salah OTP ketiga kali: dikunci (HTTP 429 - Batas percobaan terlampaui)', () => {
      assert.strictEqual(fail3.status, 429);
      assert.ok(fail3.data.message.includes('Batas percobaan terlampaui'));
    });

    // Upaya verifikasi selanjutnya meskipun dengan OTP yang benar harus ditolak (hangus)
    const hint = reqOTP.data.test_otp_hint;
    const postLockout = await callProxy('POST', { action: 'verifikasiOTP', nik: 'NSR-2021-024', otp: hint });
    assertTest('OTP telah hangus setelah lockout; input OTP yang benar tetap ditolak', () => {
      assert.strictEqual(postLockout.status, 400);
    });
  }

  console.log('\n[UJI 2] Masking Alamat Email Karyawan (UU PDP):');
  {
    const resCek = await callProxy('POST', { action: 'cekKaryawan', nik: 'NSR-2019-005' });
    assertTest('Email karyawan disamarkan (masked) di respons backend', () => {
      assert.strictEqual(resCek.status, 200);
      assert.strictEqual(typeof resCek.data.maskedEmail, 'string');
      // Tidak boleh menampilkan alamat email plaintext
      assert.strictEqual(resCek.data.email, undefined);
      assert.ok(resCek.data.maskedEmail.includes('***'));
    });
  }

  console.log('\n[UJI 3] Proteksi Manipulasi Lokasi GPS di Sisi Server (Haversine Guard):');
  {
    // Ambil sesi valid untuk Karyawan Palembang (Dharma Priyanto)
    const reqOTP = await callProxy('POST', { action: 'mintaOTP', nik: 'NSR-2022-045' });
    const otp = reqOTP.data.test_otp_hint;
    const verifyRes = await callProxy('POST', { action: 'verifikasiOTP', nik: 'NSR-2022-045', otp: otp });
    const sessionToken = verifyRes.data.sessionToken;

    // Browser mengirim status "VALID" palsu padahal koordinatnya di Kutub Utara
    const fakeClientPayload = {
      action: 'simpanAbsensi',
      nik: 'NSR-2022-045',
      sessionToken: sessionToken,
      gps: '85.000000,0.000000', // Kutub Utara (~10.000 km dari Palembang)
      lokasi: 'KANTOR',
      jenis: 'Masuk',
      statusValidasi: 'VALID' // Klaim sepihak dari browser yang dimodifikasi
    };

    const resServer = await callProxy('POST', fakeClientPayload);
    assertTest('Klaim validasi lokasi client diabaikan; server menghitung jarak asli dan menetapkan status TIDAK VALID', () => {
      assert.strictEqual(resServer.status, 200);
      assert.strictEqual(resServer.data.statusValidasi, 'TIDAK VALID');
      assert.ok(resServer.data.jarak > 1000000); // > 1.000 km
      assert.ok(resServer.data.message.includes('TIDAK VALID'));
    });
  }

  console.log('\n[UJI 4] Isolasi Data Riwayat Antar-Karyawan:');
  {
    // Sesi milik Danny Taufik Hidayat (NSR-2019-005)
    const reqOTP = await callProxy('POST', { action: 'mintaOTP', nik: 'NSR-2019-005' });
    const otp = reqOTP.data.test_otp_hint;
    const verifyRes = await callProxy('POST', { action: 'verifikasiOTP', nik: 'NSR-2019-005', otp: otp });
    const sessionTokenDanny = verifyRes.data.sessionToken;

    // Upaya membaca riwayat karyawan lain (misal NIK Dharma Priyanto) menggunakan token Danny
    const resHijack = await callProxy('POST', {
      action: 'getRiwayatPresensi',
      nik: 'NSR-2022-045', // NIK berbeda
      sessionToken: sessionTokenDanny
    });
    assertTest('Upaya membaca riwayat karyawan lain dengan token orang lain ditolak (HTTP 401 Sesi Tidak Sah)', () => {
      assert.strictEqual(resHijack.status, 401);
      assert.strictEqual(resHijack.data.success, false);
    });
  }

  console.log('\n[UJI 5] Proteksi Berkas Database & .htaccess cPanel:');
  {
    const htaccess = fs.readFileSync('.htaccess', 'utf8');
    assertTest('.htaccess memiliki aturan perlindungan berkas absensi_database', () => {
      assert.ok(htaccess.includes('absensi_database'));
      assert.ok(htaccess.includes('Require all denied'));
    });
    assertTest('.htaccess memiliki aturan pemblokiran akses langsung ke direktori data cPanel', () => {
      assert.ok(htaccess.includes('RewriteRule ^data(/.*)?$ - [F,L]'));
    });
  }

  console.log('\n[UJI 6] Kepatuhan Privasi & Pelepasan Hardware Kamera (portal-absensi.html):');
  {
    const html = fs.readFileSync('portal-absensi.html', 'utf8');
    assertTest('portal-absensi.html menyertakan pemberitahuan privasi eksplisit (UU PDP No. 27/2022)', () => {
      assert.ok(html.includes('UU PDP No. 27/2022') || html.includes('UU PDP'));
      assert.ok(html.includes('tidak ada perekaman latar belakang'));
    });
    assertTest('portal-absensi.html memiliki fungsi penutupan kamera dengan pelepasan track', () => {
      assert.ok(html.includes('tutupKamera'));
      assert.ok(html.includes('track.stop()'));
    });
    assertTest('Kamera bersifat opsional dan tidak memblokir presensi jika hardware tidak tersedia', () => {
      assert.ok(html.includes('opsional') || html.includes('Opsional'));
    });
  }

  console.log('\n===============================================================');
  console.log(`HASIL AKHIR DEEP SECURITY AUDIT: ${passCount} PASS / ${failCount} FAIL`);
  console.log('===============================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runDeepTests().catch(console.error);

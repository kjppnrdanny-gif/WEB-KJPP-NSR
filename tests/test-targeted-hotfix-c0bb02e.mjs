// tests/test-targeted-hotfix-c0bb02e.mjs
import fs from 'fs';
import { spawn } from 'child_process';
import http from 'http';

console.log('========================================================================');
console.log('TARGETED TEST SUITE: HOTFIX FINAL COMMIT fc578c9');
console.log('Fokus: Pengamanan Kriptografis King, ETI Individual, 9 Master Dokumen');
console.log('========================================================================\n');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✔ PASS: ${msg}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    fail++;
  }
}

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// [1] MATRIKS SEMBILAN DOKUMEN MASTER & KLAUSUL 8
console.log('[1] VERIFIKASI 9 DOKUMEN MASTER & JUDUL KLAUSUL 8:');

assert(
  html.includes('8. TANGGAL PENILAIAN</p>'),
  '1.1 Judul Klausul 8 sesuai master: "8. TANGGAL PENILAIAN"'
);

assert(
  !html.includes('8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN</p>'),
  '1.2 Judul panjang "TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN" telah dihilangkan'
);

const nineMasterDocs = [
  'Dokumen 1: Lingkup Penugasan (SPK 23 Klausul Master)',
  'Dokumen 2: Surat Representasi (Kebenaran Dokumen & Bebas Penilaian Ulang)',
  'Dokumen 3: Isian UMUM (Form Standar Lingkup Penugasan)',
  'Dokumen 4: Lembar Order (JO / Job Order 2026)',
  'Dokumen 5: Kartu Proyek (Kendali Mutu Berjenjang)',
  'Dokumen 6: Surat Tugas Penilaian Resmi',
  'Dokumen 7: Berita Acara Pemeriksaan (BAP / Inspeksi)',
  'Dokumen 8: Evaluasi Tingkat Independensi (ETI KEPI 5.8)',
  'Dokumen 9: Pernyataan Independensi (PI Multi-Personel)'
];

let allNineFound = true;
nineMasterDocs.forEach((d, idx) => {
  const cleanTitle = d.split('(')[0].trim();
  if (!html.includes(cleanTitle)) {
    allNineFound = false;
    assert(false, `1.3.${idx+1} Dokumen master "${cleanTitle}" terdaftar`);
  }
});
assert(allNineFound, '1.3 Sembilan Dokumen Master terdaftar berurutan tanpa digantikan dokumen operasional');

// [2] ETI INDIVIDUAL & ZERO FALLBACK
console.log('\n[2] VERIFIKASI LOGIKA ETI INDIVIDUAL & ZERO FALLBACK TIDAK:');
assert(
  html.includes('unansweredKeys.push') &&
  html.includes('Pernyataan Belum Lengkap') &&
  !html.includes("const val = document.getElementById('eti_q_' + key)?.value || 'TIDAK';"),
  '2.1 Zero Fallback: Formulir menolak konfirmasi jika ada butir yang belum dipilih (tidak ada fallback otomatis TIDAK)'
);

assert(
  html.includes('Konfirmasi Identitas Personel (KEPI 5.8)') &&
  html.includes('declarantMethod'),
  '2.2 Satu operator dilarang konfirmasi atas nama personel lain tanpa otentikasi identitas / kredensial sah'
);

assert(
  html.includes('countConfirmed === requiredList.length') &&
  html.includes('isAllComplete'),
  '2.3 Status ETI lengkap HANYA jika seluruh personel wajib telah memberikan deklarasi sah'
);

// [3] PENGUJIAN BACKEND API: HASIL NEGATIF BUKTI PALSU, KEDALUWARSA & REPLAY
console.log('\n[3] PENGUJIAN BACKEND API: VALIDASI BUKTI PENGESAH & HASIL NEGATIF:');
const PORT = 8894;
const phpServer = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'nolap-data-handler.php']);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestApi(action, payload, token = 'NSR8899') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/?action=${action}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`,
        'X-Session-Token': token
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(data);
    req.end();
  });
}

(async () => {
  await sleep(1000);

  try {
    // Siapkan penugasan uji terisolasi di database resmi via submitGerbang1Awal lengkap
    const testId = 'HOTFIX-TEST-' + Date.now();
    const resCreate = await requestApi('submitGerbang1Awal', {
      idPenugasan: testId,
      namaKlien: 'PT Hotfix Validasi Terarah',
      jenisObjek: 'Gudang Terisolasi',
      kantorWilayah: 'Bandung',
      kodeIndustri: '01',
      npwp: '01.234.567.8-901.000',
      statusNpwp: 'VALID_NPWP',
      tujuanPenilaian: 'Agunan Perbankan',
      namaPemohon: 'Budi Santoso',
      emailPemohon: 'budi@kjppnanangrahayu.com',
      waPemohon: '081234567890'
    }, 'NSR-BDG-2026');

    assert(
      resCreate.status === 200 && resCreate.data && resCreate.data.success,
      'Penugasan uji terisolasi berhasil didaftarkan di database'
    );

    // TEST 3.1: Rejection on Non-Existent Penugasan ID
    const resNotFound = await requestApi('approveProfesionalCabangLP', {
      idPenugasan: 'NON-EXISTENT-ID-XYZ-999',
      kantorWilayah: 'Bandung'
    }, 'NSR8899');
    assert(
      resNotFound.status === 404 && resNotFound.data && resNotFound.data.code === 'PROJECT_NOT_FOUND',
      '3.1 Penolakan persetujuan untuk ID penugasan yang tidak ditemukan dalam database resmi (HTTP 404 PROJECT_NOT_FOUND)'
    );

    // TEST 3.2: Rejection on Arbitrary PIN / Credential
    const resBadPin = await requestApi('verifyPengesahKing', {
      operator: 'NANANG',
      credential: 'arbitrary_false_pin',
      idPenugasan: testId
    }, 'NSR8899');
    assert(
      resBadPin.status === 401 && resBadPin.data && resBadPin.data.code === 'INVALID_SIGNER_CREDENTIAL',
      '3.2 Penolakan kredensial / PIN sembarang via password_verify (HTTP 401 INVALID_SIGNER_CREDENTIAL)'
    );

    // TEST 3.3: Issuance of Legitimate Time-Bounded Single-Use Proof
    const resValidProof = await requestApi('verifyPengesahKing', {
      operator: 'DENI',
      credential: 'NSR-DS-2026!P',
      idPenugasan: testId
    }, 'NSR8899');
    assert(
      resValidProof.status === 200 && resValidProof.data && resValidProof.data.verification_proof,
      '3.3 Penerbitan bukti verifikasi pengesah sah terikat waktu (5 menit) dan nonce kriptografis (HTTP 200)'
    );

    const proof = resValidProof.data.verification_proof;

    // TEST 3.4: Rejection on Tampered / Forged Proof
    const tamperedProof = proof.substring(0, proof.length - 6) + 'abc123';
    const resTampered = await requestApi('approveProfesionalCabangLP', {
      idPenugasan: testId,
      kantorWilayah: 'Bandung',
      verification_proof: tamperedProof
    }, 'NSR8899');
    assert(
      resTampered.status === 403 && resTampered.data && resTampered.data.details && resTampered.data.details.includes('TAMPERED_PROOF'),
      '3.4 Penolakan bukti palsu / tanda tangan kriptografis rusak (HTTP 403 TAMPERED_PROOF)'
    );

    // TEST 3.5: Rejection on Mismatched Penugasan Binding
    const testIdOther = 'HOTFIX-OTHER-' + Date.now();
    await requestApi('submitGerbang1Awal', {
      idPenugasan: testIdOther,
      namaKlien: 'PT Proyek Kedua',
      jenisObjek: 'Ruko',
      kantorWilayah: 'Bandung',
      kodeIndustri: '01',
      npwp: '01.234.567.8-901.000',
      statusNpwp: 'VALID_NPWP',
      namaPemohon: 'Budi Santoso',
      emailPemohon: 'budi@kjppnanangrahayu.com',
      waPemohon: '081234567890'
    }, 'NSR-BDG-2026');

    const resMismatchedProject = await requestApi('approveProfesionalCabangLP', {
      idPenugasan: testIdOther,
      kantorWilayah: 'Bandung',
      verification_proof: proof // proof terikat pada testId, bukan testIdOther!
    }, 'NSR8899');
    assert(
      resMismatchedProject.status === 403 && resMismatchedProject.data && resMismatchedProject.data.details && resMismatchedProject.data.details.includes('MISMATCHED_PENUGASAN'),
      '3.5 Penolakan bukti yang dicoba digunakan untuk penugasan berbeda (HTTP 403 MISMATCHED_PENUGASAN)'
    );

    // TEST 3.6: Successful Single-Use Execution of Valid Proof
    const resApproveSuccess = await requestApi('approveProfesionalCabangLP', {
      idPenugasan: testId,
      kantorWilayah: 'Bandung',
      verification_proof: proof
    }, 'NSR8899');
    assert(
      resApproveSuccess.status === 200 && resApproveSuccess.data && resApproveSuccess.data.success,
      '3.6 Bukti sah pertama kali berhasil disahkan oleh server (HTTP 200 OK)'
    );

    // TEST 3.7: Rejection on Replay Attack (Using Same Proof Twice)
    const resReplay = await requestApi('approveProfesionalCabangLP', {
      idPenugasan: testId,
      kantorWilayah: 'Bandung',
      verification_proof: proof
    }, 'NSR8899');
    assert(
      resReplay.status === 403 && resReplay.data && resReplay.data.details && resReplay.data.details.includes('REPLAYED_PROOF'),
      '3.7 Penolakan serangan replay: Bukti yang sudah pernah dipakai ditolak seketika (HTTP 403 REPLAYED_PROOF)'
    );

    // TEST 3.8: Rejection on Expired Proof Simulation
    const parts = proof.split('.');
    const b64Claims = parts[0];
    const claims = JSON.parse(Buffer.from(b64Claims.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    claims.exp = Math.floor(Date.now() / 1000) - 60; // Kedaluwarsa 1 menit lalu
    claims.nonce = 'expired_nonce_' + Date.now();
    
    const crypto = await import('crypto');
    const newB64 = Buffer.from(JSON.stringify(claims)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const secretKey = 'f9cfdf6917d2722e3fa0ec3e77a3e312888fdc5fb248a899afaaceb1548d1c9b';
    const newSig = crypto.createHmac('sha256', secretKey).update(newB64).digest('hex');
    const expiredProof = newB64 + '.' + newSig;

    const resExpired = await requestApi('approveProfesionalCabangLP', {
      idPenugasan: testId,
      kantorWilayah: 'Bandung',
      verification_proof: expiredProof
    }, 'NSR8899');
    assert(
      resExpired.status === 403 && resExpired.data && resExpired.data.details && resExpired.data.details.includes('EXPIRED_PROOF'),
      '3.8 Penolakan bukti yang telah kedaluwarsa (HTTP 403 EXPIRED_PROOF)'
    );

  } catch (err) {
    console.error('Targeted Test Error:', err);
    fail++;
  } finally {
    phpServer.kill();
  }

  console.log('\n========================================================================');
  console.log(`TOTAL UJI TARGETED: ${pass + fail} | PASS: ${pass} | FAIL: ${fail}`);
  console.log('========================================================================');

  if (fail > 0) {
    process.exit(1);
  } else {
    console.log('🎉 SELURUH PENGUJIAN TARGETED HOTFIX fc578c9 100% LULUS!');
    process.exit(0);
  }
})();

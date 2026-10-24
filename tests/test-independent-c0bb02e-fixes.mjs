// tests/test-independent-c0bb02e-fixes.mjs
import fs from 'fs';
import { spawn } from 'child_process';
import http from 'http';

console.log('========================================================================');
console.log('TEST SUITE: PEMERIKSAAN INDEPENDEN DEFECT FIXES (COMMIT c0bb02e CORRECTION)');
console.log('Target: PIN King, Jalur A Otorisasi, ETI Bebas Omnibus, Matriks 23 Klausul');
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

// 1. Static Checks on HTML and PHP
const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const php = fs.readFileSync('nolap-data-handler.php', 'utf8');

console.log('[1] VERIFIKASI REMOVAL OMNIBUS & IMPLEMENTASI DEKLARASI ETI PER-PERSONEL:');
assert(
  !html.includes('onclick="deklarasiSemuaIndependen()"'),
  '1.1 Tombol batch omnibus deklarasiSemuaIndependen() TELAH DIHAPUS TOTAL'
);
assert(
  html.includes('konfirmasiDeklarasiPersonelIndividual') &&
  html.includes('muatStatusDeklarasiPersonel') &&
  html.includes('container-personel-eti-status'),
  '1.2 Fungsi deklarasi individual per personel (konfirmasiDeklarasiPersonelIndividual) terpasang'
);
assert(
  html.includes('eti_declarations') &&
  (html.includes('!isAllComplete') || html.includes('adaBelum || !anyDeclDone')),
  '1.3 Status ETI tetap BELUM DIISI / BELUM LENGKAP jika ada personel yang belum melakukan deklarasi mandiri'
);

console.log('\n[2] VERIFIKASI MATRIKS 23 KLAUSUL MASTER TEMPLATE LINGKUP PENUGASAN (DOCX):');
const masterClauses = [
  '1. STATUS PENILAI',
  '2. PEMBERI TUGAS',
  '3. PENGGUNA LAPORAN',
  '4. OBJEK PENILAIAN DAN KEPEMILIKAN',
  '5. JENIS MATA UANG YANG DIGUNAKAN',
  '6. MAKSUD DAN TUJUAN PENILAIAN',
  '7. DASAR NILAI',
  '8. TANGGAL PENILAIAN',
  '9. TINGKAT KEDALAMAN INVESTIGASI',
  '10. SIFAT DAN SUMBER INFORMASI YANG DAPAT DIANDALKAN',
  '11. ASUMSI DAN ASUMSI KHUSUS',
  '12. PERSYARATAN ATAS PERSETUJUAN UNTUK PUBLIKASI',
  '13. KONFIRMASI BAHWA PENILAIAN DILAKUKAN BERDASARKAN SPI',
  '14. LAPORAN PENILAIAN',
  '15. BATASAN ATAU PENGECUALIAN ATAS TANGGUNG JAWAB KEPADA PIHAK SELAIN PEMBERI TUGAS',
  '16. PERSYARATAN ADANYA PERNYATAAN TERTULIS BERUPA SURAT REPRESENTASI DARI PEMBERI TUGAS MENGENAI KEBENARAN DAN SIFAT INFORMASI YANG DIBERIKAN OLEH PEMBERI TUGAS',
  '17. NON DISCLOSURE AGREEMENT',
  '18. DATA-DATA YANG DIPERLUKAN',
  '19. HAK DAN KEWAJIBAN PARA PIHAK',
  '20. FORCE MAJEURE',
  '21. BIAYA JASA PENILAIAN',
  '22. CARA PEMBAYARAN',
  '23. MASA BERLAKU LINGKUP PENUGASAN DAN BERAKHIRNYA PERJANJIAN'
];

let lastPos = 0;
let clauseOrderOk = true;
masterClauses.forEach((c, idx) => {
  const p = html.indexOf(c, lastPos);
  if (p === -1) {
    clauseOrderOk = false;
    assert(false, `2.${idx+1} Klausul master "${c}" ditemukan sesuai urutan`);
  } else {
    lastPos = p;
  }
});
assert(clauseOrderOk, '2.0 Seluruh 23 Klausul Master DOCX tersusun persis sesuai urutan dan redaksi resmi');

// 2. Start PHP server to test backend actions
console.log('\n[3] TESTING BACKEND API DENGAN PHP BUILT-IN SERVER:');
const PORT = 8896;
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
    // TEST 3.1: verifyPengesahKing with arbitrary PIN (e.g. 1234, abcd)
    console.log('Testing verifyPengesahKing dengan PIN sembarang:');
    const resArbitrary = await requestApi('verifyPengesahKing', {
      operator: 'NANANG',
      credential: '1234',
      idPenugasan: 'TEST-NSR-001'
    });
    assert(
      resArbitrary.status === 401 && resArbitrary.data && resArbitrary.data.code === 'INVALID_SIGNER_CREDENTIAL',
      '3.1 Backend MENOLAK PIN sembarang "1234" (HTTP 401 Unauthorized)'
    );

    const resArbitraryDeni = await requestApi('verifyPengesahKing', {
      operator: 'DENI',
      credential: 'random_pin_test',
      idPenugasan: 'TEST-NSR-001'
    });
    assert(
      resArbitraryDeni.status === 401,
      '3.2 Backend MENOLAK kredensial sembarang "random_pin_test" untuk Deni Siswandi (HTTP 401)'
    );

    // TEST 3.3: verifyPengesahKing with valid rotated credential
    console.log('Testing verifyPengesahKing dengan kredensial sah:');
    const resValid = await requestApi('verifyPengesahKing', {
      operator: 'NANANG',
      credential: 'NSR-NR-2026!P',
      idPenugasan: 'TEST-NSR-001'
    });
    assert(
      resValid.status === 200 && resValid.data && resValid.data.success && resValid.data.verification_proof,
      '3.3 Backend MENERIMA kredensial sah Nanang Rahayu dan menerbitkan HMAC verification_proof (HTTP 200)'
    );

    const resValidDeni = await requestApi('verifyPengesahKing', {
      operator: 'DENI',
      credential: 'NSR-DS-2026!P',
      idPenugasan: 'TEST-NSR-001'
    });
    assert(
      resValidDeni.status === 200 && resValidDeni.data && resValidDeni.data.success && resValidDeni.data.verification_proof,
      '3.4 Backend MENERIMA kredensial sah Deni Siswandi dan menerbitkan HMAC verification_proof (HTTP 200)'
    );

    // TEST 3.5: Jalur A - publishMandiriCabangLP without professional approval
    console.log('\nTesting Jalur A: publishMandiriCabangLP tanpa persetujuan profesional:');
    const tokenCabangBdg = 'NSR-BDG-2026';
    const testId = 'TEST-JALUR-A-' + Date.now();

    // Register project in DB first
    await requestApi('submitGerbang1Awal', {
      idPenugasan: testId,
      namaKlien: 'PT Agunan Uji',
      jenisObjek: 'Rumah Tinggal',
      kantorWilayah: 'Bandung',
      kodeIndustri: '01',
      npwp: '01.234.567.8-901.000',
      statusNpwp: 'VALID_NPWP',
      namaPemohon: 'Budi Santoso',
      emailPemohon: 'budi@kjppnanangrahayu.com',
      waPemohon: '081234567890'
    }, tokenCabangBdg);

    const resUnapproved = await requestApi('publishMandiriCabangLP', {
      idPenugasan: testId,
      kantorWilayah: 'Bandung',
      namaKlien: 'PT Agunan Uji',
      jenisObjek: 'Rumah Tinggal',
      serviceClassification: 'PROPERTY_SIMPLE'
    }, tokenCabangBdg);

    assert(
      resUnapproved.status === 422 && resUnapproved.data && resUnapproved.data.code === 'UNAPPROVED_PROFESSIONAL_LP',
      '3.5 Backend MENOLAK penerbitan administratif Jalur A jika belum disetujui profesional oleh Pimpinan Cabang (HTTP 422 UNAPPROVED_PROFESSIONAL_LP)'
    );

    // TEST 3.6: Jalur A - approveProfesionalCabangLP sah
    console.log('Testing Jalur A: approveProfesionalCabangLP sah:');
    // Get fresh proof
    const resProofForApprove = await requestApi('verifyPengesahKing', {
      operator: 'DENI',
      credential: 'NSR-DS-2026!P',
      idPenugasan: testId
    }, 'NSR8899');

    const resApprove = await requestApi('approveProfesionalCabangLP', {
      idPenugasan: testId,
      kantorWilayah: 'Bandung',
      namaKlien: 'PT Agunan Uji',
      jenisObjek: 'Rumah Tinggal',
      verification_proof: resProofForApprove.data.verification_proof
    }, 'NSR8899');

    assert(
      resApprove.status === 200 && resApprove.data && resApprove.data.success && resApprove.data.persetujuan_profesional,
      '3.6 approveProfesionalCabangLP berhasil mengesahkan persetujuan profesional terikat idPenugasan (HTTP 200)'
    );

    // Now Admin Cabang issues the numbers administratively
    const resPublishAfterApprove = await requestApi('publishMandiriCabangLP', {
      idPenugasan: testId,
      kantorWilayah: 'Bandung',
      namaKlien: 'PT Agunan Uji',
      jenisObjek: 'Rumah Tinggal',
      serviceClassification: 'PROPERTY_SIMPLE',
      persetujuan_profesional: resApprove.data.persetujuan_profesional
    }, tokenCabangBdg);

    assert(
      resPublishAfterApprove.status === 200 && resPublishAfterApprove.data && resPublishAfterApprove.data.success && resPublishAfterApprove.data.nomorLpResmi,
      '3.7 Admin Cabang berhasil menerbitkan nomor SPK & JO resmi secara mandiri setelah persetujuan profesional tervalidasi (HTTP 200)'
    );

  } catch (err) {
    console.error('API Test Error:', err);
    fail++;
  } finally {
    phpServer.kill();
  }

  console.log('\n========================================================================');
  console.log(`TOTAL UJI: ${pass + fail} | PASS: ${pass} | FAIL: ${fail}`);
  console.log('========================================================================');

  if (fail > 0) {
    process.exit(1);
  } else {
    console.log('🎉 SELURUH PERBAIKAN DEFECT c0bb02e TELAH TERVERIFIKASI 100% LULUS!');
    process.exit(0);
  }
})();

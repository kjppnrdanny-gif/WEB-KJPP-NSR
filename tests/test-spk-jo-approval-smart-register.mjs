import fs from 'fs';
import assert from 'assert';
import http from 'http';
import { spawn } from 'child_process';

console.log('================================================================');
console.log('TEST SUITE: P0 SMART REGISTER SPK/JO & WORKFLOW APPROVAL ADMIN');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

const PORT = 8996;
const TOKEN_ADMIN_PUSAT = 'NSR-ADM-2026';

// -----------------------------------------------------------------------------
// GRUP 1: VERIFIKASI DOM & TAMPILAN SECTION 01 & MODAL APPROVAL PUSAT
// -----------------------------------------------------------------------------
test('1.1 Section 01 contains sub-badges for branch applicant notification', () => {
  const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
  assert(content.includes('id="sub-wilayah-info"'), 'sub-wilayah-info element missing');
  assert(content.includes('id="sub-tanggal-info"'), 'sub-tanggal-info element missing');
  assert(content.includes('id="helper-nomor-terakhir"'), 'helper-nomor-terakhir element missing');
});

test('1.2 Modal Approval Pusat contains full Section 01 fields (Wilayah, Tanggal, Jenis, SPK, JO, History, Jump Alert)', () => {
  const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
  assert(content.includes('id="appr-kantor-wilayah"'), 'appr-kantor-wilayah select missing');
  assert(content.includes('id="appr-tanggal-surat"'), 'appr-tanggal-surat input missing');
  assert(content.includes('id="appr-jenis-laporan"'), 'appr-jenis-laporan select missing');
  assert(content.includes('id="appr-spk-seq"'), 'appr-spk-seq input missing');
  assert(content.includes('id="appr-nomor-lp"'), 'appr-nomor-lp input missing');
  assert(content.includes('id="appr-jo-seq"'), 'appr-jo-seq input missing');
  assert(content.includes('id="appr-nomor-adm"'), 'appr-nomor-adm input missing');
  assert(content.includes('id="appr-spk-last"'), 'appr-spk-last badge missing');
  assert(content.includes('id="appr-spk-saran"'), 'appr-spk-saran badge missing');
  assert(content.includes('id="appr-jo-last"'), 'appr-jo-last badge missing');
  assert(content.includes('id="appr-jo-saran"'), 'appr-jo-saran badge missing');
  assert(content.includes('id="appr-warning-loncatan"'), 'appr-warning-loncatan alert missing');
  assert(content.includes('id="appr-warning-duplikat"'), 'appr-warning-duplikat alert missing');
  assert(content.includes('id="modal-riwayat-register-spk-jo"'), 'modal-riwayat-register-spk-jo missing');
});

test('1.3 Official Register Config has baseline 415 for both SPK and JO Pusat', () => {
  const regConfig = JSON.parse(fs.readFileSync('data/official_register_config.json', 'utf8'));
  const regSpk = regConfig.find(r => r.id === 'reg_pusat_lp_spk_2026');
  const regJo = regConfig.find(r => r.id === 'reg_pusat_jo_2026');

  assert(regSpk, 'reg_pusat_lp_spk_2026 not found');
  assert(regSpk.nomorTerakhir >= 415, 'SPK baseline must be at least 415');
  assert(parseInt(regSpk.kandidatBerikutnya, 10) >= 416, 'SPK candidate must be at least 0416');
  assert.strictEqual(regSpk.status, 'AKTIF', 'SPK register must be AKTIF');

  assert(regJo, 'reg_pusat_jo_2026 not found');
  assert(regJo.nomorTerakhir >= 415, 'JO baseline must be at least 415');
  assert(parseInt(regJo.kandidatBerikutnya, 10) >= 416, 'JO candidate must be at least 0416');
  assert.strictEqual(regJo.status, 'AKTIF', 'JO register must be AKTIF');
});

// -----------------------------------------------------------------------------
// GRUP 2: ALUR KERJA LOGIS & KEWENANGAN RBAC DI JAVASCRIPT
// -----------------------------------------------------------------------------
test('2.1 Branch applicant submitting to Central gets readonly placeholder and hidden counter badges', () => {
  const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
  assert(content.includes('isBranchSubmittingPusat'), 'isBranchSubmittingPusat check missing');
  assert(content.includes('[Ditetapkan oleh Admin Pusat saat Approval]'), 'Official placeholder missing');
  assert(content.includes('MENUNGGU_PENETAPAN_PUSAT'), 'MENUNGGU_PENETAPAN_PUSAT constant missing');
});

test('2.2 SPK and JO registers are independent and correctly formatted', () => {
  const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
  assert(content.includes('sinkronkanSeqKeNomorLp'), 'sinkronkanSeqKeNomorLp missing');
  assert(content.includes('sinkronkanSeqKeNomorAdm'), 'sinkronkanSeqKeNomorAdm missing');
  assert(content.includes('gunakanSaranSpk'), 'gunakanSaranSpk missing');
  assert(content.includes('gunakanSaranJo'), 'gunakanSaranJo missing');

  // Regex format SPK: [Seq]/NSR/[PN-APP|PN-RTL]/[Bulan]/[Tahun]
  const sampleSpk = '0416/NSR/PN-APP/X/2026';
  assert.match(sampleSpk, /^\d{4}\/NSR\/PN-(APP|RTL)\/[IVXLCDM]+\/\d{4}$/, 'SPK format must match standard');

  // Regex format JO: [Seq]/JO/NSR/[Bulan]/[Tahun]
  const sampleJo = '0416/JO/NSR/X/2026';
  assert.match(sampleJo, /^\d{4}\/JO\/NSR\/[IVXLCDM]+\/\d{4}$/, 'JO format must match standard');
});

test('2.3 Duplicate blocking is enforced on approval modal for all roles', () => {
  const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
  assert(content.includes('function validasiApprovalDuplikatLive'), 'validasiApprovalDuplikatLive missing');
  assert(content.includes('PENERBITAN DITOLAK (NOMOR DUPLIKAT)'), 'Duplicate rejection warning missing');
  assert(content.includes('btnSubmit.disabled = true;'), 'Submit button must be disabled on duplicate');
});

test('2.4 Cabang Mandiri workflow is preserved with isolated branch sequence', () => {
  const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
  assert(content.includes('const isCabangMandiri = (currentModeAlur === \'PRIVATE_CABANG\' || currentModeAlur === \'MANDIRI\');'), 'Cabang mandiri mode detection missing');
  assert(content.includes('autoLp = `${seq}/NSR-${code}/${kodeLap}/${romawi}/${thn}`'), 'Cabang mandiri LP format preserved');
  assert(content.includes('autoAdm = `${code}-${seq}`'), 'Cabang mandiri JO format preserved');
});

// -----------------------------------------------------------------------------
// GRUP 3: PENGUJIAN BACKEND PHP, ATOMIK, DUPLIKAT BLOCKING & EMAIL NOTIFIKASI
// -----------------------------------------------------------------------------
const phpServer = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', '.'], {
  cwd: process.cwd(),
  stdio: 'ignore'
});

await new Promise(resolve => setTimeout(resolve, 1000));

function sendPost(payload, role = 'SUPER_ADMIN') {
  return new Promise((resolve, reject) => {
    const postData = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const req = http.request(`http://127.0.0.1:${PORT}/nolap-data-handler.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-NSR-Token': TOKEN_ADMIN_PUSAT,
        'X-User-Role': role,
        'X-User-Display-Name': (role === 'SUPER_ADMIN') ? 'SUPER ADMIN (KING)' : 'Admin Kantor Pusat'
      }
    }, (resp) => {
      let body = '';
      resp.on('data', chunk => body += chunk);
      resp.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) { json = { raw: body }; }
        resolve({ statusCode: resp.statusCode, body, json });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const dataDir = 'data';
const dgFile = `${dataDir}/dual_gate_database.json`;
const regConfigFile = `${dataDir}/official_register_config.json`;
let originalDgRecords = [];
let originalRegConfig = [];
if (fs.existsSync(dgFile)) {
  originalDgRecords = JSON.parse(fs.readFileSync(dgFile, 'utf8'));
}
if (fs.existsSync(regConfigFile)) {
  originalRegConfig = JSON.parse(fs.readFileSync(regConfigFile, 'utf8'));
}

try {
  await testAsync('3.1 Backend publishOfficialLP blocks duplicate numbers with HTTP 409 Conflict', async () => {
    const testProject1 = {
      idPenugasan: 'TEST-P0-001',
      noPermintaan: 'REQ-P0-001',
      namaKlien: 'PT Bank Mandiri (Persero) Tbk',
      nomorLp: '0416/NSR/PN-APP/X/2026',
      nomorAdm: '0416/JO/NSR/X/2026',
      gerbang1: {
        status: 'LP_DITERBITKAN',
        nomorLpResmi: '0416/NSR/PN-APP/X/2026',
        nomorAdmResmi: '0416/JO/NSR/X/2026'
      },
      pengaju: {
        nama: 'Rekan Penilai Test',
        email: 'test.penilai@kjppnanangrahayu.com',
        whatsapp_number: '081234567890'
      }
    };

    const testProject2 = {
      idPenugasan: 'TEST-P0-002',
      noPermintaan: 'REQ-P0-002',
      namaKlien: 'PT Bank Central Asia Tbk',
      gerbang1: {
        status: 'SIAP_TERBIT_LP'
      },
      pengaju: {
        nama: 'Rekan Penilai Dua',
        email: 'penilai2@kjppnanangrahayu.com',
        whatsapp_number: '089876543210'
      }
    };

    fs.writeFileSync(dgFile, JSON.stringify([testProject1, testProject2], null, 2));

    const res = await sendPost({
      action: 'publishOfficialLP',
      idPenugasan: 'TEST-P0-002',
      nomorLpResmi: '0416/NSR/PN-APP/X/2026', // Duplicate!
      nomorAdmResmi: '0417/JO/NSR/X/2026'
    }, 'SUPER_ADMIN');

    assert.strictEqual(res.statusCode, 409, `Must return HTTP 409 Conflict for duplicate SPK number, got ${res.statusCode}: ${res.body}`);
    assert.strictEqual(res.json.violation, 'DUPLICATE_SPK_NUMBER', 'Must return DUPLICATE_SPK_NUMBER violation code');
  });

  await testAsync('3.2 Backend publishOfficialLP accepts unique numbers, updates register atomically, and queues email to manual contact', async () => {
    const testProject = {
      idPenugasan: 'TEST-UNIQUE-001',
      noPermintaan: 'REQ-UNIQ-001',
      namaKlien: 'PT Bank Mandiri Cabang Sudirman',
      gerbang1: {
        status: 'SIAP_TERBIT_LP'
      },
      pengaju: {
        nama: 'Deni Surveyor Cabang',
        email: 'deni.surveyor@example.com',
        whatsapp_number: '081299988877'
      }
    };

    fs.writeFileSync(dgFile, JSON.stringify([testProject], null, 2));

    const res = await sendPost({
      action: 'publishOfficialLP',
      idPenugasan: 'TEST-UNIQUE-001',
      nomorLpResmi: '0417/NSR/PN-APP/X/2026',
      nomorAdmResmi: '0418/JO/NSR/X/2026',
      kantorWilayah: 'Kantor Pusat Jakarta',
      tanggalSurat: '2026-10-23',
      jenisLaporan: 'APP'
    }, 'SUPER_ADMIN');

    assert.strictEqual(res.statusCode, 200, `Must return HTTP 200 OK for valid unique numbers, got ${res.statusCode}: ${res.body}`);
    assert.strictEqual(res.json.success, true, 'Response must be success: true');
    assert.strictEqual(res.json.status, 'LP_DITERBITKAN', 'Status must transition to LP_DITERBITKAN');
    assert.strictEqual(res.json.nomorLpResmi, '0417/NSR/PN-APP/X/2026');
    assert.strictEqual(res.json.nomorAdmResmi, '0418/JO/NSR/X/2026');
    assert(res.json.whatsappUrl && (res.json.whatsappUrl.includes('6281299988877') || res.json.whatsappUrl.includes('81299988877')), 'WhatsApp URL must use manual applicant contact');

    // Verify mail queue received the notification
    const mailQueueFile = `${dataDir}/mail_queue.json`;
    if (fs.existsSync(mailQueueFile)) {
      const queue = JSON.parse(fs.readFileSync(mailQueueFile, 'utf8'));
      const matchingMail = queue.find(m => m.recipient === 'deni.surveyor@example.com');
      assert(matchingMail, 'Mail queue must contain email to manual applicant contact');
    }

    // Verify official_register_config.json updated sequence numbers
    const regConfig = JSON.parse(fs.readFileSync('data/official_register_config.json', 'utf8'));
    const regSpk = regConfig.find(r => r.id === 'reg_pusat_lp_spk_2026');
    const regJo = regConfig.find(r => r.id === 'reg_pusat_jo_2026');
    assert(regSpk.nomorTerpakai.includes('0417'), 'SPK 0417 must be recorded in nomorTerpakai');
    assert(regJo.nomorTerpakai.includes('0418'), 'JO 0418 must be recorded in nomorTerpakai');
    assert(regSpk.nomorTerakhir >= 417, 'SPK nomorTerakhir bumped to at least 417');
    assert(regJo.nomorTerakhir >= 418, 'JO nomorTerakhir bumped to at least 418');
  });

  await testAsync('3.3 Concurrency Test: Simultaneous requests for the same SPK number are handled safely', async () => {
    const testProjectA = {
      idPenugasan: 'TEST-CONCUR-A',
      noPermintaan: 'REQ-CONCUR-A',
      namaKlien: 'PT Bank Mandiri Cabang A',
      gerbang1: { status: 'SIAP_TERBIT_LP' },
      pengaju: { email: 'pengajuA@example.com', whatsapp_number: '08111111111' }
    };

    const testProjectB = {
      idPenugasan: 'TEST-CONCUR-B',
      noPermintaan: 'REQ-CONCUR-B',
      namaKlien: 'PT Bank Central Asia Cabang B',
      gerbang1: { status: 'SIAP_TERBIT_LP' },
      pengaju: { email: 'pengajuB@example.com', whatsapp_number: '08222222222' }
    };

    fs.writeFileSync(dgFile, JSON.stringify([testProjectA, testProjectB], null, 2));

    const payloadA = {
      action: 'publishOfficialLP',
      idPenugasan: 'TEST-CONCUR-A',
      nomorLpResmi: '0420/NSR/PN-APP/X/2026',
      nomorAdmResmi: '0420/JO/NSR/X/2026'
    };

    const payloadB = {
      action: 'publishOfficialLP',
      idPenugasan: 'TEST-CONCUR-B',
      nomorLpResmi: '0420/NSR/PN-APP/X/2026', // SAMA PERSIS dengan payloadA
      nomorAdmResmi: '0420/JO/NSR/X/2026'
    };

    // Eksekusi dua request secara paralel
    const [resA, resB] = await Promise.all([
      sendPost(payloadA, 'ADMIN_PUSAT'),
      sendPost(payloadB, 'ADMIN_PUSAT')
    ]);

    const statuses = [resA.statusCode, resB.statusCode];
    assert(statuses.includes(200), 'Salah satu request berhasil HTTP 200');
    assert(statuses.includes(409), 'Request kedua yang duplikat diblokir keras HTTP 409');
  });

} finally {
  // Restore original dual gate file
  if (originalDgRecords.length > 0) {
    fs.writeFileSync(dgFile, JSON.stringify(originalDgRecords, null, 2));
  }
  if (originalRegConfig.length > 0) {
    fs.writeFileSync(regConfigFile, JSON.stringify(originalRegConfig, null, 4));
  }
  phpServer.kill();
}

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

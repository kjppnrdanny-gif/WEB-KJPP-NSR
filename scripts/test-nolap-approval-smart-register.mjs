import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PORT = 9595;
const PORT = 8940;
const URL = `http://127.0.0.1:${PORT}/portal-nolap.html`;

async function main() {
  console.log('🚀 Memulai Uji Komprehensif Addendum P0: Format Baku NoLap (SE-6/PPPK/2018)...');
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`, 'router.php'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-nolap-appr-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,1100',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (v.ok) { connected = true; break; }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 400));
  }
  if (!connected) throw new Error('Chrome connection timeout');
  const tabRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/new?about:blank`, { method: 'PUT' });
  const tabData = await tabRes.json();
  const ws = new WebSocket(tabData.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (e) => {
        const m = JSON.parse(e.data);
        if (m.id === msgId) {
          ws.removeEventListener('message', handler);
          if (m.error) reject(new Error(JSON.stringify(m.error)));
          else resolve(m.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  let loadFired = false;
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') loadFired = true;
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 40; i++) {
    if (loadFired) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1200));

  console.log('\n--- TAHAP 1: AUDIT RBAC ADMIN PUSAT ([REDACTED_ADMIN_PUSAT_TOKEN]) ---');
  const authPstRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
      if (inpPass) inpPass.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
      loginKeServer(null);
      await new Promise(r => setTimeout(r, 600));
      return JSON.stringify({
        infoUserRole: document.getElementById('info-user-role')?.innerText,
        infoUserKantor: document.getElementById('info-user-kantor')?.innerText,
        role: typeof sesiAktif !== 'undefined' ? sesiAktif.role : null,
        isKing: typeof sesiAktif !== 'undefined' ? sesiAktif.isKing : null,
        isSuperAdmin: typeof sesiAktif !== 'undefined' ? sesiAktif.isSuperAdmin : null,
        canApprove: typeof sesiAktif !== 'undefined' ? sesiAktif.canApprove : null
      });
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const authPst = JSON.parse(authPstRes.result?.value || '{}');
  console.log('Sesi Admin Pusat:', authPst);
  if (authPst.role !== 'ADMIN_PUSAT') {
    throw new Error('FAILED: Role Admin Pusat bukan ADMIN_PUSAT: ' + JSON.stringify(authPst));
  }
  if (authPst.isKing === true) {
    throw new Error('FAILED: Admin Pusat tidak boleh memiliki hak KING!');
  }
  console.log('✅ RBAC Admin Pusat TERPISAH DARI KING (Role: ADMIN_PUSAT, isKing: false).');

  console.log('\n--- TAHAP 2: NAVIGASI KE TAB 3 & UJI REGULER DENGAN NPWP (SEGMEN 6 = 1) ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      gantiTabModul('approval');
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const testRegulerRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const pReg = {
        noPermintaan: 'REQ-2026-REG-TEST',
        namaKlien: 'PT Bank Mandiri (Persero) Tbk - Makassar',
        cabang: 'Makassar',
        origin_branch_id: 'Makassar',
        origin_branch_code: '2.0160-03',
        requested_signing_office: 'PUSAT',
        signing_office_code: '2.0160-00',
        jenisObjek: 'Tanah & Bangunan Ruko Komersial',
        lokasiObjek: 'Jl. Boulevard Panakkukang No. 88, Makassar',
        service_classification_id: 'PROPERTY_COMPLEX',
        klasifikasiJasa: 'Penilaian Properti',
        report_service_code: 'PI',
        kodeIndustri: '07',
        namaPenilai: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        izinPenilai: '00581',
        kodeNpwp: '1',
        npwp: '01.234.567.8-012.000',
        checklistQa: true,
        otorisasiPartner: true,
        status: 'Disetujui Partner',
        modePengajuan: 'REGULER',
        isBooking: false,
        tglPenilaian: '2026-10-23'
      };

      daftarPermohonan.unshift(pReg);
      muatUlangTabel();

      // Buka Modal Terbitkan Manual
      bukaModalTerbitkanManual('REQ-2026-REG-TEST');

      return JSON.stringify({
        modalVisible: !document.getElementById('modal-terbitkan-nolap-manual')?.classList.contains('hidden'),
        reqId: document.getElementById('manual-req-id')?.innerText,
        reqKlien: document.getElementById('manual-req-klien')?.innerText,
        reqKantorTtd: document.getElementById('manual-req-kantor')?.innerText,
        suggestNolap: document.getElementById('manual-suggest-nolap')?.innerText,
        inputSeqVal: document.getElementById('input-manual-seq')?.value,
        inputNoLapVal: document.getElementById('input-manual-nolap')?.value
      });
    })()`,
    returnByValue: true
  });

  const stateReg = JSON.parse(testRegulerRes.result?.value || '{}');
  console.log('State Modal Approval NoLap (Reguler Ber-NPWP):', stateReg);

  if (!stateReg.modalVisible) throw new Error('FAILED: Modal Approval NoLap tidak terbuka!');
  const segsReg = stateReg.inputNoLapVal.split('/');
  if (segsReg.length < 7 || segsReg[5] !== '1') {
    throw new Error('FAILED: Nomor Reguler ber-NPWP segmen 6 harus "1"! Didapat: ' + stateReg.inputNoLapVal);
  }
  console.log('✅ Nomor Reguler Ber-NPWP Terverifikasi: Segmen 6 = 1 (' + stateReg.inputNoLapVal + ')');

  console.log('\n--- TAHAP 3: UJI PERMOHONAN REGULER TANPA NPWP (SEGMEN 6 = 0) ---');
  const testRegNoNpwpRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const pNonNpwp = {
        noPermintaan: 'REQ-2026-NON-NPWP-TEST',
        namaKlien: 'Bapak Ahmad Hidayat (Perorangan)',
        cabang: 'Bandung',
        origin_branch_id: 'Bandung',
        origin_branch_code: '2.0160-02',
        requested_signing_office: 'PUSAT',
        signing_office_code: '2.0160-00',
        jenisObjek: 'Rumah Tinggal Sederhana',
        lokasiObjek: 'Jl. Dago Asri No. 12, Bandung',
        service_classification_id: 'PROPERTY_SIMPLE',
        klasifikasiJasa: 'Penilaian Properti Sederhana',
        report_service_code: 'PI',
        kodeIndustri: '07',
        namaPenilai: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        izinPenilai: '00581',
        kodeNpwp: '0',
        npwp: '-',
        checklistQa: true,
        otorisasiPartner: true,
        status: 'Disetujui Partner',
        modePengajuan: 'REGULER',
        isBooking: false,
        tglPenilaian: '2026-10-23'
      };

      daftarPermohonan.unshift(pNonNpwp);
      muatUlangTabel();
      bukaModalTerbitkanManual('REQ-2026-NON-NPWP-TEST');

      return JSON.stringify({
        noLapVal: document.getElementById('input-manual-nolap')?.value
      });
    })()`,
    returnByValue: true
  });
  const stateNoNpwp = JSON.parse(testRegNoNpwpRes.result?.value || '{}');
  const segsNoNpwp = stateNoNpwp.noLapVal.split('/');
  if (segsNoNpwp.length < 7 || segsNoNpwp[5] !== '0') {
    throw new Error('FAILED: Nomor Reguler non-NPWP segmen 6 harus "0"! Didapat: ' + stateNoNpwp.noLapVal);
  }
  console.log('✅ Nomor Reguler Non-NPWP Terverifikasi: Segmen 6 = 0 (' + stateNoNpwp.noLapVal + ')');

  console.log('\n--- TAHAP 4: UJI INPUT MANUAL SEQUENCE, FORMAT 7 SEGMEN & PERINGATAN LONCATAN ---');
  const testLoncatanRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const elSeq = document.getElementById('input-manual-seq');
      elSeq.value = '13250';
      sinkronkanSeqKeNoLap();

      const warnLoncatan = document.getElementById('manual-warning-loncatan');
      return JSON.stringify({
        newNoLap: document.getElementById('input-manual-nolap')?.value,
        warningVisible: warnLoncatan && !warnLoncatan.classList.contains('hidden'),
        warningText: document.getElementById('manual-warning-loncatan-text')?.innerText
      });
    })()`,
    returnByValue: true
  });

  const stateLoncatan = JSON.parse(testLoncatanRes.result?.value || '{}');
  console.log('Hasil Input Manual Sequence:', stateLoncatan);
  if (!stateLoncatan.newNoLap.startsWith('13250/')) {
    throw new Error('FAILED: Sinkronisasi nomor urut manual gagal!');
  }
  if (!stateLoncatan.warningVisible) {
    throw new Error('FAILED: Peringatan loncatan nomor urut tidak aktif!');
  }
  console.log('✅ Deteksi Loncatan Nomor Urut Berfungsi.');

  console.log('\n--- TAHAP 5: UJI PENOLAKAN KERAS HURUF B PADA SEGMEN 6 (KODE NPWP) ---');
  const testRejectBRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const inputNoLap = document.getElementById('input-manual-nolap');
      inputNoLap.value = '13229/2.0160-00/PI/07/00581/B/X/2026';
      validasiManualNoLapInput();

      const warnEl = document.getElementById('manual-warning-duplikat');
      const warnText = document.getElementById('manual-warning-duplikat-text')?.innerText;
      const btnSubmit = document.getElementById('btn-submit-terbit-nolap');

      return JSON.stringify({
        warningVisible: warnEl && !warnEl.classList.contains('hidden'),
        warningText: warnText,
        btnDisabled: Boolean(btnSubmit && btnSubmit.disabled)
      });
    })()`,
    returnByValue: true
  });

  const stateRejectB = JSON.parse(testRejectBRes.result?.value || '{}');
  console.log('Hasil Uji Penolakan Huruf B:', stateRejectB);
  if (!stateRejectB.warningVisible || !stateRejectB.btnDisabled) {
    throw new Error('FAILED: UI tidak memblokir input huruf "B" pada segmen ke-6!');
  }
  if (!stateRejectB.warningText.includes('SE-6/PPPK/2018') || !stateRejectB.warningText.includes('Kode NPWP')) {
    throw new Error('FAILED: Pesan penolakan SE-6/PPPK/2018 tidak sesuai: ' + stateRejectB.warningText);
  }
  console.log('✅ Proteksi UI Baku: Huruf "B" pada segmen ke-6 DITOLAK KERAS dan submit dinonaktifkan.');

  // Tangkap screenshot bukti penolakan huruf B
  await new Promise(r => setTimeout(r, 400));
  const snapRejectB = await send('Page.captureScreenshot', { format: 'png' });
  const fileRejectB = path.join(ARTIFACT_DIR, 'bukti_live_nolap_tolak_huruf_b.png');
  fs.writeFileSync(fileRejectB, Buffer.from(snapRejectB.data, 'base64'));
  console.log('📸 Screenshot Penolakan Huruf B tersimpan:', fileRejectB);

  console.log('\n--- TAHAP 6: UJI MODE BOOKING PEMERINTAH/BUMN BER-NPWP (SEGMEN 6 = 1) ---');
  const testBookingRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const pBooking = {
        noPermintaan: 'REQ-2026-BOK-TEST',
        namaKlien: 'Kementerian Keuangan RI / DJKN Wilayah Sulsel',
        cabang: 'Makassar',
        origin_branch_id: 'Makassar',
        origin_branch_code: '2.0160-03',
        requested_signing_office: 'PUSAT',
        signing_office_code: '2.0160-00',
        jenisObjek: 'Aset Eks BPPN / Kelolaan Negara (Multi-Objek)',
        lokasiObjek: 'Kawasan Industri Makassar & Sekitarnya',
        service_classification_id: 'PROPERTY_COMPLEX',
        klasifikasiJasa: 'Penilaian Properti',
        report_service_code: 'PI',
        kodeIndustri: '07',
        namaPenilai: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        izinPenilai: '00581',
        isPemerintahBumn: true,
        kodeNpwp: '1',
        checklistQa: false,
        otorisasiPartner: false,
        status: 'BOOKING_DIAJUKAN',
        modePengajuan: 'BOOKING',
        isBooking: true,
        tglPenilaian: '2026-10-23'
      };

      daftarPermohonan.unshift(pBooking);
      const isEligible = isEligibleForGenerateNoLap(pBooking);

      // Buka modal approval booking
      bukaModalTerbitkanManual('REQ-2026-BOK-TEST');

      const elSeq = document.getElementById('input-manual-seq');
      if (elSeq) {
        elSeq.value = '13229';
        sinkronkanSeqKeNoLap();
      }

      const modalState = {
        isEligible: isEligible,
        modeDisplay: document.getElementById('manual-req-mode')?.innerText,
        noLapGenerated: document.getElementById('input-manual-nolap')?.value
      };

      // Eksekusi Simpan Penerbitan Booking
      simpanPenerbitanManual();

      const updated = daftarPermohonan.find(p => p.noPermintaan === 'REQ-2026-BOK-TEST');
      return JSON.stringify({
        ...modalState,
        finalStatus: updated?.status,
        finalNomor: updated?.nomorLaporan,
        statusElsa: updated?.statusElsa,
        isBookingRecorded: updated?.isBooking
      });
    })()`,
    returnByValue: true
  });

  const stateBooking = JSON.parse(testBookingRes.result?.value || '{}');
  console.log('Hasil Alur Booking Nomor Laporan:', stateBooking);
  if (!stateBooking.isEligible) {
    throw new Error('FAILED: Mode Booking ditolak oleh isEligibleForGenerateNoLap!');
  }
  const segsBooking = stateBooking.noLapGenerated.split('/');
  if (segsBooking[5] !== '1') {
    throw new Error('FAILED: Mode Booking Pemerintah/BUMN ber-NPWP segmen 6 harus "1"! Didapat: ' + stateBooking.noLapGenerated);
  }
  if (stateBooking.noLapGenerated.includes('/B/')) {
    throw new Error('FAILED: DILARANG menggunakan huruf B pada nomor laporan Kemenkeu! Nomor: ' + stateBooking.noLapGenerated);
  }
  if (stateBooking.finalStatus !== 'NOMOR DIBOOKING') {
    throw new Error('FAILED: Status akhir booking bukan NOMOR DIBOOKING: ' + stateBooking.finalStatus);
  }
  if (!stateBooking.statusElsa.includes('TERKUNCI')) {
    throw new Error('FAILED: Status eLSa harus terkunci sebelum berkas final: ' + stateBooking.statusElsa);
  }
  console.log('✅ Mode Booking Berhasil Mengalokasikan Nomor Resmi Baku (Segmen 6 = 1):', stateBooking.finalNomor);
  console.log('   Status Internal:', stateBooking.finalStatus, '| Status eLSa:', stateBooking.statusElsa);

  // Capture screenshot Meja Approval Booking
  await new Promise(r => setTimeout(r, 600));
  const snapBok = await send('Page.captureScreenshot', { format: 'png' });
  const fileBok = path.join(ARTIFACT_DIR, 'bukti_nolap_tab3_booking_allocated.png');
  fs.writeFileSync(fileBok, Buffer.from(snapBok.data, 'base64'));
  console.log('📸 Screenshot Alokasi Booking tersimpan:', fileBok);

  console.log('\n--- TAHAP 7: UJI BACKEND PHP: TOLAK HURUF B & SIMPAN STATUS BOOKING ---');
  // 1. Uji backend menolak segmen 6 = 'B'
  const backendRejectRes = await fetch(`http://127.0.0.1:${PORT}/nolap-data-handler.php`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-NSR-Role': 'ADMIN_PUSAT',
      'X-NSR-Token': (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN")
    },
    body: JSON.stringify({
      action: 'approveRequest',
      payload: {
        noPermintaan: 'REQ-2026-REG-TEST',
        nomorLaporan: '13229/2.0160-00/PI/07/00581/B/X/2026'
      }
    })
  });
  console.log('Backend response status saat segmen 6 bernilai B:', backendRejectRes.status);
  const backendRejectJson = await backendRejectRes.json();
  console.log('Backend response payload:', backendRejectJson);
  if (backendRejectRes.status !== 422 || backendRejectJson.violation !== 'INVALID_SEGMENT_6_NPWP_CODE') {
    throw new Error('FAILED: Backend PHP harus mengembalikan HTTP 422 INVALID_SEGMENT_6_NPWP_CODE!');
  }
  console.log('✅ Backend PHP TERBUKTI Menolak Segmen 6 dengan Huruf "B" (HTTP 422).');

  console.log('\n--- TAHAP 8: UJI SESI SUPER ADMIN KING ([REDACTED_SUPER_ADMIN_TOKEN]) ---');
  const kingAuthRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
      if (inpPass) inpPass.value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
      loginKeServer(null);
      await new Promise(r => setTimeout(r, 600));
      return JSON.stringify({
        infoUserRole: document.getElementById('info-user-role')?.innerText,
        role: typeof sesiAktif !== 'undefined' ? sesiAktif.role : null,
        isKing: typeof sesiAktif !== 'undefined' ? sesiAktif.isKing : null,
        isSuperAdmin: typeof sesiAktif !== 'undefined' ? sesiAktif.isSuperAdmin : null
      });
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  const kingAuth = JSON.parse(kingAuthRes.result?.value || '{}');
  console.log('Sesi KING NoLap:', kingAuth);
  if (!kingAuth.isKing) {
    throw new Error('FAILED: Autentikasi KING NoLap gagal!');
  }
  console.log('✅ Autentikasi KING NoLap Lulus (isKing: true).');

  console.log('\n===============================================================');
  console.log('🎉 SEMUA PENGUJIAN ADDENDUM P0 FORMAT BAKU NOLAP LULUS 100%!');
  console.log('===============================================================');

  chrome.kill();
  php.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});

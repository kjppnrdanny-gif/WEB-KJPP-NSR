import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PORT = 9590;
const PORT = 8940;
const URL = `http://127.0.0.1:${PORT}/portal-nolap.html`;

async function main() {
  console.log('🚀 Memulai Uji Komprehensif Portal NoLap Tab 3 Approval & Smart Register 2026...');
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

  await new Promise(r => setTimeout(r, 1500));
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

  console.log('\n--- TAHAP 1: AUDIT RBAC ADMIN PUSAT (NSR-PST-2026) ---');
  const authPstRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = 'NSR-PST-2026';
      if (inpPass) inpPass.value = 'NSR-PST-2026';
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

  console.log('\n--- TAHAP 2: NAVIGASI KE TAB 3 (APPROVAL ADMIN) & INJEKSI PERMOHONAN REGULER ---');
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
        reqKantorAsal: document.getElementById('manual-req-kantor-asal')?.innerText,
        reqKantorTtd: document.getElementById('manual-req-kantor')?.innerText,
        reqPenilai: document.getElementById('manual-req-penilai')?.innerText,
        reqMode: document.getElementById('manual-req-mode')?.innerText,
        lastNolap: document.getElementById('manual-last-nolap')?.innerText,
        suggestNolap: document.getElementById('manual-suggest-nolap')?.innerText,
        inputSeqVal: document.getElementById('input-manual-seq')?.value,
        inputNoLapVal: document.getElementById('input-manual-nolap')?.value
      });
    })()`,
    returnByValue: true
  });

  const stateReg = JSON.parse(testRegulerRes.result?.value || '{}');
  console.log('State Modal Approval NoLap (Reguler):', stateReg);

  if (!stateReg.modalVisible) throw new Error('FAILED: Modal Approval NoLap tidak terbuka!');
  if (!stateReg.inputNoLapVal.includes('2.0160-00/PI')) {
    throw new Error('FAILED: Nomor 7 Segmen tidak terformat secara benar: ' + stateReg.inputNoLapVal);
  }
  console.log('✅ Meja Approval NoLap Terbuka Sempurna.');
  console.log('   Nomor Laporan Saran Awal: ' + stateReg.inputNoLapVal);

  console.log('\n--- TAHAP 3: UJI INPUT MANUAL SEQUENCE, FORMAT 7 SEGMEN & PERINGATAN LONCATAN ---');
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

  console.log('\n--- TAHAP 4: UJI TOMBOL GUNAKAN SARAN & PERLINDUNGAN DUPLIKAT ---');
  const testSaranRes = await send('Runtime.evaluate', {
    expression: `(() => {
      gunakanSaranNoLap();
      const warnLoncatan = document.getElementById('manual-warning-loncatan');
      return JSON.stringify({
        saranNoLap: document.getElementById('input-manual-nolap')?.value,
        loncatanHidden: warnLoncatan && warnLoncatan.classList.contains('hidden')
      });
    })()`,
    returnByValue: true
  });
  console.log('Hasil Gunakan Saran:', JSON.parse(testSaranRes.result?.value || '{}'));

  // Uji Blokir Duplikasi
  const testDuplikatRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const currentVal = document.getElementById('input-manual-nolap').value;
      daftarPermohonan.push({
        noPermintaan: 'REQ-KONFLIK-EXISTING',
        nomorLaporan: currentVal,
        namaKlien: 'PT Konflik Duplikasi',
        status: 'NOMOR DITERBITKAN'
      });

      validasiManualNoLapInput();

      const warnDuplikat = document.getElementById('manual-warning-duplikat');
      const btnSubmit = document.getElementById('btn-submit-terbit-nolap');

      return JSON.stringify({
        duplicateWarningVisible: warnDuplikat && !warnDuplikat.classList.contains('hidden'),
        btnSubmitDisabled: Boolean(btnSubmit && btnSubmit.disabled)
      });
    })()`,
    returnByValue: true
  });

  const stateDuplikat = JSON.parse(testDuplikatRes.result?.value || '{}');
  console.log('Hasil Uji Blokir Duplikasi:', stateDuplikat);
  if (!stateDuplikat.duplicateWarningVisible || !stateDuplikat.btnSubmitDisabled) {
    throw new Error('FAILED: Proteksi nomor ganda tidak memblokir tombol submit!');
  }
  console.log('✅ Proteksi Nomor Ganda Aktif & Menolak Submit.');

  // Hapus rekaman konflik uji
  await send('Runtime.evaluate', {
    expression: `(() => {
      daftarPermohonan = daftarPermohonan.filter(p => p.noPermintaan !== 'REQ-KONFLIK-EXISTING');
      validasiManualNoLapInput();
    })()`
  });

  // Capture screenshot Meja Approval NoLap
  await new Promise(r => setTimeout(r, 600));
  const snapAppr = await send('Page.captureScreenshot', { format: 'png' });
  const fileAppr = path.join(ARTIFACT_DIR, 'bukti_nolap_tab3_approval_modal_smart_register.png');
  fs.writeFileSync(fileAppr, Buffer.from(snapAppr.data, 'base64'));
  console.log('📸 Screenshot Meja Approval NoLap tersimpan:', fileAppr);

  // Buka Modal History Register
  console.log('\n--- TAHAP 5: UJI MODAL HISTORY REGISTER RESMI ---');
  const testHistoryModalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      bukaModalPengaturanRegister();
      const modal = document.getElementById('modal-pengaturan-register');
      return JSON.stringify({
        historyModalVisible: modal && !modal.classList.contains('hidden'),
        tableRowCount: modal?.querySelectorAll('table tbody tr')?.length
      });
    })()`,
    returnByValue: true
  });
  console.log('Status Modal History Register:', JSON.parse(testHistoryModalRes.result?.value || '{}'));

  await new Promise(r => setTimeout(r, 600));
  const snapHist = await send('Page.captureScreenshot', { format: 'png' });
  const fileHist = path.join(ARTIFACT_DIR, 'bukti_nolap_modal_register_resmi.png');
  fs.writeFileSync(fileHist, Buffer.from(snapHist.data, 'base64'));
  console.log('📸 Screenshot Modal Register tersimpan:', fileHist);

  // Tutup Modal History & Modal Terbitkan
  await send('Runtime.evaluate', {
    expression: `(() => {
      tutupModalPengaturanRegister();
      tutupModalTerbitkanManual();
    })()`
  });

  console.log('\n--- TAHAP 6: UJI MODE BOOKING NOMOR LAPORAN (PEMERINTAH/BUMN) ---');
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
        checklistQa: false, // Berkas menyusul (termin 100% BAST)
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
  if (!stateBooking.noLapGenerated.includes('/B/')) {
    throw new Error('FAILED: Kode revisi/booking segmen 6 bukan B: ' + stateBooking.noLapGenerated);
  }
  if (stateBooking.finalStatus !== 'NOMOR DIBOOKING') {
    throw new Error('FAILED: Status akhir booking bukan NOMOR DIBOOKING: ' + stateBooking.finalStatus);
  }
  console.log('✅ Mode Booking Berhasil Mengalokasikan Nomor Resmi & Mengunci eLSa.');

  // Capture screenshot Tab 3 pasca booking
  await new Promise(r => setTimeout(r, 600));
  const snapBok = await send('Page.captureScreenshot', { format: 'png' });
  const fileBok = path.join(ARTIFACT_DIR, 'bukti_nolap_tab3_booking_allocated.png');
  fs.writeFileSync(fileBok, Buffer.from(snapBok.data, 'base64'));
  console.log('📸 Screenshot Alokasi Booking tersimpan:', fileBok);

  console.log('\n--- TAHAP 7: UJI SESI SUPER ADMIN KING (NSR8899) PADA NOLAP ---');
  const kingAuthRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = 'NSR8899';
      if (inpPass) inpPass.value = 'NSR8899';
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
  console.log('🎉 SEMUA PENGUJIAN PORTAL NOLAP TAB 3 LULUS 100%!');
  console.log('===============================================================');

  chrome.kill();
  php.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});

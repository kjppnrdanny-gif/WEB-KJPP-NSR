import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const CHROME_PORT = 9555;
const LIVE_BASE = 'https://kjppnanangrahayu.com';

function fetchLiveText(url) {
  return new Promise((resolve, reject) => {
    https.get(url + '?nocache=' + Date.now(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function waitForLiveDeployment() {
  console.log('⏳ Menunggu sinkronisasi deployment cPanel selesai di server live...');
  for (let i = 1; i <= 30; i++) {
    try {
      const nolapHtml = await fetchLiveText(`${LIVE_BASE}/portal-nolap.html`);
      const joHtml = await fetchLiveText(`${LIVE_BASE}/portal-penugasan-jo.html`);
      
      const nolapReady = nolapHtml.includes('Meja Approval &amp; Smart Register NoLap OPINI NSR') && nolapHtml.includes('input-manual-seq');
      const joReady = joHtml.includes('[Ditetapkan oleh Admin Pusat saat Approval]');

      if (nolapReady && joReady) {
        console.log(`✅ [Percobaan ${i}] Website Produksi cPanel telah aktif dengan versi terbaru!`);
        return true;
      }
      console.log(`   [Percobaan ${i}] Belum aktif (NoLap: ${nolapReady}, JO: ${joReady}). Menunggu 6 detik...`);
    } catch (e) {
      console.log(`   [Percobaan ${i}] Jaringan: ${e.message}. Menunggu 6 detik...`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  throw new Error('Timeout: Deployment cPanel belum aktif setelah 3 menit.');
}

async function main() {
  await waitForLiveDeployment();

  console.log('\n🚀 MEMULAI VERIFIKASI BROWSER HEADLESS PADA WEBSITE PRODUKSI CPANEL');
  console.log('   Live Domain:', LIVE_BASE);

  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-live-finishing-'));
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--window-size=1440,950',
    '--user-data-dir=' + tmpProfile,
    'about:blank'
  ]);

  let connected = false;
  for (let i = 0; i < 25; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
      if (v.ok) { connected = true; break; }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 400));
  }
  if (!connected) throw new Error('Gagal koneksi ke Chrome CDP port ' + CHROME_PORT);

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
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') loadFired = true;
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');

  // ==========================================
  // BAGIAN 1: VERIFIKASI PORTAL JO (TAB 3 CLEAN)
  // ==========================================
  console.log('\n--- 1. UJI PORTAL LINGKUP PENUGASAN & JO (LIVE) ---');
  loadFired = false;
  await send('Page.navigate', { url: `${LIVE_BASE}/portal-penugasan-jo.html?nocache=${Date.now()}` });
  for (let i = 0; i < 60; i++) {
    if (loadFired) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 1200));

  // Login KING di JO
  await send('Runtime.evaluate', {
    expression: `(async () => {
      const tokenInput = document.getElementById('input_token_auth');
      if (tokenInput) {
        tokenInput.value = 'NSR8899';
        await verifikasiTokenLogin(null);
      }
    })()`,
    awaitPromise: true
  });
  await new Promise(r => setTimeout(r, 1000));

  // Injeksi proyek approved sah dan buka Pratinjau di Tab 3
  const joTab3State = await send('Runtime.evaluate', {
    expression: `(() => {
      const pApproved = {
        id: 'PJ-LIVE-APPROVED-TEST',
        nomor_lp: '0416/NSR/PN-APP/X/2026',
        nomor_adm: '0416/JO/NSR/X/2026',
        nama_klien: 'PT Bank Central Asia Tbk',
        debitur: 'PT Graha Megah Mandiri',
        kantor_wilayah: 'Kantor Pusat Jakarta',
        tanggal_surat: '2026-10-23',
        status: 'APPROVED',
        status_approval: 'APPROVED',
        jenis_laporan: 'APP',
        kategori_template: 'REAL_PROPERTY',
        tujuan_penilaian: 'Penjaminan Hutang / Agunan Kredit',
        dasar_nilai: 'Nilai Pasar & Nilai Likuidasi',
        pendekatan: ['Pasar', 'Biaya'],
        biaya_total: 'Rp 27.750.000',
        fee_penilaian: '25000000',
        ppn_nominal: '2750000',
        rekan_nama: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        rekan_izin: 'B-1.09.00581',
        penilai_nama: 'Deni Siswandi, ST., M.Sc., MAPPI (Cert.)',
        penilai_izin: 'P-1.12.00345'
      };

      if (typeof projectDatabase !== 'undefined') {
        projectDatabase.unshift(pApproved);
      }
      bukaPratinjauProyek('PJ-LIVE-APPROVED-TEST');

      const tab1 = document.getElementById('tab-content-form');
      const tab2 = document.getElementById('tab-content-dashboard');
      const tab3 = document.getElementById('tab-3');
      const rendered = document.getElementById('preview-rendered-area');
      const text = rendered ? rendered.innerText : '';

      return JSON.stringify({
        tab1Hidden: tab1 ? tab1.classList.contains('hidden') : false,
        tab2Hidden: tab2 ? tab2.classList.contains('hidden') : false,
        tab3Visible: tab3 ? !tab3.classList.contains('hidden') : false,
        hasDok1SPK: text.includes('LINGKUP PENUGASAN') || text.includes('SPK'),
        hasNomorLp: text.includes('0416/NSR/PN-APP/X/2026'),
        hasDebitur: text.includes('PT Graha Megah Mandiri'),
        hasNo0001: text.includes('0001/'),
        renderedDocLength: text.length
      });
    })()`,
    returnByValue: true
  });

  const joRes = JSON.parse(joTab3State.result?.value || '{}');
  console.log('Status Tab 3 Portal JO Live:', joRes);

  if (!joRes.tab1Hidden || !joRes.tab3Visible) {
    throw new Error('FAILED: Tab 3 JO tidak tampil secara eksklusif!');
  }
  if (!joRes.hasDok1SPK || !joRes.hasNomorLp) {
    throw new Error('FAILED: Dokumen resmi 9-dokumen gagal dirender di Tab 3 live!');
  }
  if (joRes.hasNo0001) {
    throw new Error('FAILED: Dokumen masih memuat nomor fallback tidak sah 0001!');
  }
  console.log('✅ Tab 3 JO Live BERSIH TOTAL dari formulir input dan dokumen resmi 9-dokumen berstatus SAH!');

  // Tangkapan Layar Tab 3 JO Live
  const ssJo = await send('Page.captureScreenshot', { format: 'png' });
  const ssJoPath = path.join(ARTIFACT_DIR, 'bukti_live_portal_jo_tab3_preview_clean.png');
  fs.writeFileSync(ssJoPath, Buffer.from(ssJo.data, 'base64'));
  console.log('📸 Screenshot Tab 3 JO Live tersimpan:', ssJoPath);

  // ==========================================
  // BAGIAN 2: VERIFIKASI PORTAL NOLAP (TAB 3 APPROVAL & SMART REGISTER)
  // ==========================================
  console.log('\n--- 2. UJI PORTAL NOLAP MEJA APPROVAL & SMART REGISTER (LIVE) ---');
  loadFired = false;
  await send('Page.navigate', { url: `${LIVE_BASE}/portal-nolap.html?nocache=${Date.now()}` });
  for (let i = 0; i < 60; i++) {
    if (loadFired) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 1200));

  // Login Admin Pusat di NoLap
  const loginPstRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = 'NSR-PST-2026';
      if (inpPass) inpPass.value = 'NSR-PST-2026';
      loginKeServer(null);
      await new Promise(r => setTimeout(r, 800));
      return JSON.stringify({
        roleText: document.getElementById('info-user-role')?.innerText,
        kantorText: document.getElementById('info-user-kantor')?.innerText,
        role: typeof sesiAktif !== 'undefined' ? sesiAktif.role : null,
        isKing: typeof sesiAktif !== 'undefined' ? sesiAktif.isKing : null,
        canApprove: typeof sesiAktif !== 'undefined' ? sesiAktif.canApprove : null
      });
    })()`,
    awaitPromise: true,
    returnByValue: true
  });
  const pstAuth = JSON.parse(loginPstRes.result?.value || '{}');
  console.log('Sesi Admin Pusat NoLap Live:', pstAuth);
  if (pstAuth.role !== 'ADMIN_PUSAT' || pstAuth.isKing === true) {
    throw new Error('FAILED: RBAC Admin Pusat di NoLap Live tidak sah!');
  }
  console.log('✅ RBAC Admin Pusat Live Valid (Role: ADMIN_PUSAT, isKing: false).');

  // Beralih ke Tab 3 (Approval Admin)
  await send('Runtime.evaluate', {
    expression: `(() => {
      gantiTabModul('approval');
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Buka Meja Approval Modal dengan data simulasi penugasan Reguler
  const modalOpenRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const pReg = {
        noPermintaan: 'REQ-LIVE-P0-REGULER',
        namaKlien: 'PT Bank Central Asia Tbk - Makassar',
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

      if (typeof daftarPermohonan !== 'undefined') {
        daftarPermohonan.unshift(pReg);
        muatUlangTabel();
      }
      bukaModalTerbitkanManual('REQ-LIVE-P0-REGULER');

      return JSON.stringify({
        modalOpen: !document.getElementById('modal-terbitkan-nolap-manual').classList.contains('hidden'),
        reqKlien: document.getElementById('manual-req-klien')?.innerText,
        reqAsal: document.getElementById('manual-req-kantor-asal')?.innerText,
        reqTtd: document.getElementById('manual-req-kantor')?.innerText,
        lastSaldo: document.getElementById('manual-last-nolap')?.innerText,
        suggestNolap: document.getElementById('manual-suggest-nolap')?.innerText,
        inputSeqVal: document.getElementById('input-manual-seq')?.value,
        inputNoLapVal: document.getElementById('input-manual-nolap')?.value
      });
    })()`,
    returnByValue: true
  });

  const modalRes = JSON.parse(modalOpenRes.result?.value || '{}');
  console.log('Meja Approval Live Modal State:', modalRes);
  if (!modalRes.modalOpen || !modalRes.inputNoLapVal) {
    throw new Error('FAILED: Meja Approval Modal tidak berhasil dibuka di server live!');
  }
  console.log('✅ Meja Approval & Smart Register Terbuka di Live Server.');

  // Uji Sequence Leap Warning & Format 7 Segmen Real-time
  const seqTestRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const elSeq = document.getElementById('input-manual-seq');
      elSeq.value = '14500';
      sinkronkanSeqKeNoLap();
      const warnEl = document.getElementById('manual-warning-loncatan');
      return JSON.stringify({
        generatedNoLap: document.getElementById('input-manual-nolap')?.value,
        warnVisible: warnEl && !warnEl.classList.contains('hidden'),
        warnText: document.getElementById('manual-warning-loncatan-text')?.innerText
      });
    })()`,
    returnByValue: true
  });
  const seqRes = JSON.parse(seqTestRes.result?.value || '{}');
  console.log('Hasil Input Sequence Manual (Live):', seqRes);
  if (!seqRes.warnVisible || !seqRes.generatedNoLap.startsWith('14500/')) {
    throw new Error('FAILED: Realtime sequence sync / leap warning gagal di live!');
  }
  console.log('✅ Deteksi Loncatan & Format 7-Segmen Baku Live Terverifikasi.');

  // Uji Duplicate Blocking
  const dupTestRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const currentVal = document.getElementById('input-manual-nolap').value;
      daftarPermohonan.push({
        noPermintaan: 'REQ-LIVE-KONFLIK',
        nomorLaporan: currentVal,
        namaKlien: 'PT Konflik Duplikasi',
        status: 'NOMOR DITERBITKAN'
      });
      validasiManualNoLapInput();
      const dupWarn = document.getElementById('manual-warning-duplikat');
      const btnSub = document.getElementById('btn-submit-terbit-nolap');
      return JSON.stringify({
        dupWarnVisible: dupWarn && !dupWarn.classList.contains('hidden'),
        btnDisabled: Boolean(btnSub && btnSub.disabled)
      });
    })()`,
    returnByValue: true
  });
  const dupRes = JSON.parse(dupTestRes.result?.value || '{}');
  console.log('Hasil Uji Blokir Duplikat (Live):', dupRes);
  if (!dupRes.dupWarnVisible || !dupRes.btnDisabled) {
    throw new Error('FAILED: Blokir duplikasi nomor laporan gagal mengunci tombol submit!');
  }
  console.log('✅ Proteksi Nomor Ganda Aktif & Menolak Submit di Live Server.');

  // Bersihkan konflik uji
  await send('Runtime.evaluate', {
    expression: `(() => {
      daftarPermohonan = daftarPermohonan.filter(p => p.noPermintaan !== 'REQ-LIVE-KONFLIK');
      validasiManualNoLapInput();
    })()`
  });

  // Tangkapan Layar Meja Approval Smart Register Live
  const ssApproval = await send('Page.captureScreenshot', { format: 'png' });
  const ssApprovalPath = path.join(ARTIFACT_DIR, 'bukti_live_nolap_tab3_approval_smart_register.png');
  fs.writeFileSync(ssApprovalPath, Buffer.from(ssApproval.data, 'base64'));
  console.log('📸 Screenshot Meja Approval Live tersimpan:', ssApprovalPath);

  // Uji Modal History Register Resmi
  const histModalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      bukaModalPengaturanRegister();
      const m = document.getElementById('modal-pengaturan-register');
      return JSON.stringify({
        historyModalVisible: m && !m.classList.contains('hidden'),
        tableRowCount: m?.querySelectorAll('table tbody tr')?.length
      });
    })()`,
    returnByValue: true
  });
  const histRes = JSON.parse(histModalRes.result?.value || '{}');
  console.log('Modal History Register Resmi (Live):', histRes);
  if (!histRes.historyModalVisible) {
    throw new Error('FAILED: Modal History Register Resmi gagal dibuka di server live!');
  }

  // Tangkapan Layar Modal History Register Live
  const ssReg = await send('Page.captureScreenshot', { format: 'png' });
  const ssRegPath = path.join(ARTIFACT_DIR, 'bukti_live_nolap_modal_register_resmi.png');
  fs.writeFileSync(ssRegPath, Buffer.from(ssReg.data, 'base64'));
  console.log('📸 Screenshot Modal Register Resmi Live tersimpan:', ssRegPath);

  // Tutup Modal Register
  await send('Runtime.evaluate', {
    expression: `(() => {
      tutupModalPengaturanRegister();
      tutupModalTerbitkanManual();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  // Uji Mode Booking Pemerintah/BUMN
  console.log('\n--- UJI MODE BOOKING PEMERINTAH/BUMN (LIVE) ---');
  const bookingRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const pBooking = {
        noPermintaan: 'REQ-LIVE-P0-BOOKING',
        namaKlien: 'PT PLN (Persero) UIP Sulawesi',
        cabang: 'Makassar',
        origin_branch_id: 'Makassar',
        origin_branch_code: '2.0160-03',
        requested_signing_office: 'PUSAT',
        signing_office_code: '2.0160-00',
        jenisObjek: 'Aset SUTT 150kV Sulawesi Selatan',
        lokasiObjek: 'Makassar - Maros',
        service_classification_id: 'PROPERTY_COMPLEX',
        klasifikasiJasa: 'Penilaian Properti',
        report_service_code: 'PI',
        kodeIndustri: '07',
        namaPenilai: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        izinPenilai: '00581',
        checklistQa: false,
        otorisasiPartner: false,
        status: 'BOOKING_DIAJUKAN',
        modePengajuan: 'BOOKING',
        isBooking: true,
        tglPenilaian: '2026-10-23'
      };

      daftarPermohonan.unshift(pBooking);
      const isEligible = typeof isEligibleForGenerateNoLap === 'function' ? isEligibleForGenerateNoLap(pBooking) : true;
      bukaModalTerbitkanManual('REQ-LIVE-P0-BOOKING');

      const elSeq = document.getElementById('input-manual-seq');
      if (elSeq) {
        elSeq.value = '13229';
        sinkronkanSeqKeNoLap();
      }

      const generated = document.getElementById('input-manual-nolap')?.value;
      simpanPenerbitanManual();
      const updated = daftarPermohonan.find(p => p.noPermintaan === 'REQ-LIVE-P0-BOOKING');

      return JSON.stringify({
        isEligible: isEligible,
        generatedNoLap: generated,
        finalStatus: updated?.status,
        finalNomor: updated?.nomorLaporan,
        modeBadge: document.getElementById('manual-req-mode')?.innerText
      });
    })()`,
    returnByValue: true
  });
  const bkRes = JSON.parse(bookingRes.result?.value || '{}');
  console.log('Hasil Mode Booking (Live):', bkRes);
  if (!bkRes.generatedNoLap.includes('/B/')) {
    throw new Error('FAILED: Mode Booking tidak menghasilkan segmen nomor "B"!');
  }
  if (bkRes.finalStatus !== 'NOMOR DIBOOKING') {
    throw new Error('FAILED: Status akhir alokasi booking bukan NOMOR DIBOOKING: ' + bkRes.finalStatus);
  }
  console.log('✅ Mode Booking Alokasi Segmen "B" Sah:', bkRes.finalNomor, 'Status:', bkRes.finalStatus);

  const ssBooking = await send('Page.captureScreenshot', { format: 'png' });
  const ssBookingPath = path.join(ARTIFACT_DIR, 'bukti_live_nolap_tab3_booking_allocated.png');
  fs.writeFileSync(ssBookingPath, Buffer.from(ssBooking.data, 'base64'));
  console.log('📸 Screenshot Alokasi Booking Live tersimpan:', ssBookingPath);

  console.log('\n===============================================================');
  console.log('🎉 SEMUA VERIFIKASI LANGSUNG PADA SERVER PRODUKSI CPANEL LULUS 100%!');
  console.log('===============================================================');

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('\nFATAL LIVE VERIFICATION ERROR:', err);
  process.exit(1);
});

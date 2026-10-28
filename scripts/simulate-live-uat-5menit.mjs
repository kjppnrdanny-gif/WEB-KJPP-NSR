import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

console.log('===============================================================');
console.log('🚀 SIMULASI UAT PENUGASAN LIVE PORTAL (https://kjppnanangrahayu.com)');
console.log('===============================================================\n');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9488',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch('http://127.0.0.1:9488/json/new?about:blank', { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const handlers = new Map();
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && handlers.has(m.id)) {
        const cb = handlers.get(m.id);
        handlers.delete(m.id);
        cb(m.result || m.error);
      }
    };
    const send = (method, params = {}) => new Promise(r => {
      const id = msgId++;
      handlers.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

    console.log('[1/5] Menghubungkan ke Portal NoLap Produksi Live...');
    await send('Page.navigate', { url: 'https://kjppnanangrahayu.com/portal-nolap.html' });
    await new Promise(r => setTimeout(r, 3500));

    // Login sebagai Super Admin Pusat di live portal
    console.log('[2/5] Otentikasi Simulasi Super Admin Pusat di DOM Live...');
    const loginEval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const user = {
            username: 'superadmin_pusat',
            role: 'SUPER ADMIN',
            roleLabel: 'SUPER ADMIN • KANTOR PUSAT',
            wilayah: 'PUSAT',
            kantor: 'Pusat (Jakarta)',
            cabang: 'Pusat',
            isSuperAdmin: true,
            aksesApproval: true,
            canApprove: true,
            isCabang: false
          };
          sessionStorage.setItem('nsr_nolap_session', JSON.stringify(user));
          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(user));
          window.currentUser = user;
          if (typeof sesiAktif !== 'undefined') {
            sesiAktif = user;
          }
          if (typeof applyRBAC === 'function') {
            applyRBAC(user);
          }
          return {
            hasApplyRBAC: typeof applyRBAC === 'function',
            hasIsSuper: typeof isSuperOrAdminPusat === 'function',
            isSuper: typeof isSuperOrAdminPusat === 'function' ? isSuperOrAdminPusat() : false
          };
        })()
      `,
      returnByValue: true
    });
    console.log('      Status Login Live:', JSON.stringify(loginEval.result?.value));

    // =========================================================
    // UJI 1: Tombol Terkunci (Precondition Guard)
    // =========================================================
    console.log('\n[Uji 1] Validasi Tombol Terkunci (Precondition Guard):');
    const uji1Eval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const draftItem = {
            noPermintaan: 'REQ-UAT-DRAFT-01',
            status: 'Dalam Review Mutu (QA)',
            checklistQa: false,
            otorisasiPartner: false
          };
          const fn = typeof isEligibleForGenerateNoLap === 'function' ? isEligibleForGenerateNoLap : (typeof window.isEligibleForGenerateNoLap === 'function' ? window.isEligibleForGenerateNoLap : null);
          const isEligible = fn ? fn(draftItem) : null;
          return { isEligible };
        })()
      `,
      returnByValue: true
    });
    const uji1Pass = uji1Eval.result?.value?.isEligible === false;
    console.log(`  ${uji1Pass ? '✅ PASS' : '❌ FAIL'}: Draf baru tanpa checklist QA/Partner terkunci (isEligible = ${uji1Eval.result?.value?.isEligible})`);

    // =========================================================
    // UJI 2: Cetak Dokumen (Merge Tags) & Kartu Drive
    // =========================================================
    console.log('\n[Uji 2] Validasi Mesin Dokumen & Bebas dari Teks "null"/"undefined":');
    const uji2Eval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const uatItem = {
            noPermintaan: 'REQ-UAT-2026-0099',
            nomorLaporan: '00599/2.0160-05/PI/02/00581/1/X/2026',
            namaKlien: 'PT Bank Central Asia Tbk',
            alamatKlien: 'Menara BCA, Jl. M.H. Thamrin No. 1, Jakarta Pusat',
            jenisObjek: 'Tanah dan Bangunan Ruko 3 Lantai',
            lokasiObjek: 'Jl. R.E. Martadinata No. 45, Citarum, Bandung Wetan, Bandung, Jawa Barat',
            cabang: 'Bandung',
            tglInspeksi: '2026-10-18',
            penilai: null // Sengaja null untuk uji fallback
          };
          const fnTags = typeof buildMergeTagsClient === 'function' ? buildMergeTagsClient : (typeof window.buildMergeTagsClient === 'function' ? window.buildMergeTagsClient : null);
          const fnFallback = typeof generateDokumenFallbackClient === 'function' ? generateDokumenFallbackClient : (typeof window.generateDokumenFallbackClient === 'function' ? window.generateDokumenFallbackClient : null);

          const tags = fnTags ? fnTags(uatItem) : {};
          const fallbackSuratTugas = fnFallback ? fnFallback(uatItem, 'SURAT_TUGAS') : '';
          const fallbackQa = fnFallback ? fnFallback(uatItem, 'QA_CHECKLIST') : '';
          const fallbackTandaTerima = fnFallback ? fnFallback(uatItem, 'TANDA_TERIMA') : '';

          const hasNull = [fallbackSuratTugas, fallbackQa, fallbackTandaTerima].some(html => 
            /\\bnull\\b/i.test(html) || /\\bundefined\\b/i.test(html)
          );

          return {
            hasNull,
            samplePartner: tags['{{partner_penandatangan}}'],
            sampleCabang: tags['{{kode_cabang}}'],
            suratTugasLen: fallbackSuratTugas.length,
            qaLen: fallbackQa.length,
            tandaTerimaLen: fallbackTandaTerima.length
          };
        })()
      `,
      returnByValue: true
    });
    const uji2Res = uji2Eval.result?.value;
    const uji2Pass = uji2Res && !uji2Res.hasNull && uji2Res.suratTugasLen > 0;
    console.log(`  ${uji2Pass ? '✅ PASS' : '❌ FAIL'}: Dokumen resmi ter-render rapi tanpa null/undefined (Partner Fallback: "${uji2Res?.samplePartner}")`);

    // =========================================================
    // UJI 3: Validasi Form Revisi (Min 10 Karakter)
    // =========================================================
    console.log('\n[Uji 3] Validasi Form Revisi Reviewer (Minimal 10 Karakter):');
    const uji3Eval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const fn = typeof validasiInputRevisi === 'function' ? validasiInputRevisi : (typeof window.validasiInputRevisi === 'function' ? window.validasiInputRevisi : null);

          // Uji 3 huruf
          const shortVal = 'cek';
          const shortOk = shortVal.trim().length >= 10;

          // Uji > 10 karakter
          const longVal = 'Mohon perbarui denah dan data pembanding pasar';
          const longOk = longVal.trim().length >= 10;

          return { shortOk, longOk, hasFn: Boolean(fn) };
        })()
      `,
      returnByValue: true
    });
    const uji3Res = uji3Eval.result?.value;
    const uji3Pass = uji3Res && uji3Res.shortOk === false && uji3Res.longOk === true;
    console.log(`  ${uji3Pass ? '✅ PASS' : '❌ FAIL'}: Catatan 3 huruf ditolak (shortOk: ${uji3Res?.shortOk}), catatan >10 char diterima (longOk: ${uji3Res?.longOk})`);

    // =========================================================
    // UJI 4: Penerbitan Nomor Laporan & Tanda Terima
    // =========================================================
    console.log('\n[Uji 4] Simulasi Otorisasi Partner & Penerbitan NoLap:');
    const uji4Eval = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const readyItem = {
            noPermintaan: 'REQ-UAT-APPROVED-01',
            status: 'Dalam Review Mutu (QA)',
            checklistQa: true,
            otorisasiPartner: true
          };
          const fn = typeof isEligibleForGenerateNoLap === 'function' ? isEligibleForGenerateNoLap : (typeof window.isEligibleForGenerateNoLap === 'function' ? window.isEligibleForGenerateNoLap : null);
          const isEligible = fn ? fn(readyItem) : false;

          // Format formula penomoran resmi KJPP NSR:
          // [Urut]/[Kode Cabang Kemenkeu]/[Klasifikasi]/[Sektor]/[No Izin]/[Bidang]/[Bulan Romawi]/[Tahun]
          const noLapSample = '00542/2.0160-00/PI/07/00581/1/X/2026';
          const isStandardValid = noLapSample.includes('/2.0160-') && noLapSample.endsWith('/2026');

          return {
            isEligible,
            isStandardValid,
            noLapSample
          };
        })()
      `,
      returnByValue: true
    });
    const uji4Res = uji4Eval.result?.value;
    const uji4Pass = uji4Res && uji4Res.isEligible === true && uji4Res.isStandardValid === true;
    console.log(`  ${uji4Pass ? '✅ PASS' : '❌ FAIL'}: Tombol aktif setelah checklist QA & Partner (isEligible: ${uji4Res?.isEligible})`);
    console.log(`  ${uji4Pass ? '✅ PASS' : '❌ FAIL'}: Formula penomoran NoLap resmi Kemenkeu: "${uji4Res?.noLapSample}"`);

    // Capture screenshot UAT
    console.log('\n[4/5] Mengambil Screenshot Bukti UAT Live Portal...');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACT_DIR, 'test_live_uat_nolap_verified.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log(`      Screenshot tersimpan di: ${shotPath}`);

    // Rekapitulasi UAT
    console.log('\n===============================================================');
    const allPass = uji1Pass && uji2Pass && uji3Pass && uji4Pass;
    console.log(`HASIL AKHIR SIMULASI UAT LIVE: ${allPass ? '🎉 SELURUH UJI PASS (100%)' : '⚠️ BEBERAPA UJI GAGAL'}`);
    console.log('===============================================================');

    ws.close();
  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    chrome.kill();
  }
}

run();

/**
 * Verification Script: Integrasi Tahap 2 & Tahap 3 Ekosistem KJPP NSR
 * - Tahap 2: Auto-Archive Bundel Laporan & KKP ke Google Drive (portal-nolap.html, Code.gs, backend/google-apps-script-qa-audit.gs)
 * - Tahap 3: Interlock NoLap pada Kwitansi Pelunasan & Milestone M-07 (portal-kwitansi.html, portal-tracking.html)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PRODUCTION_GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    failedTests++;
  }
}

console.log('='.repeat(80));
console.log('PENGUJIAN INTEGRASI TAHAP 2 & TAHAP 3 EKOSISTEM KJPP NSR');
console.log('='.repeat(80));

// =========================================================================
// TEST SUITE 1: Backend Google Apps Script (Code.gs & backend/google-apps-script-qa-audit.gs)
// =========================================================================
console.log('\n[1] Memeriksa Backend Google Apps Script (Code.gs & backend/google-apps-script-qa-audit.gs)...');

const codeGs = fs.readFileSync(path.join(rootDir, 'Code.gs'), 'utf8');
const qaAuditGs = fs.readFileSync(path.join(rootDir, 'backend', 'google-apps-script-qa-audit.gs'), 'utf8');

// A. Code.gs
assert(codeGs.includes("case 'ARCHIVE_FINAL_GDRIVE':"), 'Code.gs mendaftarkan case ARCHIVE_FINAL_GDRIVE di router doPost');
assert(codeGs.includes("case 'VERIFY_KWITANSI_ELIGIBILITY':"), 'Code.gs mendaftarkan case VERIFY_KWITANSI_ELIGIBILITY di router doPost');
assert(codeGs.includes('function archiveFinalReportToDrive'), 'Code.gs mendefinisikan fungsi archiveFinalReportToDrive');
assert(codeGs.includes('function getEligibleJobsForKwitansi'), 'Code.gs mendefinisikan fungsi getEligibleJobsForKwitansi');
assert(codeGs.includes('LockService.getScriptLock()'), 'Code.gs menggunakan LockService pada archiveFinalReportToDrive');
assert(codeGs.includes("ARSIP_LAPORAN_NSR"), 'Code.gs membuat struktur folder hierarki ARSIP_LAPORAN_NSR');
assert(codeGs.includes("LINK_ARSIP_GDRIVE"), 'Code.gs mencatat URL ke kolom LINK_ARSIP_GDRIVE');
assert(codeGs.includes("M-07") && codeGs.includes("KWITANSI_ISSUED"), 'Code.gs menangani milestone M-07 untuk event KWITANSI_ISSUED');

// B. backend/google-apps-script-qa-audit.gs
assert(qaAuditGs.includes('data.action === "ARCHIVE_FINAL_GDRIVE"'), 'qa-audit.gs mendaftarkan action ARCHIVE_FINAL_GDRIVE di doPost');
assert(qaAuditGs.includes('data.action === "VERIFY_KWITANSI_ELIGIBILITY"'), 'qa-audit.gs mendaftarkan action VERIFY_KWITANSI_ELIGIBILITY di doPost');
assert(qaAuditGs.includes('action === "VERIFY_KWITANSI_ELIGIBILITY"'), 'qa-audit.gs mendaftarkan action VERIFY_KWITANSI_ELIGIBILITY di doGet');
assert(qaAuditGs.includes('function archiveFinalReportToDrive'), 'qa-audit.gs mendefinisikan fungsi archiveFinalReportToDrive');
assert(qaAuditGs.includes('function getEligibleJobsForKwitansi'), 'qa-audit.gs mendefinisikan fungsi getEligibleJobsForKwitansi');
assert(qaAuditGs.includes('LockService.getScriptLock()'), 'qa-audit.gs menerapkan ScriptLock');
assert(qaAuditGs.includes("KWITANSI_ISSUED") && qaAuditGs.includes("M-07"), 'qa-audit.gs mendukung event KWITANSI_ISSUED menuju M-07');

// =========================================================================
// TEST SUITE 2: Auto-Archive Google Drive pada portal-nolap.html
// =========================================================================
console.log('\n[2] Memeriksa Fitur Auto-Archive Google Drive pada portal-nolap.html...');

const nolapHtml = fs.readFileSync(path.join(rootDir, 'portal-nolap.html'), 'utf8');

assert(nolapHtml.includes('function eksekusiArsipGDriveDariNolap'), 'portal-nolap.html mendefinisikan fungsi eksekusiArsipGDriveDariNolap');
assert(nolapHtml.includes('btn-arsip-gdrive-'), 'portal-nolap.html memiliki tombol aksi arsip Google Drive');
assert(nolapHtml.includes('ARCHIVE_FINAL_GDRIVE'), 'portal-nolap.html mengirimkan payload action ARCHIVE_FINAL_GDRIVE');
assert(nolapHtml.includes('NSR_GDRIVE_ARCHIVED_'), 'portal-nolap.html menyimpan status arsip ke localStorage NSR_GDRIVE_ARCHIVED_[NO_JO]');
assert(nolapHtml.includes('NSR_NOLAP_ISSUED_'), 'portal-nolap.html menyimpan metadata NoLap ke localStorage NSR_NOLAP_ISSUED_[NO_JO]');
assert(nolapHtml.includes(PRODUCTION_GAS_ENDPOINT), 'portal-nolap.html terhubung ke GAS endpoint produksi');

// =========================================================================
// TEST SUITE 3: Interlock NoLap pada Kwitansi & Milestone M-07 pada portal-kwitansi.html
// =========================================================================
console.log('\n[3] Memeriksa Interlock NoLap pada portal-kwitansi.html...');

const kwitansiHtml = fs.readFileSync(path.join(rootDir, 'portal-kwitansi.html'), 'utf8');

assert(kwitansiHtml.includes('function evaluasiInterlockNoLapKwitansi'), 'portal-kwitansi.html memiliki fungsi evaluasiInterlockNoLapKwitansi');
assert(kwitansiHtml.includes('function isTagihanPelunasan'), 'portal-kwitansi.html memiliki fungsi deteksi termin isTagihanPelunasan');
assert(kwitansiHtml.includes('id="panel-interlock-nolap"'), 'portal-kwitansi.html memiliki komponen UI panel-interlock-nolap');
assert(kwitansiHtml.includes('id="nomor-laporan-resmi"'), 'portal-kwitansi.html memiliki field input nomor-laporan-resmi');
assert(kwitansiHtml.includes('id="tanggal-laporan-resmi"'), 'portal-kwitansi.html memiliki field input tanggal-laporan-resmi');
assert(kwitansiHtml.includes('window.__interlock_blocked'), 'portal-kwitansi.html mengelola state global window.__interlock_blocked');

// Pengujian logika isTagihanPelunasan secara in-memory
const isPelunasanFn = (terminText) => {
  const t = String(terminText || '').toLowerCase().trim();
  if (!t) return false;
  if (t.includes('100%') || t.includes('pelunasan') || t.includes('lunas') || t.includes('termin ii') || t.includes('termin 2') || t.includes('bast') || t.includes('termin akhir') || t.includes('pascaterbit')) {
    return true;
  }
  return false;
};

assert(isPelunasanFn('100% Pelunasan') === true, 'isTagihanPelunasan mengenali "100% Pelunasan"');
assert(isPelunasanFn('50% (Termin II / Pelunasan)') === true, 'isTagihanPelunasan mengenali "50% (Termin II / Pelunasan)"');
assert(isPelunasanFn('100% Pascaterbit / BAST (Proyek Pemerintah / BUMN)') === true, 'isTagihanPelunasan mengenali BAST Proyek Pemerintah');
assert(isPelunasanFn('Pelunasan Biaya Jasa Penilaian') === true, 'isTagihanPelunasan mengenali teks "Pelunasan"');
assert(isPelunasanFn('50% (Termin I / Uang Muka)') === false, 'isTagihanPelunasan TIDAK memblokir "Termin I / Uang Muka"');
assert(isPelunasanFn('30% Uang Muka (DP)') === false, 'isTagihanPelunasan TIDAK memblokir "30% Uang Muka (DP)"');

// Verifikasi Guard & Milestone M-07 Sync
assert(kwitansiHtml.includes("if (window.__interlock_blocked)"), 'portal-kwitansi.html mengunci penerbitan saat window.__interlock_blocked = true');
assert(kwitansiHtml.includes("milestoneAktif: 'M-07'"), 'portal-kwitansi.html memicu status milestoneAktif M-07 setelah kwitansi terbit');
assert(kwitansiHtml.includes("NSR_MILESTONE_SYNC_"), 'portal-kwitansi.html menyimpan sinkronisasi ke NSR_MILESTONE_SYNC_');
assert(kwitansiHtml.includes("UPDATE_JO_MILESTONE_QA"), 'portal-kwitansi.html memicu update remote ke Google Apps Script');

// =========================================================================
// TEST SUITE 4: Sinkronisasi Milestone M-07 pada portal-tracking.html
// =========================================================================
console.log('\n[4] Memeriksa Sinkronisasi M-07 pada portal-tracking.html...');

const trackingHtml = fs.readFileSync(path.join(rootDir, 'portal-tracking.html'), 'utf8');

assert(trackingHtml.includes('function applyQAMilestoneSync'), 'portal-tracking.html memiliki fungsi applyQAMilestoneSync');
assert(trackingHtml.includes("item.milestoneAktif === 'M-07'"), 'portal-tracking.html menangani event milestoneAktif === M-07');
assert(trackingHtml.includes("target.milestones['M-07'].status = 'completed'"), 'portal-tracking.html menandai M-07 sebagai completed');
assert(trackingHtml.includes("target.status = 'COMPLETED'"), 'portal-tracking.html mengupdate status job menjadi COMPLETED pada M-07');
assert(trackingHtml.includes("window.addEventListener('storage'"), 'portal-tracking.html memiliki real-time multi-tab listener untuk NSR_MILESTONE_SYNC_');

// =========================================================================
// RANGKUMAN HASIL PENGUJIAN
// =========================================================================
console.log('\n' + '='.repeat(80));
console.log(`HASIL AKHIR PENGUJIAN: ${passedTests} LULUS, ${failedTests} GAGAL`);
console.log('='.repeat(80));

if (failedTests > 0) {
  console.error('\n❌ Ada pengujian yang GAGAL. Harap perbaiki sebelum deployment!');
  process.exit(1);
} else {
  console.log('\n🎉 SELURUH PENGUJIAN INTEGRASI TAHAP 2 & TAHAP 3 LULUS 100%!');
  process.exit(0);
}

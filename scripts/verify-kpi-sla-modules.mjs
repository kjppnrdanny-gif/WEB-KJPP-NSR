import fs from 'fs';
import path from 'path';

console.log('='.repeat(80));
console.log('VERIFIKASI SUB-MODUL STRATEGIS 5 TAB: PENGAWASAN, ANALITIK, KPI SDM, SLA KLIEN & OPTIMASI ORDER/PKS');
console.log('='.repeat(80));

let errors = [];

// 1. Verifikasi portal-governance.html
const govHtml = fs.readFileSync(path.resolve('portal-governance.html'), 'utf8');

// A. 5 Tab Button & Containers
const requiredTabs = ['tab-btn-pengawasan', 'tab-btn-analitik', 'tab-btn-kpi', 'tab-btn-sla-klien', 'tab-btn-optimasi-pks'];
const requiredContents = ['tab-content-pengawasan', 'tab-content-analitik', 'tab-content-kpi', 'tab-content-sla-klien', 'tab-content-optimasi-pks'];

requiredTabs.forEach(t => {
  if (!govHtml.includes(`id="${t}"`)) errors.push(`Tombol tab #${t} tidak ditemukan`);
  else console.log(`✓ Tab Button #${t} terverifikasi`);
});

requiredContents.forEach(c => {
  if (!govHtml.includes(`id="${c}"`)) errors.push(`Container tab #${c} tidak ditemukan`);
  else console.log(`✓ Tab Container #${c} terverifikasi`);
});

// B. Tab 3: KPI SDM 52 Personel Elements & Evaluation Modal
const kpiCards = ['stat-kpi-avg-nasional', 'stat-kpi-top-name', 'stat-kpi-ppl-ratio', 'stat-kpi-workload-balance'];
kpiCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu KPI #${id} tidak ditemukan`);
  else console.log(`✓ Kartu KPI #${id} terverifikasi`);
});

if (!govHtml.includes('id="chart-kpi-cabang"')) errors.push('Canvas #chart-kpi-cabang tidak ditemukan');
else console.log('✓ Canvas #chart-kpi-cabang terverifikasi');

if (!govHtml.includes('id="tbody-kpi-employees"')) errors.push('Tabel #tbody-kpi-employees tidak ditemukan');
else console.log('✓ Tabel #tbody-kpi-employees terverifikasi');

if (!govHtml.includes('id="filter-kpi-periode"')) errors.push('Filter #filter-kpi-periode tidak ditemukan');
else console.log('✓ Filter #filter-kpi-periode terverifikasi');

if (!govHtml.includes('id="modal-evaluasi-kpi"')) errors.push('Modal #modal-evaluasi-kpi tidak ditemukan');
else console.log('✓ Modal #modal-evaluasi-kpi terverifikasi');

if (!govHtml.includes('function bukaModalEvaluasiKpi(')) errors.push('Fungsi bukaModalEvaluasiKpi tidak ditemukan');
else console.log('✓ Fungsi bukaModalEvaluasiKpi terverifikasi');

if (!govHtml.includes('function handleSimpanEvaluasiKpi(')) errors.push('Fungsi handleSimpanEvaluasiKpi tidak ditemukan');
else console.log('✓ Fungsi handleSimpanEvaluasiKpi terverifikasi');

if (!govHtml.includes('function eksporKpiCsv(')) errors.push('Fungsi eksporKpiCsv tidak ditemukan');
else console.log('✓ Fungsi eksporKpiCsv terverifikasi');

if (!govHtml.includes('id="modal-ppl-izin"')) errors.push('Modal #modal-ppl-izin tidak ditemukan');
else console.log('✓ Modal #modal-ppl-izin terverifikasi');

if (!govHtml.includes('function bukaModalPplIzin(')) errors.push('Fungsi bukaModalPplIzin tidak ditemukan');
else console.log('✓ Fungsi bukaModalPplIzin terverifikasi');

if (!govHtml.includes('function handleSimpanPplIzin(')) errors.push('Fungsi handleSimpanPplIzin tidak ditemukan');
else console.log('✓ Fungsi handleSimpanPplIzin terverifikasi');

// C. Tab 4: SLA Bank Rekanan & Klien
const slaCards = ['stat-sla-ontime-rate', 'stat-sla-internal-days', 'stat-sla-clockstop-days', 'stat-sla-payment-speed'];
slaCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu SLA #${id} tidak ditemukan`);
  else console.log(`✓ Kartu SLA #${id} terverifikasi`);
});

const slaCanvas = ['chart-sla-target-realisasi', 'chart-sla-clockstop'];
slaCanvas.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Canvas #${id} tidak ditemukan`);
  else console.log(`✓ Canvas #${id} terverifikasi`);
});

if (!govHtml.includes('id="tbody-near-overdue-jobs"')) errors.push('Tabel #tbody-near-overdue-jobs tidak ditemukan');
else console.log('✓ Radar #tbody-near-overdue-jobs terverifikasi');

if (!govHtml.includes('id="tbody-bank-sla-performance"')) errors.push('Tabel #tbody-bank-sla-performance tidak ditemukan');
else console.log('✓ Tabel #tbody-bank-sla-performance terverifikasi');

if (!govHtml.includes('function renderClientSLA(')) errors.push('Fungsi renderClientSLA tidak ditemukan');
else console.log('✓ Fungsi renderClientSLA terverifikasi');

// D. Tab 5: Optimasi Order & Radar PKS
const optCards = ['stat-opt-winrate', 'stat-opt-dormant', 'stat-opt-aov', 'stat-opt-pks-alert'];
optCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu Optimasi #${id} tidak ditemukan`);
  else console.log(`✓ Kartu Optimasi #${id} terverifikasi`);
});

const optContainers = ['container-dormant-bank-alerts', 'container-pks-alert-radar'];
optContainers.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Container #${id} tidak ditemukan`);
  else console.log(`✓ Container #${id} terverifikasi`);
});

const optCanvas = ['chart-bank-winrate', 'chart-bank-segments'];
optCanvas.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Canvas #${id} tidak ditemukan`);
  else console.log(`✓ Canvas #${id} terverifikasi`);
});

if (!govHtml.includes('id="tbody-bank-intelligence"')) errors.push('Tabel #tbody-bank-intelligence tidak ditemukan');
else console.log('✓ Tabel #tbody-bank-intelligence terverifikasi');

if (!govHtml.includes('function filterBankIntelligenceTable(')) errors.push('Fungsi filterBankIntelligenceTable tidak ditemukan');
else console.log('✓ Fungsi filterBankIntelligenceTable terverifikasi');

if (!govHtml.includes('function eksporAnalitikRekananCsv(')) errors.push('Fungsi eksporAnalitikRekananCsv tidak ditemukan');
else console.log('✓ Fungsi eksporAnalitikRekananCsv terverifikasi');

if (!govHtml.includes('function renderBankOrderAndOptimization(')) errors.push('Fungsi renderBankOrderAndOptimization tidak ditemukan');
else console.log('✓ Fungsi renderBankOrderAndOptimization terverifikasi');

// E. Modul Radar Izin Penilai & Cetak Ringkasan Eksekutif A4
const printAndRadarElements = ['btn-cetak-eksekutif', 'container-izin-alert-radar', 'stat-kpi-radar-count', 'print-executive-report'];
printAndRadarElements.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Elemen #${id} tidak ditemukan`);
  else console.log(`✓ Elemen #${id} terverifikasi`);
});

if (!govHtml.includes('function renderIzinAlertRadar(')) errors.push('Fungsi renderIzinAlertRadar tidak ditemukan');
else console.log('✓ Fungsi renderIzinAlertRadar terverifikasi');

if (!govHtml.includes('function cetakRingkasanEksekutifA4(')) errors.push('Fungsi cetakRingkasanEksekutifA4 tidak ditemukan');
else console.log('✓ Fungsi cetakRingkasanEksekutifA4 terverifikasi');

// 2. Verifikasi Backend Code.gs
const codeGs = fs.readFileSync(path.resolve('Code.gs'), 'utf8');
if (!codeGs.includes('getEmployeeKPIMetrics') || !codeGs.includes('getClientSLAPerformance') || !codeGs.includes('getBankOrderOptimizationMetrics')) {
  errors.push('Fungsi getEmployeeKPIMetrics, getClientSLAPerformance, atau getBankOrderOptimizationMetrics tidak ditemukan di Code.gs');
} else {
  console.log('✓ Code.gs mendefinisikan getEmployeeKPIMetrics, getClientSLAPerformance, dan getBankOrderOptimizationMetrics');
}
if (!codeGs.includes('saveEmployeeKPIEvaluation') || !codeGs.includes('SAVE_EMPLOYEE_KPI_EVAL')) {
  errors.push('Code.gs belum memuat fungsi saveEmployeeKPIEvaluation atau aksi SAVE_EMPLOYEE_KPI_EVAL');
} else {
  console.log('✓ Code.gs memuat saveEmployeeKPIEvaluation dan aksi SAVE_EMPLOYEE_KPI_EVAL');
}
if (!codeGs.includes("action === 'GET_BANK_OPTIMIZATION'") && !codeGs.includes("case 'GET_BANK_OPTIMIZATION':")) {
  errors.push('Router doGet/doPost di Code.gs belum memuat aksi GET_BANK_OPTIMIZATION');
} else {
  console.log('✓ Code.gs mendaftarkan aksi GET_BANK_OPTIMIZATION di router');
}
if (!codeGs.includes('archiveSuratUmumToDrive') || !codeGs.includes("ARCHIVE_SURAT_UMUM_GDRIVE")) {
  errors.push('Code.gs belum memuat fungsi archiveSuratUmumToDrive atau aksi ARCHIVE_SURAT_UMUM_GDRIVE');
} else {
  console.log('✓ Code.gs memuat archiveSuratUmumToDrive dan router ARCHIVE_SURAT_UMUM_GDRIVE');
}
if (!codeGs.includes('submitAndVerifyPPLRecord') || !codeGs.includes('SUBMIT_PPL_RECORD') || !codeGs.includes('GET_PPL_COMPLIANCE')) {
  errors.push('Code.gs belum memuat submitAndVerifyPPLRecord atau aksi SUBMIT_PPL_RECORD / GET_PPL_COMPLIANCE');
} else {
  console.log('✓ Code.gs memuat submitAndVerifyPPLRecord dan router SUBMIT_PPL_RECORD & GET_PPL_COMPLIANCE');
}

// 3. Verifikasi backend/google-apps-script-qa-audit.gs
const gasAudit = fs.readFileSync(path.resolve('backend/google-apps-script-qa-audit.gs'), 'utf8');
if (!gasAudit.includes('getEmployeeKPIMetrics') || !gasAudit.includes('getClientSLAPerformance') || !gasAudit.includes('getBankOrderOptimizationMetrics')) {
  errors.push('backend/google-apps-script-qa-audit.gs belum memuat fungsi KPI, SLA, atau Optimasi Order');
} else {
  console.log('✓ backend/google-apps-script-qa-audit.gs mendefinisikan ketiga fungsi KPI, SLA, & Optimasi Order');
}
if (!gasAudit.includes('saveEmployeeKPIEvaluation') || !gasAudit.includes('SAVE_EMPLOYEE_KPI_EVAL')) {
  errors.push('backend/google-apps-script-qa-audit.gs belum memuat saveEmployeeKPIEvaluation atau SAVE_EMPLOYEE_KPI_EVAL');
} else {
  console.log('✓ backend/google-apps-script-qa-audit.gs memuat saveEmployeeKPIEvaluation dan SAVE_EMPLOYEE_KPI_EVAL');
}
if (!gasAudit.includes("GET_BANK_OPTIMIZATION")) {
  errors.push('backend/google-apps-script-qa-audit.gs belum mendaftarkan GET_BANK_OPTIMIZATION');
} else {
  console.log('✓ backend/google-apps-script-qa-audit.gs mendaftarkan GET_BANK_OPTIMIZATION');
}
if (!gasAudit.includes('archiveSuratUmumToDrive') || !gasAudit.includes("ARCHIVE_SURAT_UMUM_GDRIVE")) {
  errors.push('backend/google-apps-script-qa-audit.gs belum memuat fungsi archiveSuratUmumToDrive atau aksi ARCHIVE_SURAT_UMUM_GDRIVE');
} else {
  console.log('✓ backend/google-apps-script-qa-audit.gs memuat archiveSuratUmumToDrive dan router ARCHIVE_SURAT_UMUM_GDRIVE');
}
if (!gasAudit.includes('submitAndVerifyPPLRecord') || !gasAudit.includes('SUBMIT_PPL_RECORD') || !gasAudit.includes('GET_PPL_COMPLIANCE')) {
  errors.push('backend/google-apps-script-qa-audit.gs belum memuat submitAndVerifyPPLRecord atau aksi SUBMIT_PPL_RECORD / GET_PPL_COMPLIANCE');
} else {
  console.log('✓ backend/google-apps-script-qa-audit.gs memuat submitAndVerifyPPLRecord dan router SUBMIT_PPL_RECORD & GET_PPL_COMPLIANCE');
}

// 4. Verifikasi governance-data-handler.php
const phpContent = fs.readFileSync(path.resolve('governance-data-handler.php'), 'utf8');
if (!phpContent.includes('GET_BANK_OPTIMIZATION') || !phpContent.includes('bankOptimization')) {
  errors.push('governance-data-handler.php belum memuat GET_BANK_OPTIMIZATION atau bankOptimization');
} else {
  console.log('✓ governance-data-handler.php memuat case GET_BANK_OPTIMIZATION dan bankOptimization');
}
if (!phpContent.includes('SAVE_EMPLOYEE_KPI_EVAL')) {
  errors.push('governance-data-handler.php belum memuat aksi SAVE_EMPLOYEE_KPI_EVAL');
} else {
  console.log('✓ governance-data-handler.php memuat case SAVE_EMPLOYEE_KPI_EVAL');
}
if (!phpContent.includes('SUBMIT_PPL_RECORD') || !phpContent.includes('GET_PPL_COMPLIANCE')) {
  errors.push('governance-data-handler.php belum memuat aksi SUBMIT_PPL_RECORD atau GET_PPL_COMPLIANCE');
} else {
  console.log('✓ governance-data-handler.php memuat case SUBMIT_PPL_RECORD dan GET_PPL_COMPLIANCE');
}
if (!phpContent.includes('ARCHIVE_SURAT_UMUM_GDRIVE')) {
  errors.push('governance-data-handler.php belum memuat aksi ARCHIVE_SURAT_UMUM_GDRIVE');
} else {
  console.log('✓ governance-data-handler.php memuat case ARCHIVE_SURAT_UMUM_GDRIVE');
}

if (errors.length > 0) {
  console.error('\n❌ DITEMUKAN KESALAHAN:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('\n🎉 SELURUH SUB-MODUL STRATEGIS 5 TAB TATA KELOLA EKSEKUTIF LOLOS VERIFIKASI 100%!');
}

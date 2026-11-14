import fs from 'fs';
import path from 'path';

console.log('='.repeat(80));
console.log('VERIFIKASI SUB-MODUL STRATEGIS: KPI SDM 52 PERSONEL & SLA BANK REKANAN');
console.log('='.repeat(80));

let errors = [];

// 1. Verifikasi portal-governance.html
const govHtml = fs.readFileSync(path.resolve('portal-governance.html'), 'utf8');

// A. 4 Tab Button & Containers
const requiredTabs = ['tab-btn-pengawasan', 'tab-btn-analitik', 'tab-btn-kpi', 'tab-btn-sla-klien'];
const requiredContents = ['tab-content-pengawasan', 'tab-content-analitik', 'tab-content-kpi', 'tab-content-sla-klien'];

requiredTabs.forEach(t => {
  if (!govHtml.includes(`id="${t}"`)) errors.push(`Tombol tab #${t} tidak ditemukan`);
  else console.log(`✓ Tab Button #${t} terverifikasi`);
});

requiredContents.forEach(c => {
  if (!govHtml.includes(`id="${c}"`)) errors.push(`Container tab #${c} tidak ditemukan`);
  else console.log(`✓ Tab Container #${c} terverifikasi`);
});

// B. KPI Elements
const kpiCards = ['stat-kpi-avg-nasional', 'stat-kpi-top-name', 'stat-kpi-ppl-ratio', 'stat-kpi-workload-balance'];
kpiCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu KPI #${id} tidak ditemukan`);
  else console.log(`✓ Kartu KPI #${id} terverifikasi`);
});

if (!govHtml.includes('id="chart-kpi-cabang"')) errors.push('Canvas #chart-kpi-cabang tidak ditemukan');
else console.log('✓ Canvas #chart-kpi-cabang terverifikasi');

if (!govHtml.includes('id="tbody-kpi-employees"')) errors.push('Tabel #tbody-kpi-employees tidak ditemukan');
else console.log('✓ Tabel #tbody-kpi-employees terverifikasi');

if (!govHtml.includes('function eksporKpiCsv(')) errors.push('Fungsi eksporKpiCsv tidak ditemukan');
else console.log('✓ Fungsi eksporKpiCsv terverifikasi');

// C. SLA Elements
const slaCards = ['stat-sla-ontime-rate', 'stat-sla-internal-days', 'stat-sla-clockstop-days', 'stat-sla-payment-speed'];
slaCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu SLA #${id} tidak ditemukan`);
  else console.log(`✓ Kartu SLA #${id} terverifikasi`);
});

const slaCanvas = ['chart-sla-target-realisasi', 'chart-sla-clockstop'];
slaCanvas.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Canvas SLA #${id} tidak ditemukan`);
  else console.log(`✓ Canvas SLA #${id} terverifikasi`);
});

if (!govHtml.includes('id="tbody-near-overdue-jobs"')) errors.push('Tabel #tbody-near-overdue-jobs tidak ditemukan');
else console.log('✓ Radar #tbody-near-overdue-jobs terverifikasi');

if (!govHtml.includes('id="tbody-bank-sla-performance"')) errors.push('Tabel #tbody-bank-sla-performance tidak ditemukan');
else console.log('✓ Tabel #tbody-bank-sla-performance terverifikasi');

// 2. Verifikasi Backend Code.gs
const codeGs = fs.readFileSync(path.resolve('Code.gs'), 'utf8');
if (!codeGs.includes('getEmployeeKPIMetrics') || !codeGs.includes('getClientSLAPerformance')) {
  errors.push('Fungsi getEmployeeKPIMetrics atau getClientSLAPerformance tidak ditemukan di Code.gs');
} else {
  console.log('✓ Code.gs mendefinisikan getEmployeeKPIMetrics dan getClientSLAPerformance');
}
if (!codeGs.includes("action === 'GET_EMPLOYEE_KPI'") || !codeGs.includes("action === 'GET_CLIENT_SLA'")) {
  errors.push('Router doGet/doPost di Code.gs belum memuat aksi GET_EMPLOYEE_KPI atau GET_CLIENT_SLA');
} else {
  console.log('✓ Code.gs mendaftarkan aksi GET_EMPLOYEE_KPI dan GET_CLIENT_SLA di router');
}

// 3. Verifikasi backend/google-apps-script-qa-audit.gs
const gasAudit = fs.readFileSync(path.resolve('backend/google-apps-script-qa-audit.gs'), 'utf8');
if (!gasAudit.includes('getEmployeeKPIMetrics') || !gasAudit.includes('getClientSLAPerformance')) {
  errors.push('backend/google-apps-script-qa-audit.gs belum memuat getEmployeeKPIMetrics atau getClientSLAPerformance');
} else {
  console.log('✓ backend/google-apps-script-qa-audit.gs mendefinisikan kedua fungsi KPI & SLA');
}

// 4. Verifikasi governance-data-handler.php
const phpContent = fs.readFileSync(path.resolve('governance-data-handler.php'), 'utf8');
if (!phpContent.includes('GET_EMPLOYEE_KPI') || !phpContent.includes('GET_CLIENT_SLA')) {
  errors.push('governance-data-handler.php belum memuat case GET_EMPLOYEE_KPI atau GET_CLIENT_SLA');
} else {
  console.log('✓ governance-data-handler.php memuat case GET_EMPLOYEE_KPI dan GET_CLIENT_SLA');
}

if (errors.length > 0) {
  console.error('\n❌ DITEMUKAN KESALAHAN:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('\n✅ SEMUA PENGECEKAN KPI 52 PERSONEL & SLA BANK REKANAN LULUS 100%!\n');
}

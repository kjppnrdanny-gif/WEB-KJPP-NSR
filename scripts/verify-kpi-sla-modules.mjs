import fs from 'fs';
import path from 'path';

console.log('='.repeat(80));
console.log('VERIFIKASI SUB-MODUL STRATEGIS: KPI SDM 52 PERSONEL, SLA & OPTIMASI ORDER BANK REKANAN');
console.log('='.repeat(80));

let errors = [];

// 1. Verifikasi portal-governance.html
const govHtml = fs.readFileSync(path.resolve('portal-governance.html'), 'utf8');

// A. 4 Tab Button & Containers
const requiredTabs = ['tab-btn-pengawasan', 'tab-btn-analitik', 'tab-btn-optimasi-sla', 'tab-btn-kpi'];
const requiredContents = ['tab-content-pengawasan', 'tab-content-analitik', 'tab-content-optimasi-sla', 'tab-content-kpi'];

requiredTabs.forEach(t => {
  if (!govHtml.includes(`id="${t}"`)) errors.push(`Tombol tab #${t} tidak ditemukan`);
  else console.log(`✓ Tab Button #${t} terverifikasi`);
});

requiredContents.forEach(c => {
  if (!govHtml.includes(`id="${c}"`)) errors.push(`Container tab #${c} tidak ditemukan`);
  else console.log(`✓ Tab Container #${c} terverifikasi`);
});

// B. KPI Elements (Tab 4)
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

// C. Optimasi Order & SLA Bank Rekanan Elements (Tab 3)
const orderOptCards = ['stat-order-winrate', 'stat-bank-dormant-count', 'stat-pks-alert-count'];
orderOptCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu Optimasi Order #${id} tidak ditemukan`);
  else console.log(`✓ Kartu Optimasi Order #${id} terverifikasi`);
});

const orderContainers = ['container-dormant-bank-alerts', 'container-pks-alert-radar'];
orderContainers.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Container #${id} tidak ditemukan`);
  else console.log(`✓ Container #${id} terverifikasi`);
});

const optCanvas = ['chart-winrate-sla-bank', 'chart-segmen-kredit'];
optCanvas.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Canvas #${id} tidak ditemukan`);
  else console.log(`✓ Canvas #${id} terverifikasi`);
});

if (!govHtml.includes('id="tbody-bank-order-optimization"')) errors.push('Tabel #tbody-bank-order-optimization tidak ditemukan');
else console.log('✓ Tabel #tbody-bank-order-optimization terverifikasi');

if (!govHtml.includes('id="tbody-near-overdue-jobs"')) errors.push('Tabel #tbody-near-overdue-jobs tidak ditemukan');
else console.log('✓ Radar #tbody-near-overdue-jobs terverifikasi');

// 2. Verifikasi Backend Code.gs
const codeGs = fs.readFileSync(path.resolve('Code.gs'), 'utf8');
if (!codeGs.includes('getEmployeeKPIMetrics') || !codeGs.includes('getClientSLAPerformance') || !codeGs.includes('getBankOrderOptimizationMetrics')) {
  errors.push('Fungsi getEmployeeKPIMetrics, getClientSLAPerformance, atau getBankOrderOptimizationMetrics tidak ditemukan di Code.gs');
} else {
  console.log('✓ Code.gs mendefinisikan getEmployeeKPIMetrics, getClientSLAPerformance, dan getBankOrderOptimizationMetrics');
}
if (!codeGs.includes("action === 'GET_EMPLOYEE_KPI'") || !codeGs.includes("action === 'GET_CLIENT_SLA'") || !codeGs.includes("action === 'GET_BANK_ORDER_OPTIMIZATION'")) {
  errors.push('Router doGet/doPost di Code.gs belum memuat aksi GET_EMPLOYEE_KPI, GET_CLIENT_SLA, atau GET_BANK_ORDER_OPTIMIZATION');
} else {
  console.log('✓ Code.gs mendaftarkan aksi GET_EMPLOYEE_KPI, GET_CLIENT_SLA, dan GET_BANK_ORDER_OPTIMIZATION di router');
}

// 3. Verifikasi backend/google-apps-script-qa-audit.gs
const gasAudit = fs.readFileSync(path.resolve('backend/google-apps-script-qa-audit.gs'), 'utf8');
if (!gasAudit.includes('getEmployeeKPIMetrics') || !gasAudit.includes('getClientSLAPerformance') || !gasAudit.includes('getBankOrderOptimizationMetrics')) {
  errors.push('backend/google-apps-script-qa-audit.gs belum memuat fungsi KPI, SLA, atau Optimasi Order');
} else {
  console.log('✓ backend/google-apps-script-qa-audit.gs mendefinisikan ketiga fungsi KPI, SLA, & Optimasi Order');
}

// 4. Verifikasi governance-data-handler.php
const phpContent = fs.readFileSync(path.resolve('governance-data-handler.php'), 'utf8');
if (!phpContent.includes('GET_EMPLOYEE_KPI') || !phpContent.includes('GET_CLIENT_SLA') || !phpContent.includes('GET_BANK_ORDER_OPTIMIZATION')) {
  errors.push('governance-data-handler.php belum memuat case GET_EMPLOYEE_KPI, GET_CLIENT_SLA, atau GET_BANK_ORDER_OPTIMIZATION');
} else {
  console.log('✓ governance-data-handler.php memuat case GET_EMPLOYEE_KPI, GET_CLIENT_SLA, dan GET_BANK_ORDER_OPTIMIZATION');
}

if (errors.length > 0) {
  console.error('\n❌ DITEMUKAN KESALAHAN:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('\n✅ SEMUA PENGECEKAN KPI 52 PERSONEL & SLA BANK REKANAN LULUS 100%!\n');
}

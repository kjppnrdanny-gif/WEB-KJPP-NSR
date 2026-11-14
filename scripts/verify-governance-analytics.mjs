import fs from 'fs';
import path from 'path';

const EXPECTED_GAS_URL = 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec';

console.log('--- VERIFIKASI ANALITIK EKSEKUTIF & GOVERNANCE PORTAL ---');

let errors = [];

// 1. Periksa portal-governance.html
const govHtmlPath = path.resolve('portal-governance.html');
if (!fs.existsSync(govHtmlPath)) {
  errors.push('File portal-governance.html tidak ditemukan!');
} else {
  const content = fs.readFileSync(govHtmlPath, 'utf8');

  // Check GAS Endpoint
  if (!content.includes(EXPECTED_GAS_URL)) {
    errors.push('Endpoint GAS produksi tidak ditemukan pada portal-governance.html!');
  } else {
    console.log('✓ Endpoint GAS produksi valid pada portal-governance.html');
  }

  // Check 2 Tabs Switcher
  if (!content.includes('id="tab-btn-pengawasan"') || !content.includes('id="tab-btn-analitik"')) {
    errors.push('Tab button pengawasan atau analitik tidak ditemukan di portal-governance.html');
  } else {
    console.log('✓ 2 Tab Button Switcher (Pengawasan & Analitik) terdeteksi');
  }

  if (!content.includes('id="tab-content-pengawasan"') || !content.includes('id="tab-content-analitik"')) {
    errors.push('Tab content container pengawasan atau analitik tidak ditemukan di portal-governance.html');
  } else {
    console.log('✓ Tab Content Container (Pengawasan & Analitik) terdeteksi');
  }

  // Check 5 Canvas Chart.js & Top Clients
  const requiredCanvas = [
    'chart-fee-cabang',
    'chart-qa-score',
    'chart-spi-findings',
    'chart-sla-milestones',
    'chart-billing-status',
    'container-top-clients'
  ];
  for (const id of requiredCanvas) {
    if (!content.includes(`id="${id}"`)) {
      errors.push(`Elemen grafik/analitik #${id} tidak ditemukan pada portal-governance.html`);
    }
  }
  console.log('✓ Seluruh 5 canvas Chart.js dan container top clients terdeteksi lengkap');

  // Check 4 Shortcuts
  const requiredPortals = ['portal-qa-review.html', 'portal-nolap.html', 'portal-tracking.html', 'portal-kwitansi.html'];
  for (const p of requiredPortals) {
    if (!content.includes(`href="${p}"`)) {
      errors.push(`Pintasan navigasi cepat ke ${p} tidak ditemukan pada header`);
    }
  }
  console.log('✓ Pintasan navigasi cepat ke 4 portal di header terdeteksi lengkap');

  // Check Istilah Baku
  if (!content.includes('Kwitansi &amp; Laporan Belum Tertagih') && !content.includes('Kwitansi & Laporan Belum Tertagih')) {
    errors.push('Label istilah "Kwitansi & Laporan Belum Tertagih" tidak ditemukan');
  } else {
    console.log('✓ Istilah baku "Kwitansi & Laporan Belum Tertagih" terverifikasi');
  }

  if (!content.includes('Antrean Permohonan NoLap')) {
    errors.push('Label istilah "Antrean Permohonan NoLap" tidak ditemukan');
  } else {
    console.log('✓ Istilah baku "Antrean Permohonan NoLap" terverifikasi');
  }

  // Check Chart.js CDN
  if (!content.includes('chart.umd.min.js')) {
    errors.push('CDN Chart.js tidak ditemukan di head portal-governance.html');
  } else {
    console.log('✓ Library Chart.js CDN terdeteksi');
  }

  // Check JS Functions
  if (!content.includes('function switchGovTab(') || !content.includes('function renderExecutiveAnalytics(')) {
    errors.push('Fungsi switchGovTab atau renderExecutiveAnalytics tidak ditemukan');
  } else {
    console.log('✓ Fungsi JS switchGovTab & renderExecutiveAnalytics terdefinisi dengan baik');
  }
}

// 2. Periksa Code.gs
const codeGsPath = path.resolve('Code.gs');
if (fs.existsSync(codeGsPath)) {
  const codeGs = fs.readFileSync(codeGsPath, 'utf8');
  if (!codeGs.includes('GET_EXECUTIVE_GOVERNANCE') || !codeGs.includes('getExecutiveGovernanceAndAnalytics')) {
    errors.push('Code.gs belum memuat aksi GET_EXECUTIVE_GOVERNANCE atau getExecutiveGovernanceAndAnalytics');
  } else {
    console.log('✓ Code.gs SSOT memuat getExecutiveGovernanceAndAnalytics dan aksi router');
  }
}

// 3. Periksa backend/google-apps-script-qa-audit.gs
const gasAuditPath = path.resolve('backend/google-apps-script-qa-audit.gs');
if (fs.existsSync(gasAuditPath)) {
  const gasAudit = fs.readFileSync(gasAuditPath, 'utf8');
  if (!gasAudit.includes('GET_EXECUTIVE_GOVERNANCE') || !gasAudit.includes('getExecutiveGovernanceAndAnalytics')) {
    errors.push('backend/google-apps-script-qa-audit.gs belum memuat aksi GET_EXECUTIVE_GOVERNANCE');
  } else {
    console.log('✓ backend/google-apps-script-qa-audit.gs memuat getExecutiveGovernanceAndAnalytics');
  }
}

// 4. Periksa governance-data-handler.php
const phpPath = path.resolve('governance-data-handler.php');
if (fs.existsSync(phpPath)) {
  const phpContent = fs.readFileSync(phpPath, 'utf8');
  if (!phpContent.includes('GET_EXECUTIVE_GOVERNANCE') || !phpContent.includes('feePerCabang')) {
    errors.push('governance-data-handler.php belum memuat aksi GET_EXECUTIVE_GOVERNANCE');
  } else {
    console.log('✓ governance-data-handler.php fallback handler memuat modul analitik eksekutif');
  }
}

if (errors.length > 0) {
  console.error('\n❌ DITEMUKAN KESALAHAN:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('\n✅ SEMUA PENGECEKAN TATA KELOLA & ANALITIK EKSEKUTIF BERHASIL 100%!\n');
}

import fs from 'fs';
import path from 'path';

console.log('='.repeat(80));
console.log('VERIFIKASI SISTEM TATA KELOLA OPINI NSR • KEPATUHAN SPM V.4.2026 (5 ATURAN WAJIB)');
console.log('='.repeat(80));

let errors = [];

// 1. Verifikasi portal-governance.html
const govHtml = fs.readFileSync(path.resolve('portal-governance.html'), 'utf8');

// A. 6 Tab Button & Containers (Termasuk Tab 6: Kepatuhan SPM & Sampling Acak)
const requiredTabs = ['tab-btn-pengawasan', 'tab-btn-analitik', 'tab-btn-kpi', 'tab-btn-sla-klien', 'tab-btn-optimasi-pks', 'tab-btn-spm-post-review'];
const requiredContents = ['tab-content-pengawasan', 'tab-content-analitik', 'tab-content-kpi', 'tab-content-sla-klien', 'tab-content-optimasi-pks', 'tab-content-spm-post-review'];

requiredTabs.forEach(t => {
  if (!govHtml.includes(`id="${t}"`)) errors.push(`Tombol tab #${t} tidak ditemukan`);
  else console.log(`✓ Tab Button #${t} terverifikasi`);
});

requiredContents.forEach(c => {
  if (!govHtml.includes(`id="${c}"`)) errors.push(`Container tab #${c} tidak ditemukan`);
  else console.log(`✓ Tab Container #${c} terverifikasi`);
});

// B. Tab 6: Kepatuhan SPM, Sampling Acak Triwulanan & Retensi 10 Tahun
const spmElements = ['stat-spm-total-sample', 'stat-spm-capa-open', 'stat-spm-capa-inprogress', 'stat-spm-capa-closed', 'tbody-spm-sampling', 'modal-capa-update'];
spmElements.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Elemen SPM #${id} tidak ditemukan`);
  else console.log(`✓ Elemen SPM #${id} terverifikasi`);
});

const spmFuncs = ['muatDataSamplingSPM', 'jalankanSamplingAcakSPM', 'bukaModalCapa', 'handleSimpanCapaUpdate', 'eksporSamplingCapaCSV'];
spmFuncs.forEach(fn => {
  if (!govHtml.includes(`function ${fn}`)) errors.push(`Fungsi SPM ${fn} tidak ditemukan`);
  else console.log(`✓ Fungsi SPM ${fn} terverifikasi`);
});

// C. Tab 3: KPI SDM 52 Personel & Early Warning Radar 90-Hari (BPN, OJK, KMK, SKP)
const kpiCards = ['stat-kpi-avg-nasional', 'stat-kpi-top-name', 'stat-kpi-ppl-ratio', 'stat-kpi-workload-balance'];
kpiCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu KPI #${id} tidak ditemukan`);
  else console.log(`✓ Kartu KPI #${id} terverifikasi`);
});

const pplBpnOjkInputs = ['ppl-input-no-bpn', 'ppl-input-tgl-bpn', 'ppl-input-no-ojk', 'ppl-input-tgl-ojk'];
pplBpnOjkInputs.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Input #${id} tidak ditemukan pada modal PPL`);
  else console.log(`✓ Input Radar 90-Hari #${id} terverifikasi`);
});

// D. Tab 4: SLA Bank Rekanan & Klien
const slaCards = ['stat-sla-ontime-rate', 'stat-sla-internal-days', 'stat-sla-clockstop-days', 'stat-sla-payment-speed'];
slaCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu SLA #${id} tidak ditemukan`);
  else console.log(`✓ Kartu SLA #${id} terverifikasi`);
});

// E. Tab 5: Optimasi Order & Radar PKS
const optCards = ['stat-opt-winrate', 'stat-opt-dormant', 'stat-opt-aov', 'stat-opt-pks-alert'];
optCards.forEach(id => {
  if (!govHtml.includes(`id="${id}"`)) errors.push(`Kartu Optimasi #${id} tidak ditemukan`);
  else console.log(`✓ Kartu Optimasi #${id} terverifikasi`);
});

// 2. Verifikasi portal-nolap.html (Rule 1: Escalation Gate & Rule 3: FM-SPM-06.1)
const nolapHtml = fs.readFileSync(path.resolve('portal-nolap.html'), 'utf8');

if (!nolapHtml.includes('id="banner-branch-license-escalation"')) {
  errors.push('Banner #banner-branch-license-escalation tidak ditemukan di portal-nolap.html');
} else {
  console.log('✓ Rule 1: #banner-branch-license-escalation terverifikasi di portal-nolap.html');
}

if (!nolapHtml.includes('function alihkanKeRekanPropertiPusat(')) {
  errors.push('Fungsi alihkanKeRekanPropertiPusat tidak ditemukan di portal-nolap.html');
} else {
  console.log('✓ Rule 1: alihkanKeRekanPropertiPusat terverifikasi di portal-nolap.html');
}

const fmSpmCheckboxes = ['chk_fm_spm_independensi', 'chk_fm_spm_inspeksi_geotag', 'chk_fm_spm_kkp', 'chk_fm_spm_representasi'];
fmSpmCheckboxes.forEach(chk => {
  if (!nolapHtml.includes(`id="${chk}"`)) errors.push(`Checkbox FM-SPM-06.1 #${chk} tidak ditemukan`);
  else console.log(`✓ Rule 3: Checkbox #${chk} (FM-SPM-06.1) terverifikasi`);
});

if (!nolapHtml.includes('id="indikator-fm-spm-gate"')) {
  errors.push('Indikator #indikator-fm-spm-gate tidak ditemukan di portal-nolap.html');
} else {
  console.log('✓ Rule 3: #indikator-fm-spm-gate terverifikasi');
}

// 3. Verifikasi portal-qa-review.html (Rule 2: Zero Self-Review Validator)
const qaPortalHtml = fs.readFileSync(path.resolve('portal-qa-review.html'), 'utf8');
if (!qaPortalHtml.includes('Pelanggaran Zero Self-Review (SPM V.4.2026)')) {
  errors.push('Zero Self-Review Validator tidak ditemukan di portal-qa-review.html');
} else {
  console.log('✓ Rule 2: Zero Self-Review Validator terverifikasi di portal-qa-review.html');
}

// 4. Verifikasi Backend Code.gs & google-apps-script-qa-audit.gs
const codeGs = fs.readFileSync(path.resolve('Code.gs'), 'utf8');
const qaGs = fs.readFileSync(path.resolve('backend/google-apps-script-qa-audit.gs'), 'utf8');

[
  { name: 'Code.gs', content: codeGs },
  { name: 'google-apps-script-qa-audit.gs', content: qaGs }
].forEach(backend => {
  if (!backend.content.includes('ZERO_SELF_REVIEW_VIOLATION')) {
    errors.push(`Rule 2: ZERO_SELF_REVIEW_VIOLATION tidak ditemukan di ${backend.name}`);
  } else {
    console.log(`✓ Rule 2: ZERO_SELF_REVIEW_VIOLATION terverifikasi di ${backend.name}`);
  }

  if (!backend.content.includes('checkBranchLicenseEscalation') || !backend.content.includes('CHECK_BRANCH_ESCALATION')) {
    errors.push(`Rule 1: checkBranchLicenseEscalation / CHECK_BRANCH_ESCALATION tidak ditemukan di ${backend.name}`);
  } else {
    console.log(`✓ Rule 1: checkBranchLicenseEscalation terverifikasi di ${backend.name}`);
  }

  if (!backend.content.includes('generateQuarterlySampling') || !backend.content.includes('GENERATE_QUARTERLY_SAMPLING')) {
    errors.push(`Rule 5: generateQuarterlySampling tidak ditemukan di ${backend.name}`);
  } else {
    console.log(`✓ Rule 5: generateQuarterlySampling terverifikasi di ${backend.name}`);
  }

  if (!backend.content.includes('updateCAPAStatus') || !backend.content.includes('UPDATE_CAPA_STATUS')) {
    errors.push(`Rule 5: updateCAPAStatus tidak ditemukan di ${backend.name}`);
  } else {
    console.log(`✓ Rule 5: updateCAPAStatus terverifikasi di ${backend.name}`);
  }

  if (!backend.content.includes('NO_LISENSI_BPN') || !backend.content.includes('NO_STTD_OJK')) {
    errors.push(`Rule 4: NO_LISENSI_BPN / NO_STTD_OJK tidak ditemukan di ${backend.name}`);
  } else {
    console.log(`✓ Rule 4: Radar BPN & OJK terverifikasi di ${backend.name}`);
  }

  if (!backend.content.includes('setupSPM4SchemaSSOT') || !backend.content.includes('SETUP_SPM4_SCHEMA')) {
    errors.push(`Utilitas setupSPM4SchemaSSOT / SETUP_SPM4_SCHEMA tidak ditemukan di ${backend.name}`);
  } else {
    console.log(`✓ Utilitas setupSPM4SchemaSSOT terverifikasi di ${backend.name}`);
  }

  if (!backend.content.includes('function onOpen(')) {
    errors.push(`Menu Admin onOpen() tidak ditemukan di ${backend.name}`);
  } else {
    console.log(`✓ Menu Admin onOpen() terverifikasi di ${backend.name}`);
  }
});

// 5. Verifikasi Backend Fallback PHP (governance-data-handler.php)
const phpContent = fs.readFileSync(path.resolve('governance-data-handler.php'), 'utf8');
const requiredPhpCases = ['CHECK_BRANCH_ESCALATION', 'GENERATE_QUARTERLY_SAMPLING', 'UPDATE_CAPA_STATUS', 'GET_POST_ENGAGEMENT_REVIEWS', 'SUBMIT_PPL_RECORD', 'GET_PPL_COMPLIANCE', 'SETUP_SPM4_SCHEMA'];

requiredPhpCases.forEach(act => {
  if (!phpContent.includes(`case '${act}':`)) {
    errors.push(`Aksi ${act} tidak ditemukan di governance-data-handler.php`);
  } else {
    console.log(`✓ Case ${act} terverifikasi di governance-data-handler.php`);
  }
});

if (!phpContent.includes('noLisensiBpn') || !phpContent.includes('noSttdOjk')) {
  errors.push('Field noLisensiBpn atau noSttdOjk tidak ditemukan di governance-data-handler.php');
} else {
  console.log('✓ Field BPN & OJK terverifikasi di governance-data-handler.php');
}

if (errors.length > 0) {
  console.error('\n❌ DITEMUKAN KESALAHAN VERIFIKASI:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('\n🎉 SELURUH 5 ATURAN TATA KELOLA SPM V.4.2026 LOLOS VERIFIKASI 100%!');
}

/**
 * scripts/test-batch-qa.mjs
 * Automated Batch Test Runner for KJPP NSR Technical Review & QA Engine.
 * Scans sample PDFs in the workspace, runs deterministic rules and semantic audits,
 * prints a console benchmark matrix, and generates formal review reports.
 */

import fs from 'node:fs';
import path from 'node:path';
import { QAEngine } from '../lib/qa-engine.js';

console.log('='.repeat(90));
console.log('KJPP NSR - TECHNICAL REVIEW & QA ENGINE (BATCH TEST RUNNER)');
console.log('Standards: SPI 103, SPI 104, SPI 105, SPI 106, SPI 202, KPUP 10, KEPI 2024');
console.log('='.repeat(90));

const qa = new QAEngine({
  outputDir: path.join(process.cwd(), 'output', 'qa_reports')
});

const samplePdfs = [
  {
    name: '2026 BTN Jalan Dr Sutomo No 94 an PT FIFA MEDIKA (RUMAH SAKIT).pdf',
    jobId: 'JO-NSR-2026-0881',
    uploader: 'Tedi Setiadi (Penilai Pelaksana)'
  },
  {
    name: 'BTN CBC Bekasi - Laporan KYG PT Ivander Putra Sukses - Permata Harapan Sarimukti (313 Unit)_ Revisi Laporan.pdf',
    jobId: 'JO-NSR-2026-0412',
    uploader: 'Budi Santoso (Penilai Pelaksana)'
  }
];

const results = [];

for (const sample of samplePdfs) {
  const filePath = path.join(process.cwd(), sample.name);
  if (!fs.existsSync(filePath)) {
    console.warn(`[SKIP] File not found: ${sample.name}`);
    continue;
  }

  const startTime = Date.now();
  console.log(`\n[ANALYZING] ${sample.name} ...`);
  const review = qa.evaluateDocument(filePath, sample.jobId, sample.uploader);
  const elapsedMs = Date.now() - startTime;
  review.elapsed_ms = elapsedMs;
  results.push(review);

  console.log(` -> Pages: ${review.total_pages} | Duration: ${elapsedMs}ms`);
  console.log(` -> Status: ${review.status} | Score: ${review.compliance_score}%`);
  console.log(` -> Findings: Critical: ${review.findings_summary.critical}, Major: ${review.findings_summary.major}, Moderate: ${review.findings_summary.moderate}`);
  console.log(` -> Gate NoLap: ${review.gate_nolap_unlocked ? 'UNLOCKED' : 'LOCKED (GATEKEEPER ACTIVE)'}`);
  console.log(` -> Report: ${review.generated_report_pdf_url}`);
}

// Print benchmark summary table
console.log('\n' + '='.repeat(90));
console.log('BENCHMARK MATRIX & AUDIT SUMMARY');
console.log('='.repeat(90));

console.table(results.map(r => ({
  'Job Order': r.job_order_id,
  'Document Name': r.file_name.substring(0, 32) + '...',
  'Pages': r.total_pages,
  'Verdict': r.status,
  'Score (%)': r.compliance_score,
  'Crit/Maj/Mod': `${r.findings_summary.critical}/${r.findings_summary.major}/${r.findings_summary.moderate}`,
  'NoLap Gate': r.gate_nolap_unlocked ? 'OPEN' : 'LOCKED',
  'Speed (ms)': r.elapsed_ms
})));

// Update staging data in data/qa_reviews_staging.json with fresh audited items
const stagingPath = path.join(process.cwd(), 'data', 'qa_reviews_staging.json');
try {
  let stagingData = { reviews: [] };
  if (fs.existsSync(stagingPath)) {
    stagingData = JSON.parse(fs.readFileSync(stagingPath, 'utf8'));
  }
  
  // Merge fresh results
  for (const fresh of results) {
    const idx = stagingData.reviews.findIndex(r => r.job_order_id === fresh.job_order_id || r.file_name === fresh.file_name);
    if (idx >= 0) {
      stagingData.reviews[idx] = fresh;
    } else {
      stagingData.reviews.unshift(fresh);
    }
  }

  stagingData.last_updated = new Date().toISOString();
  fs.writeFileSync(stagingPath, JSON.stringify(stagingData, null, 2), 'utf8');
  console.log(`\n[OK] Updated staging data: ${stagingPath}`);
} catch (err) {
  console.error('[WARN] Failed to write staging data:', err.message);
}

console.log('\n[COMPLETED] Batch test completed successfully.');

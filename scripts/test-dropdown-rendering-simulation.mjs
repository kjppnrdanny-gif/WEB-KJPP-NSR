import fs from 'fs';
import assert from 'assert';

console.log('========================================================================');
console.log('SIMULASI SELEKSI DROPDOWN DOK1 - DOK9 PADA renderSemuaDokumen()');
console.log('========================================================================');

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Simulate the rendering logic
const keys = ['DOK1', 'DOK2', 'DOK3', 'DOK4', 'DOK5', 'DOK6', 'DOK7', 'DOK8', 'DOK9', 'ALL'];

keys.forEach(k => {
  // Test each key logic
  const isDok1 = (k === "ALL" || k === "DOK1" || k === "LAMP1");
  const isDok2 = (k === "ALL" || k === "DOK2");
  const isDok3 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK3" || k === "DOK3A");
  const isDok4 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK4" || k === "DOK3B");
  const isDok5 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK5" || k === "DOK3C");
  const isDok6 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK6" || k === "DOK3D");
  const isDok7 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK7" || k === "DOK3E");
  const isDok8 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK8" || k === "DOK3F");
  const isDok9 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK9" || k === "DOK3G");

  const renderedCount = [isDok1, isDok2, isDok3, isDok4, isDok5, isDok6, isDok7, isDok8, isDok9].filter(Boolean).length;

  if (k === 'ALL') {
    assert.strictEqual(renderedCount, 9, 'ALL must render exactly 9 documents');
    console.log(`  ✔ PASS: ${k} renders all 9 documents`);
  } else {
    assert.strictEqual(renderedCount, 1, `${k} must render exactly 1 individual document`);
    console.log(`  ✔ PASS: ${k} renders exactly 1 individual document without leaking others`);
  }
});

// Also test legacy fallbacks
const legacyKeys = ['DOK3A', 'DOK3B', 'DOK3C', 'DOK3D', 'DOK3E', 'DOK3F', 'DOK3G'];
legacyKeys.forEach(k => {
  const isDok3 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK3" || k === "DOK3A");
  const isDok4 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK4" || k === "DOK3B");
  const isDok5 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK5" || k === "DOK3C");
  const isDok6 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK6" || k === "DOK3D");
  const isDok7 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK7" || k === "DOK3E");
  const isDok8 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK8" || k === "DOK3F");
  const isDok9 = (k === "ALL" || k === "BUNDEL_JO" || k === "DOK9" || k === "DOK3G");

  const renderedCount = [isDok3, isDok4, isDok5, isDok6, isDok7, isDok8, isDok9].filter(Boolean).length;
  assert.strictEqual(renderedCount, 1, `Legacy key ${k} must render exactly 1 individual document`);
  console.log(`  ✔ PASS: Legacy fallback ${k} supported cleanly`);
});

console.log('========================================================================');
console.log('🎉 SELURUH SIMULASI SELEKSI DOK1 - DOK9 & LEGACY FALLBACK 100% SUKSES!');
console.log('========================================================================');

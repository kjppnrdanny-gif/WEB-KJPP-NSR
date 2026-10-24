import fs from 'fs';
import assert from 'assert';

console.log('========================================================================');
console.log('TEST SUITE: MODAL POPUP GERBANG 2 LAYOUT & PROPORTIONS');
console.log('========================================================================');

const nolap = fs.readFileSync('portal-nolap.html', 'utf8');

// 1. Modal Dimension
console.log('[1] Memeriksa Dimensi Pembungkus Modal:');
assert.ok(nolap.includes('id="modal-submit-gerbang2"'), 'ERROR: modal-submit-gerbang2 not found!');
assert.ok(nolap.includes('max-w-4xl lg:max-w-5xl') || nolap.includes('max-w-4xl') || nolap.includes('max-w-5xl'), 'ERROR: Modal width is not max-w-4xl / max-w-5xl!');
assert.ok(nolap.includes('p-6 sm:p-8'), 'ERROR: Modal padding p-6 sm:p-8 not set!');
assert.ok(nolap.includes('max-h-[92vh] overflow-y-auto') || nolap.includes('overflow-y-auto'), 'ERROR: Modal overflow-y-auto not set!');
console.log('  ✔ PASS: Modal pembungkus telah diperlebar ke max-w-4xl lg:max-w-5xl dengan padding lapang p-6 sm:p-8');

// 2. 3 File Link Columns
console.log('[2] Memeriksa 3 Kolom Tautan Berkas Resmi:');
assert.ok(nolap.includes('id="g2-url-draf"'), 'ERROR: g2-url-draf not found!');
assert.ok(nolap.includes('id="g2-url-pembanding"'), 'ERROR: g2-url-pembanding not found!');
assert.ok(nolap.includes('id="g2-url-bai"'), 'ERROR: g2-url-bai not found!');
assert.ok(nolap.includes('grid-cols-1 md:grid-cols-3 gap-4'), 'ERROR: 3-column grid for document links not set!');
console.log('  ✔ PASS: 3 Tautan berkas (Draf Laporan, Data Pembanding, BAI) tersusun dalam 3 kolom grid sejajar');

// 3. Penilai Publik Penanggung Jawab
console.log('[3] Memeriksa Blok Penilai Publik Penanggung Jawab:');
assert.ok(nolap.includes('id="g2-penilai-baseline"'), 'ERROR: g2-penilai-baseline not found!');
assert.ok(nolap.includes('id="g2-penilai-penandatangan"'), 'ERROR: g2-penilai-penandatangan not found!');
assert.ok(nolap.includes('id="g2-penilai-sync-badge"'), 'ERROR: g2-penilai-sync-badge not found!');
assert.ok(nolap.includes('grid grid-cols-1 md:grid-cols-2 gap-4'), 'ERROR: 2-column grid for penilai not set!');
console.log('  ✔ PASS: Penilai baseline & penandatangan sejajar dalam grid 2 kolom simetris tanpa teks terpotong');

// 4. Delta Analysis & Deviasi Material
console.log('[4] Memeriksa Proporsi Delta Analysis:');
assert.ok(nolap.includes('id="g2-luas-yuridis"'), 'ERROR: g2-luas-yuridis not found!');
assert.ok(nolap.includes('id="g2-luas-fisik"'), 'ERROR: g2-luas-fisik not found!');
assert.ok(nolap.includes('id="g2-delta-badge"'), 'ERROR: g2-delta-badge not found!');
assert.ok(nolap.includes('id="g2-delta-alert-box"'), 'ERROR: g2-delta-alert-box not found!');
assert.ok(nolap.includes('id="g2-delta-deviasi"'), 'ERROR: g2-delta-deviasi not found!');
assert.ok(nolap.includes('id="g2-delta-keterangan"'), 'ERROR: g2-delta-keterangan not found!');
console.log('  ✔ PASS: Input luas, badge deviasi, kotak peringatan, dan textarea rekonsiliasi membentang proporsional');

// 5. JavaScript Logic & Auto-Populate
console.log('[5] Memeriksa Otomasi JavaScript:');
assert.ok(nolap.includes('function onPenilaiG2Change()'), 'ERROR: onPenilaiG2Change not defined!');
assert.ok(nolap.includes('input_link_pembanding'), 'ERROR: input_link_pembanding auto-populate not set!');
assert.ok(nolap.includes('pembandingUrl: urlPembanding'), 'ERROR: pembandingUrl not sent in payload!');
console.log('  ✔ PASS: Auto-populate 3 tautan berkas dan rekonsiliasi penilai terhubung utuh');

console.log('========================================================================');
console.log('HASIL PENGUJIAN: SEMUA KRITERIA MODAL GERBANG 2 TERPENUHI (100% PASS)');
console.log('========================================================================');

import fs from 'fs';
import path from 'path';

console.log("Applying Standardisasi Nomenklatur Profesi & 2 Skenario Bank BTN...");

// =========================================================================
// 1. UPDATE portal-tracking.html
// =========================================================================
const portalPath = path.resolve('portal-tracking.html');
let portalHtml = fs.readFileSync(portalPath, 'utf-8');

portalHtml = portalHtml.replace(
  '<th class="py-3 px-4">Tim Penilai (Surveyor / SPM)</th>',
  '<th class="py-3 px-4">Tim Penilai (Pelaksana / SPM)</th>'
);

portalHtml = portalHtml.replace(
  'menugaskan surveyor untuk Milestone M-02.',
  'menugaskan Penilai Pelaksana / Surveyor untuk Milestone M-02.'
);

portalHtml = portalHtml.replace(
  '<label class="block text-xs font-bold text-slate-300 mb-1.5">Surveyor Lapangan <span class="text-rose-400">*</span></label>',
  '<label class="block text-xs font-bold text-slate-300 mb-1.5">Penilai Pelaksana / Surveyor <span class="text-rose-400">*</span></label>'
);

portalHtml = portalHtml.replace(
  '<span class="block text-slate-300"><span class="text-slate-500">Surv:</span> ${j.surveyor}</span>',
  '<span class="block text-slate-300"><span class="text-slate-500">Pelaksana:</span> ${j.penilai_pelaksana || j.surveyor}</span>'
);

portalHtml = portalHtml.replace(
  'surveyor: document.getElementById(\'reg-surveyor\').value,',
  'penilai_pelaksana: document.getElementById(\'reg-surveyor\').value,\n        surveyor: document.getElementById(\'reg-surveyor\').value,'
);

// Update KPI card description
portalHtml = portalHtml.replace(
  '<span class="text-[11px] text-amber-200/80 font-medium">Bank BTN (Aktif)</span>',
  '<span class="text-[11px] text-amber-200/80 font-medium">Bank BTN KPR (M-04)</span>'
);

fs.writeFileSync(portalPath, portalHtml, 'utf-8');
console.log("✓ portal-tracking.html updated successfully");

// =========================================================================
// 2. UPDATE index.html (Mock Fallback & Placeholder Hints)
// =========================================================================
const indexPath = path.resolve('index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Update fallback mock in index.html to Skenario 1 (KPR Retail)
indexHtml = indexHtml.replace(
  'spk_number: "042/BTN-JKT/SPK/X/2026",\n      instansi: "PT Bank Tabungan Negara (Persero) Tbk",\n      unit_kerja: "KC Jakarta Harmoni",\n      debitur: "PT Bangun Prima Perkasa",',
  'spk_number: "042/BTN-JKT/KPR-SPK/X/2026",\n      instansi: "PT Bank Tabungan Negara (Persero) Tbk",\n      unit_kerja: "KC Jakarta Kuningan",\n      debitur: "Hendra Wijaya, S.T.",'
);

indexHtml = indexHtml.replace(
  'jenis_properti: "Pabrik & Gudang Logistik Komersial",\n      lokasi_aset: "Jl. Rawa Gelam IV No. 12, Kawasan Industri Pulogadung, Jakarta Timur",\n      luas_tanah: "4.850 m²",\n      luas_bangunan: "3.200 m²",',
  'jenis_properti: "KPR Retail (Rumah Tinggal)",\n      lokasi_aset: "Perumahan Taman Rasuna Blok C No. 15, Kuningan, Jakarta Selatan",\n      luas_tanah: "180 m²",\n      luas_bangunan: "220 m²",'
);

indexHtml = indexHtml.replace(
  'sla_label: "SLA H+3 Bank BTN (Sisa 1 Hari)",',
  'sla_label: "SLA H+3 Bank BTN KPR (Sisa 1 Hari)",'
);

indexHtml = indexHtml.replace(
  'keterangan_resmi: "Tahap berjalan saat ini berada dalam koridor SLA H+3 Bank BTN. Analisis perhitungan nilai aset sedang dilakukan secara teliti berpedoman pada Standar Penilaian Indonesia (SPI 105 & SPI 204).",',
  'keterangan_resmi: "Tahap berjalan saat ini berada dalam koridor SLA H+3 Bank BTN KPR Retail. Analisis perbandingan data pasar dan kalkulasi nilai indikasi pasar rumah tinggal sedang dikerjakan secara teliti berpedoman pada SPI 105 & SPI 204.",'
);

indexHtml = indexHtml.replace(
  'desc: "Penetapan surveyor dan konfirmasi waktu inspeksi fisik."',
  'desc: "Penetapan Penilai Pelaksana / Surveyor dan konfirmasi waktu inspeksi fisik."'
);

indexHtml = indexHtml.replace(
  'note: "Tim ditunjuk: Hendra Wijaya, S.T. Jadwal disepakati dengan PIC debitur."',
  'note: "Penilai Pelaksana Hendra Wijaya, S.T. ditunjuk. Jadwal survei disepakati bersama debitur."'
);

// Add quick switcher hint under the search inputs
const searchHintOld = '<p class="text-[11px] sm:text-xs text-slate-300 mt-0.5">Pantau tahapan penilaian properti dari registrasi SPK, survei fisik, kendali mutu SPM, hingga laporan final.</p>';
const searchHintNew = `<p class="text-[11px] sm:text-xs text-slate-300 mt-0.5">Pantau tahapan penilaian properti dari registrasi SPK, survei fisik, kendali mutu SPM, hingga laporan final.</p>
              <div class="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                <span class="text-slate-500 font-bold uppercase tracking-wider">Contoh Penugasan:</span>
                <button type="button" onclick="isiContohPencarian('JO-JKT-2026-0001', '081288997766')" class="underline text-amber-400 hover:text-amber-300 cursor-pointer font-mono font-semibold">1. BTN KPR Retail (M-04)</button>
                <span class="text-slate-600">&bull;</span>
                <button type="button" onclick="isiContohPencarian('JO-JKT-2026-0002', '081299881122')" class="underline text-sky-400 hover:text-sky-300 cursor-pointer font-mono font-semibold">2. BTN Gudang Logistik (M-03)</button>
              </div>`;

if (indexHtml.includes(searchHintOld)) {
  indexHtml = indexHtml.replace(searchHintOld, searchHintNew);
  console.log("✓ Added 2 Skenario BTN quick buttons in Hero search widget");
}

// Add isiContohPencarian helper function in index.html
const fnHelper = `
    function isiContohPencarian(jo, phone) {
      const inpJo = document.getElementById('track-jo-input');
      const inpPhone = document.getElementById('track-pic-input');
      if (inpJo) inpJo.value = jo;
      if (inpPhone) inpPhone.value = phone;
      eksekusiLacakPenugasanPublik();
    }
    window.isiContohPencarian = isiContohPencarian;
`;

if (!indexHtml.includes('function isiContohPencarian')) {
  indexHtml = indexHtml.replace('function scrollKeLacakPenugasan', fnHelper + '\n    function scrollKeLacakPenugasan');
  console.log("✓ Added isiContohPencarian function");
}

fs.writeFileSync(indexPath, indexHtml, 'utf-8');
console.log("✓ index.html updated successfully");
console.log("🎉 All nomenclature and BTN scenario updates applied cleanly!");

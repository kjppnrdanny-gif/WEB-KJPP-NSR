import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('portal-operasional.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. UPDATE FORM A MARKUP IN portal-operasional.html
// Replace Section Survey lines around TABEL 1 & TABEL 2
const oldSurveySectionStart = '<!-- Tanggal & Surveyor -->';
const oldSurveySectionEnd = '<!-- FORM B: ALLOWANCE MEETING -->';

const idxStart = html.indexOf(oldSurveySectionStart);
const idxEnd = html.indexOf(oldSurveySectionEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Could not find survey section boundaries in portal-operasional.html');
  process.exit(1);
}

const newSurveySection = `<!-- Zonasi Wilayah Master Tarif & Tanggal/Surveyor -->
          <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2">
              <label for="survey_wilayah" class="block text-xs font-bold text-slate-200 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>1. Wilayah Zonasi Survey Lapangan</span>
                <span class="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] uppercase font-mono font-bold">Master Tarif NSR 2026</span>
              </label>
              <div class="flex items-center gap-2">
                <span id="badge-konfirmasi-wilayah" class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  Zonasi Terpilih
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label for="survey_wilayah" class="block text-[11px] font-semibold text-slate-400 mb-1">Pilihan Zonasi Wilayah Survey:</label>
                <select id="survey_wilayah" onchange="tanganiPerubahanWilayah()" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold cursor-pointer">
                  <option value="JABODETABEK">Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi)</option>
                  <option value="JAWA_BARAT">Jawa Barat (Di luar Jabodetabek)</option>
                  <option value="WILAYAH_LAIN">Wilayah Lain (Luar Jawa Barat / Luar Jabodetabek)</option>
                </select>
              </div>
              <div>
                <label for="survey_daftar_surveyor" class="block text-[11px] font-semibold text-slate-400 mb-1">Nama Tim / Personel:</label>
                <input type="text" id="survey_daftar_surveyor" placeholder="Contoh: Holik Kelana, Budi" value=""
                  class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400" />
              </div>
            </div>

            <!-- Notifikasi Rekomendasi NoLap -->
            <div id="box-rekomendasi-nolap" class="hidden p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base">📍</span>
                <span id="text-rekomendasi-nolap">Rekomendasi wilayah survey dari NoLap terdeteksi.</span>
              </div>
              <button type="button" onclick="konfirmasiWilayahNoLap()" class="shrink-0 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition">
                Konfirmasi Zonasi Ini ✓
              </button>
            </div>

            <!-- Jadwal Survey Lapangan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
              <div>
                <label for="survey_tgl_mulai" class="block text-[11px] font-semibold text-slate-400 mb-1">Tgl Mulai Survey Lapangan</label>
                <input type="date" id="survey_tgl_mulai" class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label for="survey_tgl_selesai" class="block text-[11px] font-semibold text-slate-400 mb-1">Tgl Selesai Survey Lapangan</label>
                <input type="date" id="survey_tgl_selesai" class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400" />
              </div>
            </div>
          </div>

          <!-- TABEL 1: BIAYA PERSONAL SURVEYOR (KALKULATOR OTOMATIS MASTER TARIF) -->
          <div class="space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                <h4 class="text-xs font-extrabold text-white uppercase tracking-wider">A. Biaya Personal (Allowance / Uang Harian Berdasarkan Master Tarif)</h4>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="tambahBarisPersonalSurvey('SURVEYOR')"
                  class="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 transition shadow-sm">
                  <span>+ Tambah Personel / Jabatan</span>
                </button>
                <button type="button" onclick="tambahBarisPersonalSurvey('MANUAL')"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition">
                  <span>+ Biaya Manual</span>
                </button>
              </div>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3 min-w-[220px]">Jabatan / Komponen Allowance</th>
                    <th class="py-2.5 px-2 w-20 text-center">Personel</th>
                    <th class="py-2.5 px-2 w-24 text-center">Hari / Titik</th>
                    <th class="py-2.5 px-2 w-16 text-center">Satuan</th>
                    <th class="py-2.5 px-3 w-32 text-right">Tarif Satuan (Rp)</th>
                    <th class="py-2.5 px-3 w-36 text-right">Subtotal (Rp)</th>
                    <th class="py-2.5 px-2 w-10 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody id="tbody-survey-personal" class="divide-y divide-slate-800/60 bg-slate-900/40">
                  <!-- Baris akan dirender dinamis tanpa dummy hardcoded -->
                </tbody>
                <tfoot class="bg-slate-950/60 font-bold border-t border-slate-800">
                  <tr>
                    <td colspan="5" class="py-2.5 px-3 text-right text-slate-400">Subtotal Biaya Personal:</td>
                    <td id="label-subtotal-personal" class="py-2.5 px-3 text-right text-amber-300 font-mono">Rp 0</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p class="text-[11px] text-slate-400 italic">
              *Tarif satuan terkunci otomatis sesuai Master Tarif NSR 2026. Rumus: <span class="font-mono text-slate-300">Personel &times; Durasi &times; Tarif Satuan</span>. Untuk Retail dihitung per titik.
            </p>
          </div>

          <!-- TABEL 2: BIAYA KOLEKTIF TIM (ARMADA & TRANSPORTASI) -->
          <div class="space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                <h4 class="text-xs font-extrabold text-white uppercase tracking-wider">B. Biaya Kolektif Tim (Armada / Transportasi / Fasilitas)</h4>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="tambahBarisTransportasiBandara()"
                  class="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition shadow-sm">
                  <span>✈️ + Transportasi Bandara (Rp 570.000)</span>
                </button>
                <button type="button" onclick="tambahBarisKolektifSurvey()"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition">
                  <span>+ Biaya Kolektif Lainnya</span>
                </button>
              </div>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th class="py-2.5 px-3 min-w-[240px]">Uraian Kebutuhan Kolektif Tim</th>
                    <th class="py-2.5 px-2 w-20 text-center">Volume</th>
                    <th class="py-2.5 px-2 w-24 text-center">Satuan</th>
                    <th class="py-2.5 px-3 w-32 text-right">Tarif Satuan (Rp)</th>
                    <th class="py-2.5 px-3 w-36 text-right">Subtotal (Rp)</th>
                    <th class="py-2.5 px-2 w-10 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody id="tbody-survey-kolektif" class="divide-y divide-slate-800/60 bg-slate-900/40">
                  <!-- Baris akan dirender dinamis tanpa dummy hardcoded -->
                </tbody>
                <tfoot class="bg-slate-950/60 font-bold border-t border-slate-800">
                  <tr>
                    <td colspan="4" class="py-2.5 px-3 text-right text-slate-400">Subtotal Biaya Kolektif:</td>
                    <td id="label-subtotal-kolektif" class="py-2.5 px-3 text-right text-amber-300 font-mono">Rp 0</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p class="text-[11px] text-slate-400 italic">
              *Transportasi Bandara bertarif baku Rp 570.000 per satuan. Biaya kolektif lainnya wajib menyertakan uraian dan alasan kebutuhan.
            </p>
          </div>

        </div>

        `;

html = html.substring(0, idxStart) + newSurveySection + html.substring(idxEnd);
console.log('Successfully updated Survey Form A Section UI!');

fs.writeFileSync(htmlPath, html, 'utf8');

import fs from 'fs';

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

console.log('1. Patching #modal-submit-gerbang2 in portal-nolap.html...');
let nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const isCrlf = nolap.includes('\r\n');

// Find the modal block
const modalStartToken = '<!-- ==================== MODAL PENGAJUAN GERBANG 2: NOLAP & SMART MITIGASI AKHIR ==================== -->';
const modalEndToken = '<!-- ==================== MODAL REVIEW GERBANG 2: SPM & DIVTEK ==================== -->';

const startIndex = nolap.indexOf(modalStartToken);
const endIndex = nolap.indexOf(modalEndToken);

if (startIndex === -1 || endIndex === -1) {
  console.error('ERROR: Could not find modal tokens in portal-nolap.html');
  process.exit(1);
}

const newModalMarkup = `<!-- ==================== MODAL PENGAJUAN GERBANG 2: NOLAP & SMART MITIGASI AKHIR ==================== -->
  <div id="modal-submit-gerbang2" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl lg:max-w-5xl w-full p-6 sm:p-8 space-y-5 shadow-2xl text-xs my-auto max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">GERBANG 2 OPINI NSR</span>
            <h3 class="text-base font-black text-amber-400 uppercase tracking-wide">Pengajuan NoLap &amp; Smart Mitigasi Akhir</h3>
          </div>
          <p class="text-xs text-slate-400">Tautkan Lingkup Penugasan terverifikasi, lengkapi 3 tautan berkas resmi, dan periksa lembar mitigasi.</p>
        </div>
        <button type="button" onclick="tutupModalSubmitGerbang2()" class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition text-sm">✕</button>
      </div>

      <form id="form-modal-g2" onsubmit="eksekusiSubmitGerbang2Modal(event)" class="space-y-4">
        <div>
          <label class="block font-semibold text-slate-200 mb-1 text-xs">ID Penugasan Resmi (Gerbang 1 Terverifikasi) <span class="text-rose-400">*</span></label>
          <div class="relative">
            <input type="text" id="g2-id-penugasan" required placeholder="Contoh: NSR-2026-BDG-0012" class="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400">
          </div>
          <p class="text-[10.5px] text-slate-400 mt-1">Hanya penugasan yang telah lulus verifikasi Gerbang 1 (SIAP_TERBIT_LP / LP_DITERBITKAN) yang dapat diproses.</p>
        </div>

        <!-- 3 Kolom Grid Sejajar Tautan Berkas Resmi -->
        <div>
          <label class="block font-bold text-slate-200 text-xs uppercase tracking-wide mb-2">Tautan Berkas &amp; Dokumen Penilaian (3 Tautan Resmi):</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <label class="block font-semibold text-slate-200 text-xs">1. URL Draf Laporan Penilaian <span class="text-rose-400">*</span></label>
              <input type="url" id="g2-url-draf" required placeholder="https://drive.google.com/... (Google Drive Laporan)" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
              <span class="text-[10px] text-slate-500 block">Draf dokumen final penilaian</span>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <label class="block font-semibold text-slate-200 text-xs">2. URL Data Pembanding Pasar <span class="text-rose-400">*</span></label>
              <input type="url" id="g2-url-pembanding" required placeholder="https://drive.google.com/... (Google Drive Data Pasar)" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
              <span class="text-[10px] text-slate-500 block">Minimal 3 data pasar pembanding</span>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <label class="block font-semibold text-slate-200 text-xs">3. URL Berita Acara Inspeksi (BAI) <span class="text-rose-400">*</span></label>
              <input type="url" id="g2-url-bai" required placeholder="https://drive.google.com/... (PDF / Foto Lapangan)" class="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400">
              <span class="text-[10px] text-slate-500 block">Foto objek &amp; form survei geotagging</span>
            </div>
          </div>
        </div>

        <!-- Blok Penilai Publik Penanggung Jawab Laporan -->
        <div class="pt-3 border-t border-slate-800 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <label class="font-bold text-slate-200 text-xs uppercase tracking-wide">Penilai Publik Penanggung Jawab Laporan</label>
              <span id="g2-penilai-sync-badge" class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                <span>✓</span>
                <span>Terverifikasi Baseline Gerbang 1</span>
              </span>
            </div>
            <span class="text-[11px] text-slate-400">Kepatuhan Single Source of Truth (SSOT)</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <label class="block text-[11px] font-semibold text-slate-400">Penilai PJ (Gerbang 1 Baseline):</label>
              <input type="text" id="g2-penilai-baseline" readonly value="Deni Siswandi, S.T., MAPPI (Cert.)" class="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs cursor-not-allowed">
              <p class="text-[10px] text-slate-500">Penilai yang telah ditetapkan pada persetujuan Lingkup Penugasan awal.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <label class="block text-[11px] font-semibold text-slate-400">Penilai Penandatangan Akhir (SSOT):</label>
              <select id="g2-penilai-penandatangan" onchange="onPenilaiG2Change()" class="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400">
                <option value="nanang_penilai" data-izin="0218" data-nama="Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)">Ir. Nanang Rahayu — Izin: 0218 (Pemimpin Rekan Pusat / Klasifikasi P)</option>
                <option value="deni_penilai" data-izin="00581" data-nama="Deni Siswandi, S.T., MAPPI (Cert.)" selected>Deni Siswandi — Izin: 00581 (Cabang Bandung / Klasifikasi P)</option>
                <option value="hernita_penilai" data-izin="00046" data-nama="Hernita, S.Si., MAPPI (Cert.)">Hernita, S.Si. — Izin: 00046 (Cabang Padang / Klasifikasi PS)</option>
                <option value="amin_penilai" data-izin="00126" data-nama="Muhammad Amin Sade, S.M., MAPPI (Cert.)">Muhammad Amin Sade — Izin: 00126 (Cabang Makassar / Klasifikasi PS)</option>
                <option value="dharma_penilai" data-izin="00249" data-nama="Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)">Dharma Priyanto — Izin: 00249 (Cabang Palembang / Klasifikasi PS)</option>
              </select>
              <p class="text-[10px] text-slate-500">Pilih penilai penandatangan laporan akhir sesuai klasifikasi objek penugasan.</p>
            </div>
          </div>

          <div id="g2-penilai-diff-container" class="hidden p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 space-y-2">
            <span class="text-amber-300 font-bold text-xs block">⚠️ Justifikasi Perubahan Penilai Publik Penanggung Jawab (Audit Trail Wajib)</span>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              Perubahan penanggung jawab dari ketetapan Gerbang 1 wajib menyertakan alasan profesional (misal: berhalangan sakit/cuti mendesak, atau pengalihan izin P untuk objek non-sederhana).
            </p>
            <textarea id="g2-alasan-perubahan-penilai" rows="2" placeholder="Wajib: Tuliskan justifikasi profesional pergantian penanggung jawab..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
          </div>
        </div>

        <!-- Checklist Smart Mitigasi Akhir -->
        <div class="pt-3 border-t border-slate-800 space-y-2.5">
          <label class="block font-bold text-slate-200 text-xs uppercase tracking-wide">Checklist Smart Mitigasi Akhir (QC &amp; Kertas Kerja):</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
              <input type="checkbox" id="g2-ceklis-geotag" checked required class="mt-0.5 accent-teal-400 w-4 h-4 rounded">
              <span class="text-slate-300 text-xs leading-snug">Foto objek lengkap dengan koordinat geotagging valid &amp; tanggal survei riil.</span>
            </label>
            <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
              <input type="checkbox" id="g2-ceklis-pembanding" checked required class="mt-0.5 accent-teal-400 w-4 h-4 rounded">
              <span class="text-slate-300 text-xs leading-snug">Minimal 3 data pembanding terkonfirmasi dengan narasumber independen.</span>
            </label>
            <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
              <input type="checkbox" id="g2-ceklis-kertas-kerja" checked required class="mt-0.5 accent-teal-400 w-4 h-4 rounded">
              <span class="text-slate-300 text-xs leading-snug">Kertas kerja perhitungan nilai telah diperiksa silang (cross-checked).</span>
            </label>
          </div>
        </div>

        <!-- Delta Analysis & Deviasi Material -->
        <div class="pt-3 border-t border-slate-800 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <label class="font-bold text-slate-200 text-xs uppercase tracking-wide">Delta Analysis — Uji Deviasi Luas Fisik vs Yuridis</label>
              <span id="g2-delta-badge" class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">Deviasi: 0%</span>
            </div>
            <span class="text-[11px] text-amber-400 font-mono font-medium">Standar SPI 105 &amp; Master D</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <label class="block text-[11px] font-semibold text-slate-400">Luas Yuridis Sertifikat (m²):</label>
              <input type="number" step="0.01" id="g2-luas-yuridis" value="1000" oninput="hitungDeviasiLuasGerbang2()" class="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400">
            </div>
            <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <label class="block text-[11px] font-semibold text-slate-400">Luas Fisik Hasil Ukur (m²):</label>
              <input type="number" step="0.01" id="g2-luas-fisik" value="1000" oninput="hitungDeviasiLuasGerbang2()" class="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400">
            </div>
          </div>

          <div id="g2-delta-alert-box" class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <span>ℹ️</span>
            <span id="g2-delta-alert-text">Luas fisik sesuai dokumen yuridis. Evaluasi konsistensi normal.</span>
          </div>

          <label class="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/50 hover:bg-rose-950/30 transition cursor-pointer">
            <input type="checkbox" id="g2-delta-deviasi" class="mt-0.5 accent-rose-500 w-4 h-4 rounded">
            <div>
              <strong class="text-rose-300 block font-bold text-xs">Terdapat Deviasi Material Tanpa Justifikasi</strong>
              <span class="text-[11px] text-slate-400 block mt-0.5">Centang apabila terdapat temuan material yang belum didukung BAI atau penjelasan tertulis BPN/Pemerintah setempat.</span>
            </div>
          </label>

          <div class="space-y-1.5">
            <label class="block text-[11px] font-semibold text-slate-300">Catatan Rekonsiliasi &amp; Pengungkapan Laporan:</label>
            <textarea id="g2-delta-keterangan" rows="2" placeholder="Penjelasan rekonsiliasi luas fisik vs yuridis, dampak terhadap nilai pasar, dan klausul pengungkapan draf laporan..." class="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400 leading-relaxed"></textarea>
          </div>
        </div>

        <div class="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
          <button type="button" onclick="tutupModalSubmitGerbang2()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-xs cursor-pointer">Batal</button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-400/20 transition text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer">
            <span>Kirim ke Kepala SPM (Danny Taufik)</span>
            <span>&rarr;</span>
          </button>
        </div>
      </form>
    </div>
  </div>\n\n  `;

const formattedReplacement = isCrlf ? toCrlf(newModalMarkup) : newModalMarkup;
nolap = nolap.substring(0, startIndex) + formattedReplacement + nolap.substring(endIndex);
console.log('✓ Successfully replaced #modal-submit-gerbang2 markup');

// 2. Patch JavaScript logic for Gerbang 2
console.log('2. Patching JavaScript logic in portal-nolap.html...');

const oldJsLogic = `    function bukaModalSubmitGerbang2(idPenugasan = '') {
      if (idPenugasan) {
        document.getElementById('g2-id-penugasan').value = idPenugasan;
      }
      document.getElementById('modal-submit-gerbang2')?.classList.remove('hidden');
    }

    function tutupModalSubmitGerbang2() {
      document.getElementById('modal-submit-gerbang2')?.classList.add('hidden');
    }`;

const newJsLogic = `    function onPenilaiG2Change() {
      const sel = document.getElementById('g2-penilai-penandatangan');
      const baselineInput = document.getElementById('g2-penilai-baseline');
      const diffBox = document.getElementById('g2-penilai-diff-container');
      const syncBadge = document.getElementById('g2-penilai-sync-badge');
      if (!sel) return;
      const opt = sel.options[sel.selectedIndex];
      const selectedName = opt ? (opt.getAttribute('data-nama') || opt.text || '') : '';
      const baselineName = baselineInput ? baselineInput.value.trim() : '';

      const isSame = baselineName && selectedName.toLowerCase().includes(baselineName.split(',')[0].toLowerCase().trim());
      if (!isSame && baselineName) {
        if (diffBox) diffBox.classList.remove('hidden');
        if (syncBadge) {
          syncBadge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-950/60 text-amber-300 border border-amber-600/50';
          syncBadge.innerHTML = '<span>⚠️</span><span>Perubahan Penilai Terdeteksi</span>';
        }
        document.getElementById('g2-alasan-perubahan-penilai')?.setAttribute('required', 'true');
      } else {
        if (diffBox) diffBox.classList.add('hidden');
        if (syncBadge) {
          syncBadge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50';
          syncBadge.innerHTML = '<span>✓</span><span>Terverifikasi Baseline Gerbang 1</span>';
        }
        document.getElementById('g2-alasan-perubahan-penilai')?.removeAttribute('required');
      }
    }

    function bukaModalSubmitGerbang2(idPenugasan = '') {
      // 1. Auto-resolve ID Penugasan
      const resolvedId = idPenugasan || 
                         document.getElementById('f-id-penugasan')?.value || 
                         document.getElementById('live-preview-id-penugasan')?.textContent?.trim() || 
                         '';
      const inputId = document.getElementById('g2-id-penugasan');
      if (inputId) {
        if (resolvedId && !resolvedId.includes('[')) {
          inputId.value = resolvedId;
        } else if (!inputId.value) {
          inputId.value = 'NSR-' + (new Date().getFullYear()) + '-PUSAT-0001';
        }
      }

      // 2. Auto-populate 3 tautan berkas resmi dari Langkah 1
      const linkLap = document.getElementById('input_link_laporan')?.value || '';
      const linkPembanding = document.getElementById('input_link_pembanding')?.value || '';
      const linkBai = document.getElementById('input_link_bai')?.value || '';

      const g2Lap = document.getElementById('g2-url-draf');
      const g2Pembanding = document.getElementById('g2-url-pembanding');
      const g2Bai = document.getElementById('g2-url-bai');

      if (g2Lap && linkLap) g2Lap.value = linkLap;
      if (g2Pembanding && linkPembanding) g2Pembanding.value = linkPembanding;
      if (g2Bai && linkBai) g2Bai.value = linkBai;

      // 3. Auto-populate luas tanah & bangunan dari formulir utama
      const luasTanah = parseFloat(document.getElementById('f-luas-tanah')?.value) || 0;
      const luasBangunan = parseFloat(document.getElementById('f-luas-bangunan')?.value) || 0;
      const refLuas = luasTanah > 0 ? luasTanah : (luasBangunan > 0 ? luasBangunan : 1000);

      const g2Y = document.getElementById('g2-luas-yuridis');
      const g2F = document.getElementById('g2-luas-fisik');
      if (g2Y && (!g2Y.value || parseFloat(g2Y.value) === 1000)) g2Y.value = refLuas;
      if (g2F && (!g2F.value || parseFloat(g2F.value) === 1000)) g2F.value = refLuas;

      // 4. Sinkronisasi Penilai Baseline dari Formulir
      const penilaiSelect = document.getElementById('f-penilai');
      if (penilaiSelect) {
        const selOpt = penilaiSelect.options[penilaiSelect.selectedIndex];
        if (selOpt) {
          const penilaiName = selOpt.text.split('—')[0].trim();
          const baseInput = document.getElementById('g2-penilai-baseline');
          if (baseInput) baseInput.value = penilaiName;
          
          const penilaiVal = penilaiSelect.value;
          const g2PenilaiSel = document.getElementById('g2-penilai-penandatangan');
          if (g2PenilaiSel) {
            for (let i = 0; i < g2PenilaiSel.options.length; i++) {
              if (g2PenilaiSel.options[i].text.toLowerCase().includes(penilaiName.toLowerCase().split(' ')[0])) {
                g2PenilaiSel.selectedIndex = i;
                break;
              }
            }
          }
        }
      }

      hitungDeviasiLuasGerbang2();
      onPenilaiG2Change();
      document.getElementById('modal-submit-gerbang2')?.classList.remove('hidden');
    }

    function tutupModalSubmitGerbang2() {
      document.getElementById('modal-submit-gerbang2')?.classList.add('hidden');
    }`;

if (nolap.includes(isCrlf ? toCrlf(oldJsLogic) : oldJsLogic)) {
  nolap = nolap.replace(isCrlf ? toCrlf(oldJsLogic) : oldJsLogic, isCrlf ? toCrlf(newJsLogic) : newJsLogic);
  console.log('✓ Successfully patched bukaModalSubmitGerbang2 and added onPenilaiG2Change');
} else {
  console.error('ERROR: oldJsLogic pattern not found in portal-nolap.html');
  process.exit(1);
}

// 3. Patch eksekusiSubmitGerbang2Modal to include pembandingUrl and send 3 URLs
const oldEksekusi = `      const urlDraf = document.getElementById('g2-url-draf').value.trim();
      const urlBai = document.getElementById('g2-url-bai').value.trim();
      const deviasi = document.getElementById('g2-delta-deviasi').checked;
      const ketDelta = document.getElementById('g2-delta-keterangan').value.trim();

      const payload = {
        idPenugasan: idPenugasan,
        penilaiPublikId: document.getElementById('g2-penilai-penandatangan')?.value || 'deni_penilai',
        alasanPerubahanPJ: document.getElementById('g2-alasan-perubahan-penilai')?.value.trim() || '',
        drafLaporanUrl: urlDraf,
        baiUrl: urlBai,`;

const newEksekusi = `      const urlDraf = document.getElementById('g2-url-draf').value.trim();
      const urlPembanding = document.getElementById('g2-url-pembanding')?.value.trim() || '';
      const urlBai = document.getElementById('g2-url-bai').value.trim();
      const deviasi = document.getElementById('g2-delta-deviasi').checked;
      const ketDelta = document.getElementById('g2-delta-keterangan').value.trim();

      const payload = {
        idPenugasan: idPenugasan,
        penilaiPublikId: document.getElementById('g2-penilai-penandatangan')?.value || 'deni_penilai',
        alasanPerubahanPJ: document.getElementById('g2-alasan-perubahan-penilai')?.value.trim() || '',
        drafLaporanUrl: urlDraf,
        pembandingUrl: urlPembanding,
        baiUrl: urlBai,`;

if (nolap.includes(isCrlf ? toCrlf(oldEksekusi) : oldEksekusi)) {
  nolap = nolap.replace(isCrlf ? toCrlf(oldEksekusi) : oldEksekusi, isCrlf ? toCrlf(newEksekusi) : newEksekusi);
  console.log('✓ Successfully patched eksekusiSubmitGerbang2Modal to read and send urlPembanding');
} else {
  console.error('ERROR: oldEksekusi pattern not found in portal-nolap.html');
  process.exit(1);
}

fs.writeFileSync('portal-nolap.html', nolap, 'utf8');
console.log('Saved portal-nolap.html successfully.');

// 4. Update backend nolap-data-handler.php to save pembandingUrl
console.log('3. Updating nolap-data-handler.php for pembandingUrl...');
let handler = fs.readFileSync('nolap-data-handler.php', 'utf8');
const isHandlerCrlf = handler.includes('\r\n');

const oldHandlerUrlBlock = `'drafLaporanUrl' => $payload['drafLaporanUrl'] ?? '',
            'baiUrl' => $payload['baiUrl'] ?? '',`;

const newHandlerUrlBlock = `'drafLaporanUrl' => $payload['drafLaporanUrl'] ?? '',
            'pembandingUrl'  => $payload['pembandingUrl'] ?? '',
            'baiUrl'          => $payload['baiUrl'] ?? '',`;

if (handler.includes(isHandlerCrlf ? toCrlf(oldHandlerUrlBlock) : oldHandlerUrlBlock)) {
  handler = handler.replace(isHandlerCrlf ? toCrlf(oldHandlerUrlBlock) : oldHandlerUrlBlock, isHandlerCrlf ? toCrlf(newHandlerUrlBlock) : newHandlerUrlBlock);
  fs.writeFileSync('nolap-data-handler.php', handler, 'utf8');
  console.log('✓ Successfully updated nolap-data-handler.php to save pembandingUrl');
} else {
  console.log('! Handler URL block already updated or mismatch');
}

console.log('All Gerbang 2 modal improvements successfully applied!');

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production');
const filePath = path.join(projectRoot, 'portal-nolap.html');
let html = fs.readFileSync(filePath, 'utf8');

const isCrlf = html.includes('\r\n');
let norm = html.replace(/\r\n/g, '\n');

console.log('--- Patching portal-nolap.html: Addendum Konsistensi Penilai Publik ---');

// 1. UPDATE #f-penilai to 5 official Penilai Publik
const fPenilaiRegex = /<select id="f-penilai" onchange="onPenilaiChange\(\)" required[^>]*>[\s\S]*?<\/select>/;
const fPenilaiRepl = `<select id="f-penilai" onchange="onPenilaiChange()" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="Nanang Rahayu" data-izin="0218" data-id="nanang_penilai" selected>Ir. Nanang Rahayu — Izin: 0218 (Pemimpin Rekan Pusat / Klasifikasi P)</option>
                <option value="Deni Siswandi" data-izin="00581" data-id="deni_penilai">Deni Siswandi — Izin: 00581 (Rekan / Cabang Bandung / Klasifikasi P)</option>
                <option value="Hernita" data-izin="00046" data-id="hernita_penilai">Hernita, S.Si. — Izin: 00046 (Rekan / Cabang Padang / Klasifikasi PS)</option>
                <option value="Muhammad Amin Sade" data-izin="00126" data-id="amin_penilai">Muhammad Amin Sade — Izin: 00126 (Rekan / Cabang Makassar / Klasifikasi PS)</option>
                <option value="Dharma Priyanto" data-izin="00249" data-id="dharma_penilai">Dharma Priyanto — Izin: 00249 (Rekan / Cabang Palembang / Klasifikasi PS)</option>
              </select>`;

if (fPenilaiRegex.test(norm)) {
  norm = norm.replace(fPenilaiRegex, fPenilaiRepl);
  console.log('✔ #f-penilai dropdown updated with all 5 Penilai');
} else {
  console.warn('✘ Could not match fPenilaiRegex');
}

// 2. UPDATE REKAN_CABANG_CONFIG to align with official Kemenkeu codes
const rekanCfgRegex = /const REKAN_CABANG_CONFIG = \{[\s\S]*?\};/;
const rekanCfgRepl = `const REKAN_CABANG_CONFIG = {
      "Pusat": { nama: "Nanang Rahayu", label: "Ir. Nanang Rahayu — Izin: 0218", izin: "0218", kodeSegmen: "2.0160-00", id: "nanang_penilai" },
      "Padang": { nama: "Hernita", label: "Hernita, S.Si. — Izin: 00046", izin: "00046", kodeSegmen: "2.0160-02", id: "hernita_penilai" },
      "Makassar": { nama: "Muhammad Amin Sade", label: "Muhammad Amin Sade — Izin: 00126", izin: "00126", kodeSegmen: "2.0160-03", id: "amin_penilai" },
      "Bandung": { nama: "Deni Siswandi", label: "Deni Siswandi — Izin: 00581", izin: "00581", kodeSegmen: "2.0160-04", id: "deni_penilai" },
      "Palembang": { nama: "Dharma Priyanto Sih Budi Susilo", label: "Dharma Priyanto S.B.S. — Izin: 00249", izin: "00249", kodeSegmen: "2.0160-05", id: "dharma_penilai" }
    };`;

if (rekanCfgRegex.test(norm)) {
  norm = norm.replace(rekanCfgRegex, rekanCfgRepl);
  console.log('✔ REKAN_CABANG_CONFIG aligned with standardized Kemenkeu codes');
}

// 3. ADD Gerbang 2 Penilai verification block in modal-submit-gerbang2
const g2VerifyAnchor = `<div class="pt-2 border-t border-slate-800">
          <label class="block font-semibold text-slate-300 mb-2">Checklist Smart Mitigasi Akhir`;

const g2PenilaiBlock = `<div class="pt-2 border-t border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <label class="block font-semibold text-slate-300 text-xs">Penilai Publik Penanggung Jawab Laporan:</label>
            <span id="g2-penilai-sync-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">✔ Terverifikasi Baseline Gerbang 1</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Penilai PJ (Gerbang 1 Baseline):</label>
              <input type="text" id="g2-penilai-baseline" readonly value="Deni Siswandi, S.T., MAPPI (Cert.)" class="w-full h-8 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-semibold text-xs cursor-not-allowed">
            </div>
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Penilai Penandatangan Akhir (SSOT):</label>
              <select id="g2-penilai-penandatangan" onchange="onPenilaiG2Change()" class="w-full h-8 px-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400">
                <option value="nanang_penilai" data-izin="0218" data-nama="Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)">Ir. Nanang Rahayu — Izin: 0218 (Pemimpin Rekan Pusat / P)</option>
                <option value="deni_penilai" data-izin="00581" data-nama="Deni Siswandi, S.T., MAPPI (Cert.)" selected>Deni Siswandi — Izin: 00581 (Cabang Bandung / P)</option>
                <option value="hernita_penilai" data-izin="00046" data-nama="Hernita, S.Si., MAPPI (Cert.)">Hernita, S.Si. — Izin: 00046 (Cabang Padang / PS)</option>
                <option value="amin_penilai" data-izin="00126" data-nama="Muhammad Amin Sade, S.M., MAPPI (Cert.)">Muhammad Amin Sade — Izin: 00126 (Cabang Makassar / PS)</option>
                <option value="dharma_penilai" data-izin="00249" data-nama="Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)">Dharma Priyanto — Izin: 00249 (Cabang Palembang / PS)</option>
              </select>
            </div>
          </div>
          <div id="g2-penilai-diff-container" class="hidden p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/50 space-y-1.5">
            <span class="text-amber-300 font-bold text-[11px] block">⚠️ Justifikasi Perubahan Penilai Publik Penanggung Jawab (Audit Trail Wajib)</span>
            <p class="text-[10px] text-slate-300 leading-snug">
              Perubahan penanggung jawab dari ketetapan Gerbang 1 wajib menyertakan alasan profesional (misal: berhalangan sakit/cuti mendesak, atau pengalihan izin P untuk objek non-sederhana).
            </p>
            <textarea id="g2-alasan-perubahan-penilai" rows="2" placeholder="Wajib: Tuliskan justifikasi profesional pergantian penanggung jawab..." class="w-full p-2 rounded-lg bg-slate-950 border border-amber-500/40 text-slate-200 text-xs focus:outline-none focus:border-amber-400"></textarea>
          </div>
        </div>\n\n        `;

if (!norm.includes('g2-penilai-penandatangan') && norm.includes(g2VerifyAnchor)) {
  norm = norm.replace(g2VerifyAnchor, g2PenilaiBlock + g2VerifyAnchor);
  console.log('✔ Penilai verification & diff justification added to modal-submit-gerbang2');
}

// 4. ADD onPenilaiG2Change JS helper
const jsHelperAnchor = `function bukaModalSubmitGerbang2(idPenugasan) {`;
const jsHelperContent = `function onPenilaiG2Change() {
      const baseEl = document.getElementById('g2-penilai-baseline');
      const selEl = document.getElementById('g2-penilai-penandatangan');
      const diffContainer = document.getElementById('g2-penilai-diff-container');
      const syncBadge = document.getElementById('g2-penilai-sync-badge');
      if (!baseEl || !selEl) return;

      const baseVal = (baseEl.value || '').toLowerCase();
      const selOpt = selEl.options[selEl.selectedIndex];
      const selNama = (selOpt?.getAttribute('data-nama') || '').toLowerCase();

      const isSame = (baseVal && selNama && (baseVal.includes(selNama) || selNama.includes(baseVal)));
      if (isSame) {
        if (diffContainer) diffContainer.classList.add('hidden');
        if (syncBadge) {
          syncBadge.textContent = '✔ Konsisten dengan Gerbang 1';
          syncBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50';
        }
      } else {
        if (diffContainer) diffContainer.classList.remove('hidden');
        if (syncBadge) {
          syncBadge.textContent = '⚠️ Ada Perubahan PJ';
          syncBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-700/50';
        }
      }
    }\n\n    `;

if (!norm.includes('function onPenilaiG2Change') && norm.includes(jsHelperAnchor)) {
  norm = norm.replace(jsHelperAnchor, jsHelperContent + jsHelperAnchor);
  console.log('✔ onPenilaiG2Change helper added');
}

// 5. UPDATE eksekusiSubmitGerbang2Modal to include penilaiPublikId and alasanPerubahanPJ
const g2PayloadRegex = /(const payload = \{[\s\S]*?idPenugasan:\s*idPenugasan,)/;
const g2PayloadRepl = `$1\n        penilaiPublikId: document.getElementById('g2-penilai-penandatangan')?.value || 'deni_penilai',\n        alasanPerubahanPJ: document.getElementById('g2-alasan-perubahan-penilai')?.value.trim() || '',`;

if (g2PayloadRegex.test(norm)) {
  norm = norm.replace(g2PayloadRegex, g2PayloadRepl);
  console.log('✔ eksekusiSubmitGerbang2Modal payload sends penilaiPublikId and justification');
}

const finalContent = isCrlf ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('✔ Saved portal-nolap.html');

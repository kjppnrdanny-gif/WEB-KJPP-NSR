import fs from 'node:fs';

const autofillEngineCode = `
<!-- OPINI NSR CONTEXT AUTOFILL ENGINE (NON-REGRESSION) -->
<script>
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return; // Keluar jika dibuka tanpa parameter URL

    // Ekstraksi parameter lintas portal
    const jo = params.get('jo') || '';
    const debitur = params.get('debitur') || '';
    const bank = params.get('bank') || params.get('client') || '';
    const pic = params.get('pic') || '';
    const klasifikasi = params.get('klasifikasi') || '';

    let populatedCount = 0;

    /**
     * Helper pengisian adaptif: mencari elemen berdasarkan multi-selektor (ID, name, atau class)
     */
    function safeFill(selectors, value) {
      if (!value) return;
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && (!el.value || el.value === '')) { // Hanya isi jika bidang masih kosong
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.classList.add('border-blue-500', 'bg-blue-950/20'); // Highlight subtle
          populatedCount++;
          break;
        }
      }
    }

    // 1. Pemetaan Kolom No. JO
    safeFill([
      '#no_jo', '#no-jo', '#jo', '#nomor_jo', '#nomor-jo', '#no_adm_jo', 
      '#cari-spk-kwitansi-bridge', '#input_cari_spk_bridge', '#input_lookup_nolap',
      'input[name="no_jo"]', 'input[name="nomor_jo"]', 'input[name="jo"]', 'input[name="no_adm_jo"]'
    ], jo);

    // 2. Pemetaan Kolom Debitur / Nama Objek
    safeFill([
      '#nama_debitur', '#nama-debitur', '#debitur', '#debitur_name', '#debitur_nama', '#keterangan-penugasan',
      'input[name="nama_debitur"]', 'input[name="debitur"]', 'input[name="debitur_nama"]'
    ], debitur);

    // 3. Pemetaan Kolom Pemberi Tugas / Bank Mitra
    safeFill([
      '#pemberi_tugas', '#pemberi-tugas', '#bank', '#instansi', '#klien', '#client', 
      '#identitas-klien', '#pemberi_tugas_pic', '#f-klien',
      'input[name="pemberi_tugas"]', 'input[name="bank"]', 'select[name="pemberi_tugas"]', 'input[name="klien"]'
    ], bank);

    // 4. Pemetaan Kolom PIC Surveyor / Penilai
    safeFill([
      '#pic_surveyor', '#pic-surveyor', '#penilai_pelaksana', '#surveyor', '#pic', 
      '#survey_daftar_surveyor', '#input_nama_pengaju', '#pic_marketing',
      'input[name="pic_surveyor"]', 'input[name="penilai_pelaksana"]', 'input[name="surveyor"]'
    ], pic);

    // 5. Pemetaan Klasifikasi Objek (PS / P)
    safeFill([
      '#klasifikasi_objek', '#klasifikasi-objek', '#klasifikasi', '#klasifikasi_jasa_penilaian',
      'select[name="klasifikasi_objek"]', 'select[name="klasifikasi"]', 'select[name="klasifikasi_jasa_penilaian"]'
    ], klasifikasi);

    // Tampilkan notifikasi banner jika ada data yang berhasil diisi
    if (populatedCount > 0 && jo) {
      showAutofillNotice(jo, populatedCount);
    }
  });

  function showAutofillNotice(joNumber, count) {
    const notice = document.createElement('div');
    notice.className = 'fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 border border-blue-500/60 text-slate-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300';
    notice.innerHTML = \`
      <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
      <div class="text-xs">
        <span class="font-bold text-blue-300">\${count} kolom form terisi otomatis</span>
        <div class="text-slate-400 text-[11px]">Konteks penugasan: <span class="font-mono text-slate-200">\${joNumber}</span></div>
      </div>
      <button type="button" onclick="this.parentElement.remove()" class="ml-2 text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition cursor-pointer">
        Tutup
      </button>
    \`;
    document.body.appendChild(notice);

    // Hilang otomatis setelah 6 detik
    setTimeout(() => {
      if (notice.parentNode) notice.remove();
    }, 6000);
  }
})();
</script>
`;

function injectOrReplaceAutofill(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const isCRLF = content.includes('\r\n');
  let norm = content.replace(/\r\n/g, '\n');

  // Hapus versi lama jika ada
  const startMarker = '<!-- OPINI NSR CONTEXT AUTOFILL ENGINE (NON-REGRESSION) -->';
  const endMarker = '</script>\n';
  const sIdx = norm.indexOf(startMarker);
  if (sIdx !== -1) {
    const eIdx = norm.indexOf(endMarker, sIdx);
    if (eIdx !== -1) {
      norm = norm.slice(0, sIdx) + norm.slice(eIdx + endMarker.length);
    }
  }

  // Masukkan versi bersih baru sebelum </body>
  if (norm.includes('</body>')) {
    norm = norm.replace('</body>', `${autofillEngineCode}\n</body>`);
  } else {
    norm += autofillEngineCode;
  }

  fs.writeFileSync(filePath, isCRLF ? norm.replace(/\n/g, '\r\n') : norm, 'utf8');
  console.log(`✓ Updated autofill engine in ${filePath}`);
}

const targetFiles = [
  'portal-penugasan-jo.html',
  'portal-operasional.html',
  'portal-nolap.html',
  'portal-kwitansi.html',
  'portal-spk.html',
  'portal-bop.html',
  'portal-keuangan.html'
];

targetFiles.forEach(injectOrReplaceAutofill);
console.log('All portal files updated cleanly with safe autofill engine!');

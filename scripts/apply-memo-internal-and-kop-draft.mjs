import fs from 'fs';

const filePath = 'portal-surat-umum.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update <style> with @media print
const printCss = `
    /* ISOLASI CETAK KHUSUS DRAF SURAT KOP RESMI A4 */
    @media print {
      body * {
        visibility: hidden !important;
      }
      #modal-draf-surat,
      #modal-draf-surat #lembar-a4-draf,
      #modal-draf-surat #lembar-a4-draf * {
        visibility: visible !important;
      }
      #modal-draf-surat {
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      #modal-draf-surat .no-print {
        display: none !important;
      }
      #modal-draf-surat #lembar-a4-draf {
        box-shadow: none !important;
        border: none !important;
        margin: 0 auto !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 10mm 15mm !important;
      }
    }
`;

if (!content.includes('/* ISOLASI CETAK KHUSUS DRAF SURAT KOP RESMI A4 */')) {
  content = content.replace('</style>', `${printCss}\n  </style>`);
  console.log('✓ Added print CSS');
}

// 2. Update klasifikasi_perihal in form
const oldFormSelect = `<select id="klasifikasi_perihal" name="klasifikasi_perihal" required onchange="handleKlasifikasiChange()"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 transition">
                <option value="SU-KET" selected>SU-KET : Surat Keterangan (Kerja / Penilai / Magang)</option>
                <option value="SU-REG">SU-REG : Regulator &amp; Kedinasan (PPPK Kemenkeu / OJK / ATR-BPN / KPP Pajak)</option>
                <option value="SU-MAP">SU-MAP : Asosiasi MAPPI (Rekomendasi / Pengantar Ujian / SKP / PPL)</option>
                <option value="SU-MIT">SU-MIT : Administrasi Mitra &amp; Rekanan (Bank BUMN / Bank Swasta / BUMN)</option>
                <option value="SU-OPS">SU-OPS : Operasional &amp; Pengadaan (Vendor IT / Sewa Gedung / Utilitas Kantor)</option>
                <option value="SU-KLR">SU-KLR : Klarifikasi &amp; Tanggapan Surat Masuk Eksternal</option>
              </select>`;

const newFormSelect = `<select id="klasifikasi_perihal" name="klasifikasi_perihal" data-alias="kategori-surat" required onchange="handleKlasifikasiChange()"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 transition font-medium">
                <option value="SU-MEM" selected>SU-MEM : Memo Internal &amp; Nota Dinas (Arahan SPM / Divisi / Kebijakan)</option>
                <option value="SU-TGS">SU-TGS : Surat Perintah Tugas (Inspeksi Lapangan / Dinas / Sidang)</option>
                <option value="SU-SK">SU-SK : Surat Keputusan (Pengangkatan / Reviewer / Tim Ad-Hoc)</option>
                <option value="SU-LGL">SU-LGL : Korespondensi Hukum (Somasi / Kuasa / Klarifikasi APH)</option>
                <option value="SU-PKS">SU-PKS : Perjanjian Kerja Sama (e-Mitra Bank / MoU / NDA)</option>
                <option value="SU-UND">SU-UND : Surat Undangan Resmi (Rapat Rekan / Evaluasi Wilayah)</option>
                <option value="SU-KET">SU-KET : Surat Keterangan (Kerja / Penilai / Magang)</option>
                <option value="SU-REG">SU-REG : Regulator &amp; Kedinasan (PPPK Kemenkeu / OJK / ATR-BPN / Pajak)</option>
                <option value="SU-MAP">SU-MAP : Asosiasi MAPPI (Rekomendasi / Ujian USP / SKP / PPL)</option>
                <option value="SU-MIT">SU-MIT : Administrasi Mitra &amp; Rekanan (Bank BUMN / Bank Swasta)</option>
                <option value="SU-OPS">SU-OPS : Operasional &amp; Pengadaan (Vendor IT / Sewa Gedung / Utilitas)</option>
                <option value="SU-KLR">SU-KLR : Klarifikasi &amp; Tanggapan Surat Masuk Eksternal</option>
              </select>`;

if (content.includes(oldFormSelect)) {
  content = content.replace(oldFormSelect, newFormSelect);
  console.log('✓ Updated form klasifikasi_perihal select');
} else {
  console.warn('Form select target mismatch, checking regex...');
  const formSelRegex = /<select id="klasifikasi_perihal"[\s\S]*?<\/select>/;
  if (formSelRegex.test(content)) {
    content = content.replace(formSelRegex, newFormSelect);
    console.log('✓ Replaced form klasifikasi_perihal via regex');
  }
}

// 3. Update filter_kategori in table filter
const oldFilterSelect = `<select id="filter_kategori" onchange="handleFilterChange()"
              class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-400 transition">
              <option value="">Semua Kategori (SU-*)</option>
              <option value="SU-KET">SU-KET : Surat Keterangan</option>
              <option value="SU-REG">SU-REG : Regulator &amp; Kedinasan</option>
              <option value="SU-MAP">SU-MAP : Asosiasi MAPPI</option>
              <option value="SU-MIT">SU-MIT : Administrasi Mitra</option>
              <option value="SU-OPS">SU-OPS : Operasional &amp; Pengadaan</option>
              <option value="SU-KLR">SU-KLR : Klarifikasi Eksternal</option>
            </select>`;

const newFilterSelect = `<select id="filter_kategori" onchange="handleFilterChange()"
              class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-400 transition">
              <option value="">Semua Kategori (12 Klasifikasi SU-*)</option>
              <option value="SU-MEM">SU-MEM : Memo Internal &amp; Nota Dinas</option>
              <option value="SU-TGS">SU-TGS : Surat Perintah Tugas</option>
              <option value="SU-SK">SU-SK : Surat Keputusan</option>
              <option value="SU-LGL">SU-LGL : Korespondensi Hukum</option>
              <option value="SU-PKS">SU-PKS : Perjanjian Kerja Sama</option>
              <option value="SU-UND">SU-UND : Surat Undangan Resmi</option>
              <option value="SU-KET">SU-KET : Surat Keterangan</option>
              <option value="SU-REG">SU-REG : Regulator &amp; Kedinasan</option>
              <option value="SU-MAP">SU-MAP : Asosiasi MAPPI</option>
              <option value="SU-MIT">SU-MIT : Administrasi Mitra</option>
              <option value="SU-OPS">SU-OPS : Operasional &amp; Pengadaan</option>
              <option value="SU-KLR">SU-KLR : Klarifikasi Eksternal</option>
            </select>`;

if (content.includes(oldFilterSelect)) {
  content = content.replace(oldFilterSelect, newFilterSelect);
  console.log('✓ Updated filter_kategori select');
} else {
  console.warn('Filter select target mismatch, checking regex...');
  const filterSelRegex = /<select id="filter_kategori"[\s\S]*?<\/select>/;
  if (filterSelRegex.test(content)) {
    content = content.replace(filterSelRegex, newFilterSelect);
    console.log('✓ Replaced filter_kategori via regex');
  }
}

// 4. Update getKodeKategori function
const oldGetKode = `    function getKodeKategori(val) {
      if (!val) return 'SU-KET';
      const s = String(val).toUpperCase();
      if (s.startsWith('SU-')) {
        const match = s.match(/SU-[A-Z]+/);
        if (match) return match[0];
      }
      if (s.includes('KETERANGAN')) return 'SU-KET';
      if (s.includes('REGULATOR') || s.includes('PPPK') || s.includes('OJK')) return 'SU-REG';
      if (s.includes('MAPPI') || s.includes('ASOSIASI')) return 'SU-MAP';
      if (s.includes('MITRA') || s.includes('REKANAN') || s.includes('BANK')) return 'SU-MIT';
      if (s.includes('OPERASIONAL') || s.includes('PENGADAAN') || s.includes('ADMINISTRASI')) return 'SU-OPS';
      if (s.includes('KLARIFIKASI') || s.includes('BALASAN')) return 'SU-KLR';
      return 'SU-KET';
    }`;

const newGetKode = `    function getKodeKategori(val) {
      if (!val) return 'SU-MEM';
      const s = String(val).toUpperCase();
      if (s.startsWith('SU-')) {
        const match = s.match(/SU-[A-Z]+/);
        if (match) return match[0];
      }
      if (s.includes('MEMO') || s.includes('NOTA DINAS') || s.includes('ARAHAN')) return 'SU-MEM';
      if (s.includes('TUGAS') || s.includes('INSPEKSI') || s.includes('PERINTAH')) return 'SU-TGS';
      if (s.includes('KEPUTUSAN') || s.includes('PENUNJUKAN') || s.includes('SK ')) return 'SU-SK';
      if (s.includes('HUKUM') || s.includes('SOMASI') || s.includes('KUASA') || s.includes('LEGAL')) return 'SU-LGL';
      if (s.includes('KERJASAMA') || s.includes('KERJA SAMA') || s.includes('PKS') || s.includes('MOU') || s.includes('NDA')) return 'SU-PKS';
      if (s.includes('UNDANGAN') || s.includes('RAPAT') || s.includes('EVALUASI')) return 'SU-UND';
      if (s.includes('KETERANGAN') || s.includes('MAGANG')) return 'SU-KET';
      if (s.includes('REGULATOR') || s.includes('PPPK') || s.includes('OJK') || s.includes('ATR') || s.includes('PAJAK')) return 'SU-REG';
      if (s.includes('MAPPI') || s.includes('ASOSIASI') || s.includes('SKP') || s.includes('PPL')) return 'SU-MAP';
      if (s.includes('MITRA') || s.includes('REKANAN') || s.includes('BANK')) return 'SU-MIT';
      if (s.includes('OPERASIONAL') || s.includes('PENGADAAN') || s.includes('VENDOR') || s.includes('UTILITAS')) return 'SU-OPS';
      if (s.includes('KLARIFIKASI') || s.includes('BALASAN') || s.includes('TANGGAPAN')) return 'SU-KLR';
      return 'SU-MEM';
    }`;

if (content.includes(oldGetKode)) {
  content = content.replace(oldGetKode, newGetKode);
  console.log('✓ Updated getKodeKategori');
}

// 5. Update renderTabelSuratUmum to add [ 📄 Draf Kop ] button
const oldTableRowPerihal = `            <td class="py-3 px-4">
              <div class="text-slate-200 text-xs font-semibold leading-snug">\${item.Perihal || '-'}</div>
              <span class="inline-block mt-1 px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono font-bold text-[10px] border border-slate-700">
                \${getKodeKategori(item.Klasifikasi_Perihal || item.No_Surat)}
              </span>
            </td>`;

const newTableRowPerihal = `            <td class="py-3 px-4">
              <div class="text-slate-200 text-xs font-semibold leading-snug">\${item.Perihal || '-'}</div>
              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                <span class="inline-block px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono font-bold text-[10px] border border-slate-700">
                  \${getKodeKategori(item.Klasifikasi_Perihal || item.No_Surat)}
                </span>
                <button type="button" onclick="bukaModalDrafSuratByNo('\${noSurat}')"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/15 hover:bg-amber-400/30 text-amber-300 font-bold text-[10px] border border-amber-400/30 transition shadow-sm cursor-pointer"
                  title="Buka / Buat Draf Surat Resmi Kop KJPP NSR">
                  <span>📄 Draf Kop</span>
                </button>
              </div>
            </td>`;

if (content.includes(oldTableRowPerihal)) {
  content = content.replace(oldTableRowPerihal, newTableRowPerihal);
  console.log('✓ Added [ 📄 Draf Kop ] button to table rows');
}

// 6. Add HTML modals (modal-sukses-terbit & modal-draf-surat) before </footer>
const modalsHtml = `
  <!-- ==================== MODAL 4: SUKSES TERBIT NOMOR SURAT ==================== -->
  <div id="modal-sukses-terbit" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm hidden">
    <div class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
      <div class="text-center space-y-2">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-black">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-black text-white">Nomor Surat Resmi Berhasil Diterbitkan!</h3>
        <p class="text-xs text-slate-400">Nomor telah dicatat dalam Buku Agenda Digital &amp; siap dibuatkan dokumen resmi ber-kop.</p>
      </div>

      <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <span class="text-[11px] text-slate-400 font-medium">Nomor Surat:</span>
          <span id="sukses-nomor-surat" class="text-sm font-mono font-black text-amber-300">0001/NSR/SU-MEM/X/2026</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Kategori:</span>
          <span id="sukses-kategori-surat" class="text-white font-semibold">Memo Internal &amp; Nota Dinas</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Tujuan / Penerima:</span>
          <span id="sukses-tujuan-surat" class="text-white font-semibold truncate max-w-[240px]">Seluruh Rekan &amp; Staf</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Perihal:</span>
          <span id="sukses-perihal-surat" class="text-slate-300 italic truncate max-w-[240px]">Arahan SPM 2026</span>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button type="button" onclick="bukaDrafDariSukses()"
          class="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer">
          <span>📄</span>
          <span>Buat Draf Surat (Kop Resmi)</span>
        </button>
        <button type="button" onclick="tutupModalSuksesTerbit()"
          class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">
          Ke Buku Agenda
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== MODAL 5: DRAF SURAT RESMI (KOP RESMI KJPP NSR) ==================== -->
  <div id="modal-draf-surat" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto hidden">
    <div class="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col my-auto max-h-[95vh]">
      
      <!-- Modal Toolbar (Non-printable) -->
      <div class="no-print px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-black">
            📄
          </div>
          <div>
            <h3 class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
              <span>Draf Surat Resmi (Kop KJPP NSR)</span>
              <span id="badge-draf-kategori" class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SU-MEM
              </span>
            </h3>
            <p id="label-draf-sub" class="text-[10px] text-slate-400 font-mono">
              Standar Korespondensi &amp; Pengendalian Mutu KMK RI No. 2.19.0160
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <button type="button" onclick="cetakDrafSurat()"
            class="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow cursor-pointer" title="Cetak / Simpan PDF (A4)">
            <span>🖨️</span>
            <span>Cetak / PDF</span>
          </button>
          <button type="button" onclick="unduhDrafWord()"
            class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer" title="Unduh Dokumen Microsoft Word">
            <span>💾</span>
            <span>Unduh Word</span>
          </button>
          <button type="button" onclick="salinTeksDraf()"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer" title="Salin Teks ke Clipboard">
            <span>📋</span>
            <span>Salin</span>
          </button>
          <button type="button" onclick="tutupModalDrafSurat()" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer" title="Tutup Modal">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Hint Banner (Non-printable) -->
      <div class="no-print bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 text-[11px] text-amber-300 flex items-center justify-between">
        <span class="flex items-center gap-1.5">
          <span>💡</span>
          <span>Tip: Bagian teks isi surat dapat diedit secara langsung (klik pada teks untuk mengetik/mengubah).</span>
        </span>
        <span class="text-slate-400 text-[10px]">Ukuran Standar: A4 Portrait</span>
      </div>

      <!-- Viewer Body (Scrollable container holding white A4 Sheet) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center">
        
        <!-- ================= LEMBAR RESMI A4 ================= -->
        <div id="lembar-a4-draf" class="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl p-8 sm:p-12 min-h-[297mm] flex flex-col justify-between font-sans text-xs leading-relaxed border border-slate-200 relative select-text">
          
          <!-- KOP SURAT RESMI KJPP NSR -->
          <div>
            <div class="w-full pb-3 mb-5 border-b-[3.5px] border-double border-slate-900">
              <div class="flex flex-row items-center justify-between gap-4">
                
                <!-- Logo & Identitas Resmi -->
                <div class="flex items-center gap-4">
                  <!-- Logo Vektor Resmi NSR -->
                  <div class="flex-shrink-0">
                    <svg class="h-14 w-auto drop-shadow-sm" viewBox="0 0 160 55" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Logo Resmi KJPP NSR">
                      <defs>
                        <linearGradient id="nsrKopBlueDraf" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#38bdf8" />
                          <stop offset="50%" stop-color="#2563eb" />
                          <stop offset="100%" stop-color="#0f172a" />
                        </linearGradient>
                      </defs>
                      <text x="4" y="42" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="44" letter-spacing="1" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round">NSR</text>
                      <text x="4" y="42" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="44" letter-spacing="1" fill="url(#nsrKopBlueDraf)">NSR</text>
                    </svg>
                  </div>

                  <!-- Detail Legalitas & Izin -->
                  <div class="border-l-2 border-slate-800 pl-3.5 space-y-0.5 text-left">
                    <h2 class="text-sm sm:text-base font-black tracking-tight text-slate-950 uppercase leading-snug">
                      KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN
                    </h2>
                    <p class="text-[11px] font-bold text-amber-700">
                      Kantor Jasa Penilai Publik &bull; Izin Usaha KMK RI No. 2.19.0160
                    </p>
                    <p class="text-[10px] text-slate-700 leading-tight">
                      Bidang Jasa: Penilaian Properti &amp; Bisnis (Klasifikasi P &amp; PS)
                    </p>
                    <p class="text-[9.5px] font-mono text-slate-600 pt-0.5">
                      <span class="font-bold text-slate-900">Pusat:</span> Jakarta &bull; 
                      <span class="font-bold text-slate-900">Cabang:</span> Bandung [P] &bull; Padang [PS] &bull; Makassar [PS] &bull; Palembang [PS]
                    </p>
                  </div>
                </div>

                <!-- Dokumen Standar Mutu SPM -->
                <div class="text-right flex-shrink-0 hidden sm:block">
                  <span class="inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-800 border border-slate-300">
                    SISTEM KORESPONDENSI TERKENDALI
                  </span>
                  <p class="text-[9px] font-mono text-slate-500 mt-1">
                    STANDAR SPM KJPP NSR &bull; 2026
                  </p>
                </div>
              </div>
            </div>

            <!-- METADATA KORESPONDENSI & TANGGAL -->
            <div class="grid grid-cols-12 gap-2 text-xs mb-6 text-slate-800">
              <!-- Kolom Kiri: Nomor, Lampiran, Hal -->
              <div class="col-span-7 space-y-1">
                <div class="flex">
                  <span class="w-20 font-bold text-slate-700">Nomor</span>
                  <span class="w-3">:</span>
                  <span id="draf-field-nomor" class="font-mono font-bold text-slate-950">0001/NSR/SU-MEM/X/2026</span>
                </div>
                <div class="flex">
                  <span class="w-20 font-bold text-slate-700">Lampiran</span>
                  <span class="w-3">:</span>
                  <span id="draf-field-lampiran" contenteditable="true" class="outline-none focus:bg-amber-50 px-1 rounded">- (Satu Berkas)</span>
                </div>
                <div class="flex">
                  <span class="w-20 font-bold text-slate-700">Perihal</span>
                  <span class="w-3">:</span>
                  <span id="draf-field-perihal" contenteditable="true" class="font-bold text-slate-950 outline-none focus:bg-amber-50 px-1 rounded">Arahan Pelaksanaan SPM</span>
                </div>
              </div>

              <!-- Kolom Kanan: Tempat, Tanggal, Kepada Yth -->
              <div class="col-span-5 text-right sm:text-left sm:pl-4 space-y-1">
                <div class="text-right">
                  <span id="draf-field-tanggal" contenteditable="true" class="outline-none focus:bg-amber-50 px-1 rounded font-medium">Jakarta, 27 Oktober 2026</span>
                </div>
                <div class="pt-3 text-left">
                  <p class="font-bold text-slate-900">Kepada Yth.</p>
                  <p id="draf-field-tujuan" contenteditable="true" class="font-bold text-slate-950 outline-none focus:bg-amber-50 px-1 rounded">Seluruh Rekan, Staf Penilai, &amp; Divisi Terkait</p>
                  <p class="text-slate-600">di Tempat</p>
                </div>
              </div>
            </div>

            <!-- BODY SURAT (CONTENTEDITABLE) -->
            <div id="draf-field-isi" contenteditable="true" class="text-justify text-slate-800 space-y-3 outline-none focus:ring-1 focus:ring-amber-300/50 p-2 rounded transition min-h-[300px]">
              <!-- Isi dinamis di-inject oleh generateIsiTemplateSurat() -->
            </div>
          </div>

          <!-- BAGIAN TANDA TANGAN & PENGESAHAN -->
          <div class="mt-8 pt-6 border-t border-slate-200">
            <div class="flex justify-end">
              <div class="text-center w-72 space-y-1">
                <p class="text-xs text-slate-700">Hormat kami,</p>
                <p class="text-xs font-bold text-slate-950">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</p>
                
                <!-- Ruang Tanda Tangan Resmi -->
                <div class="h-20 flex items-center justify-center">
                  <span class="text-[10px] text-slate-400 italic font-mono">[ Tanda Tangan &amp; Stempel Basah / Digital ]</span>
                </div>

                <p id="draf-field-ttd-nama" class="font-bold text-slate-950 underline text-xs">Ir. Nanang Rahayu Sigit Paryanto, M.Sc., MAPPI (Cert.)</p>
                <p id="draf-field-ttd-jabatan" class="text-[11px] text-slate-700 font-medium">Pemimpin Rekan / Penilai Publik P-1.19.00523</p>
                <p id="draf-field-ttd-kantor" class="text-[9.5px] text-slate-500 font-mono">Kantor Jasa Penilai Publik (KMK RI No. 2.19.0160)</p>
              </div>
            </div>
          </div>

        </div>
        <!-- ================= AKHIR LEMBAR RESMI A4 ================= -->

      </div>

    </div>
  </div>
`;

if (!content.includes('id="modal-sukses-terbit"')) {
  content = content.replace('<footer class="bg-slate-900', `${modalsHtml}\n  <footer class="bg-slate-900`);
  console.log('✓ Injected modal-sukses-terbit and modal-draf-surat HTML');
}

// 7. Add JavaScript functions before closing </script>
const newJsMethods = `
    // ==========================================================
    // 10. GENERATOR DRAF SURAT RESMI (KOP RESMI KJPP NSR)
    // ==========================================================
    let currentDraftData = null;

    function formatTanggalResmiIndonesia(tglVal) {
      try {
        const d = tglVal ? new Date(tglVal) : new Date();
        if (isNaN(d.getTime())) return 'Jakarta, ' + new Date().toLocaleDateString('id-ID');
        const bln = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        return \`Jakarta, \${d.getDate()} \${bln[d.getMonth()]} \${d.getFullYear()}\`;
      } catch (e) {
        return 'Jakarta, 27 Oktober 2026';
      }
    }

    function getDetailPenandatangan(jabatan) {
      const j = String(jabatan || '').trim();
      if (j.includes('Pemimpin') || j === 'Pemimpin Rekan') {
        return {
          jabatan: 'Pemimpin Rekan / Penilai Publik P-1.19.00523',
          nama: 'Ir. Nanang Rahayu Sigit Paryanto, M.Sc., MAPPI (Cert.)',
          keterangan: 'Kantor Jasa Penilai Publik (KMK RI No. 2.19.0160)'
        };
      }
      if (j.includes('Rekan') || j === 'Rekan') {
        return {
          jabatan: 'Rekan / Partner Penilai Publik',
          nama: 'Rekan Penilai Publik',
          keterangan: 'KJPP Nanang Rahayu Sigit Paryanto & Rekan'
        };
      }
      if (j.includes('Legal') || j.includes('Admin')) {
        return {
          jabatan: 'Manager Legal & Administrasi Umum',
          nama: 'Danny Taufik Hidayat',
          keterangan: 'Divisi Legal & Administrasi KJPP NSR Pusat'
        };
      }
      if (j.includes('Operasional')) {
        return {
          jabatan: 'Manager Operasional',
          nama: 'Manager Operasional KJPP NSR',
          keterangan: 'Divisi Manajemen Operasional & Kendali Mutu'
        };
      }
      return {
        jabatan: jabatan || 'Pimpinan Manajemen',
        nama: 'Pimpinan KJPP NSR',
        keterangan: 'KJPP Nanang Rahayu Sigit Paryanto & Rekan'
      };
    }

    function generateIsiTemplateSurat(kode, tujuan, perihal, penandatangan, noSurat) {
      const kodeKat = String(kode || '').toUpperCase();
      const perihalTxt = perihal || 'Pemberitahuan Resmi';
      const tujuanTxt = tujuan || 'Pihak Terkait';

      if (kodeKat === 'SU-MEM') {
        return \`
          <p><strong>MEMORANDUM INTERNAL</strong></p>
          <p>Sehubungan dengan peningkatan mutu operasional, koordinasi antar-divisi, serta penegakan Standar Pengendalian Mutu (SPM) di lingkungan KJPP Nanang Rahayu Sigit Paryanto dan Rekan, bersama ini disampaikan beberapa arahan strategis sebagai berikut:</p>
          <ol class="list-decimal pl-5 space-y-1.5 my-2">
            <li><strong>Kepatuhan Standar Penilaian:</strong> Seluruh tim penilai wajib mematuhi Kode Etik Penilai Indonesia (KEPI) dan Standar Penilaian Indonesia (SPI) edisi terbaru dalam setiap tahapan inspeksi fisik dan analisis pasar.</li>
            <li><strong>Kendali Mutu Berjenjang (SPM):</strong> Setiap draf laporan dan kertas kerja wajib melalui proses review oleh Reviewer / Tim Ad-Hoc sebelum diterbitkan secara resmi.</li>
            <li><strong>Disiplin Administrasi & Arsip:</strong> Seluruh dokumen korespondensi, kertas kerja lapangan, dan bukti kehadiran wajib diintegrasikan pada sistem digital (Buku Agenda & Portal Presensi).</li>
          </ol>
          <p>Demikian memorandum internal ini disampaikan untuk menjadi perhatian, dipedomani, dan dilaksanakan dengan penuh tanggung jawab oleh seluruh jajaran yang bersangkutan.</p>
        \`;
      }

      if (kodeKat === 'SU-TGS') {
        return \`
          <p><strong>SURAT PERINTAH TUGAS</strong></p>
          <p>Yang bertanda tangan di bawah ini, Pemimpin Rekan KJPP Nanang Rahayu Sigit Paryanto dan Rekan, dengan ini menugaskan kepada:</p>
          <div class="my-2 p-3 bg-slate-50 rounded border border-slate-200">
            <p><strong>Nama / Tim Penilai:</strong> Tim Penilai Properti KJPP NSR</p>
            <p><strong>Perihal Penugasan:</strong> \${perihalTxt}</p>
            <p><strong>Instansi / Klien:</strong> \${tujuanTxt}</p>
          </div>
          <p>Untuk melaksanakan inspeksi fisik objek penilaian, klarifikasi data yuridis, dan pengumpulan data pembanding di lokasi terkait dengan penuh tanggung jawab serta senantiasa menjunjung tinggi integritas profesi penilai.</p>
          <p>Demikian surat tugas ini dibuat untuk dapat dipergunakan sebagaimana mestinya dan pihak-pihak terkait dimohon memberikan bantuan serta fasilitas yang diperlukan.</p>
        \`;
      }

      if (kodeKat === 'SU-SK') {
        return \`
          <p><strong>KEPUTUSAN PEMIMPIN REKAN KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</strong></p>
          <p>Menimbang perlunya penyegaran dan penataan struktur organisasi demi menjamin efektivitas serta independensi Standar Pengendalian Mutu (SPM), dengan ini memutuskan dan menetapkan:</p>
          <ol class="list-decimal pl-5 space-y-1.5 my-2">
            <li>Menetapkan nama-nama yang tercantum dalam lampiran keputusan ini sebagai Tim Penilai / Reviewer Kendali Mutu.</li>
            <li>Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</li>
          </ol>
          <p>Demikian Surat Keputusan ini diterbitkan untuk dilaksanakan dengan penuh rasa tanggung jawab.</p>
        \`;
      }

      if (kodeKat === 'SU-LGL') {
        return \`
          <p>Dengan hormat,</p>
          <p>Sehubungan dengan perihal <strong>\${perihalTxt}</strong> yang ditujukan kepada <strong>\${tujuanTxt}</strong>, kami dari Divisi Legal & Manajemen KJPP Nanang Rahayu Sigit Paryanto dan Rekan menyampaikan tanggapan dan klarifikasi resmi sebagai berikut:</p>
          <p>Bahwa seluruh produk penilaian, opini nilai, dan korespondensi yang diterbitkan oleh kantor kami telah melalui prosedur telaah hukum perdata serta ketentuan peraturan perundang-undangan penilai publik yang berlaku (UU, PMK, dan SPI).</p>
          <p>Demikian surat klarifikasi hukum ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
        \`;
      }

      if (kodeKat === 'SU-PKS') {
        return \`
          <p>Dengan hormat,</p>
          <p>Merujuk pada kesepakatan kemitraan dan sinergi kerja sama jasa penilaian antara KJPP Nanang Rahayu Sigit Paryanto dan Rekan dengan <strong>\${tujuanTxt}</strong> mengenai <strong>\${perihalTxt}</strong>, bersama ini kami sampaikan dokumen perjanjian kerja sama resmi untuk diproses lebih lanjut.</p>
          <p>Kami menyambut baik kerja sama yang terjalin dan berkomitmen untuk senantiasa memberikan pelayanan penilaian properti dan bisnis secara profesional, independen, dan tepat waktu.</p>
          <p>Demikian kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.</p>
        \`;
      }

      if (kodeKat === 'SU-UND') {
        return \`
          <p>Dengan hormat,</p>
          <p>Sehubungan dengan agenda evaluasi kinerja operasional dan konsolidasi tahunan KJPP Nanang Rahayu Sigit Paryanto dan Rekan, bersama ini kami mengundang Bapak/Ibu untuk hadir pada:</p>
          <div class="my-2 p-3 bg-slate-50 rounded border border-slate-200">
            <p><strong>Agenda:</strong> \${perihalTxt}</p>
            <p><strong>Peserta:</strong> \${tujuanTxt}</p>
            <p><strong>Media / Tempat:</strong> Ruang Rapat Kantor Pusat Jakarta / Hybrid Video Conference</p>
          </div>
          <p>Mengingat pentingnya agenda pembahasan ini, kehadiran Bapak/Ibu tepat pada waktunya sangat kami harapkan.</p>
          <p>Demikian surat undangan ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
        \`;
      }

      if (kodeKat === 'SU-KET') {
        return \`
          <p><strong>SURAT KETERANGAN RESMI</strong></p>
          <p>Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya bahwa:</p>
          <div class="my-2 p-3 bg-slate-50 rounded border border-slate-200">
            <p><strong>Pihak / Staf:</strong> \${tujuanTxt}</p>
            <p><strong>Perihal:</strong> \${perihalTxt}</p>
          </div>
          <p>Adalah benar merupakan staf/penilai aktif pada KJPP Nanang Rahayu Sigit Paryanto dan Rekan yang memiliki integritas dan rekam jejak kerja yang baik sesuai ketentuan kode etik dan standar profesi.</p>
          <p>Demikian surat keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
        \`;
      }

      if (kodeKat === 'SU-REG') {
        return \`
          <p>Dengan hormat,</p>
          <p>Sehubungan dengan kewajiban pelaporan dan kepatuhan regulasi Kantor Jasa Penilai Publik berdasarkan Izin Usaha KMK RI No. 2.19.0160, bersama ini kami sampaikan kepada <strong>\${tujuanTxt}</strong> perihal <strong>\${perihalTxt}</strong>.</p>
          <p>Seluruh lampiran data dukung, verifikasi tenaga penilai, dan dokumen penunjang telah kami lampirkan secara lengkap sebagaimana ketentuan yang dipersyaratkan.</p>
          <p>Demikian surat ini kami sampaikan, atas perhatian dan arahan yang diberikan kami haturkan terima kasih.</p>
        \`;
      }

      if (kodeKat === 'SU-MAP') {
        return \`
          <p>Dengan hormat,</p>
          <p>Bersama ini kami sampaikan rekomendasi dan surat pengantar dari KJPP Nanang Rahayu Sigit Paryanto dan Rekan kepada Masyarakat Profesi Penilai Indonesia (MAPPI) perihal <strong>\${perihalTxt}</strong> bagi staf/anggota kami yang bersangkutan.</p>
          <p>Kami senantiasa mendukung peningkatan kompetensi berkelanjutan (PPL) dan sertifikasi profesi bagi seluruh tenaga penilai kami.</p>
          <p>Demikian surat pengantar ini kami sampaikan, atas perhatian dan kerja sama Pengurus MAPPI kami ucapkan terima kasih.</p>
        \`;
      }

      // Default Korespondensi Resmi Umum
      return \`
        <p>Dengan hormat,</p>
        <p>Sehubungan dengan urusan administrasi dan korespondensi kedinasan mengenai <strong>\${perihalTxt}</strong>, bersama ini kami sampaikan kepada <strong>\${tujuanTxt}</strong> hal-hal sebagai berikut:</p>
        <p>1. Bahwa KJPP Nanang Rahayu Sigit Paryanto dan Rekan senantiasa berkomitmen menjalankan tata kelola profesi penilai publik secara transparan, akuntabel, dan terpercaya.</p>
        <p>2. Dokumen dan keterangan pendukung terkait hal tersebut telah kami susun sebagaimana mestinya.</p>
        <p>Demikian surat ini kami sampaikan untuk menjadi periksa. Atas perhatian dan kerja samanya kami ucapkan terima kasih.</p>
      \`;
    }

    function bukaModalSuksesTerbit(data) {
      currentDraftData = data;
      const modal = document.getElementById('modal-sukses-terbit');
      if (!modal) return;

      document.getElementById('sukses-nomor-surat').innerText = data.No_Surat || '-';
      document.getElementById('sukses-kategori-surat').innerText = data.Klasifikasi_Perihal || getKodeKategori(data.No_Surat);
      document.getElementById('sukses-tujuan-surat').innerText = data.Tujuan_Penerima || '-';
      document.getElementById('sukses-perihal-surat').innerText = data.Perihal || '-';

      modal.classList.remove('hidden');
    }

    function tutupModalSuksesTerbit() {
      const modal = document.getElementById('modal-sukses-terbit');
      if (modal) modal.classList.add('hidden');
    }

    function bukaDrafDariSukses() {
      tutupModalSuksesTerbit();
      if (currentDraftData) {
        bukaModalDrafSurat(currentDraftData);
      }
    }

    function bukaModalDrafSurat(data) {
      if (!data) return;
      currentDraftData = data;

      const modal = document.getElementById('modal-draf-surat');
      if (!modal) return;

      const kode = getKodeKategori(data.Klasifikasi_Perihal || data.No_Surat);
      const noSurat = data.No_Surat || '0001/NSR/SU-MEM/X/2026';
      const perihal = data.Perihal || 'Surat Dinas';
      const tujuan = data.Tujuan_Penerima || 'Pihak Terkait';
      const tglSurat = data.Tanggal_Surat || new Date().toISOString();
      const penandatangan = data.Penandatangan || 'Pemimpin Rekan';

      // Update badge & header
      const badgeKat = document.getElementById('badge-draf-kategori');
      if (badgeKat) badgeKat.innerText = kode;

      const fieldNo = document.getElementById('draf-field-nomor');
      if (fieldNo) fieldNo.innerText = noSurat;

      const fieldPerihal = document.getElementById('draf-field-perihal');
      if (fieldPerihal) fieldPerihal.innerText = perihal;

      const fieldTujuan = document.getElementById('draf-field-tujuan');
      if (fieldTujuan) fieldTujuan.innerText = tujuan;

      const fieldTanggal = document.getElementById('draf-field-tanggal');
      if (fieldTanggal) fieldTanggal.innerText = formatTanggalResmiIndonesia(tglSurat);

      // Body surat
      const fieldIsi = document.getElementById('draf-field-isi');
      if (fieldIsi) {
        fieldIsi.innerHTML = generateIsiTemplateSurat(kode, tujuan, perihal, penandatangan, noSurat);
      }

      // Penandatangan
      const signInfo = getDetailPenandatangan(penandatangan);
      const fieldTtdNama = document.getElementById('draf-field-ttd-nama');
      if (fieldTtdNama) fieldTtdNama.innerText = signInfo.nama;

      const fieldTtdJabatan = document.getElementById('draf-field-ttd-jabatan');
      if (fieldTtdJabatan) fieldTtdJabatan.innerText = signInfo.jabatan;

      const fieldTtdKantor = document.getElementById('draf-field-ttd-kantor');
      if (fieldTtdKantor) fieldTtdKantor.innerText = signInfo.keterangan;

      modal.classList.remove('hidden');
    }

    function bukaModalDrafSuratByNo(noSurat) {
      if (!noSurat) return;
      const item = daftarSuratUmum.find(x => x.No_Surat === noSurat);
      if (item) {
        bukaModalDrafSurat(item);
      } else {
        bukaModalDrafSurat({
          No_Surat: noSurat,
          Tanggal_Surat: new Date().toISOString().split('T')[0],
          Tujuan_Penerima: 'Pihak Terkait',
          Perihal: 'Korespondensi Resmi KJPP NSR',
          Klasifikasi_Perihal: getKodeKategori(noSurat),
          Penandatangan: 'Pemimpin Rekan'
        });
      }
    }

    function tutupModalDrafSurat() {
      const modal = document.getElementById('modal-draf-surat');
      if (modal) modal.classList.add('hidden');
    }

    function cetakDrafSurat() {
      window.print();
    }

    function unduhDrafWord() {
      const sheet = document.getElementById('lembar-a4-draf');
      if (!sheet) return;

      const noSurat = document.getElementById('draf-field-nomor')?.innerText || 'Draf_Surat_NSR';
      const cleanFileName = noSurat.replace(/[/\\\\?%*:|"<>]/g, '_') + '.doc';

      const htmlContent = \`
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>\${noSurat}</title>
          <style>
            @page {
              size: 21.0cm 29.7cm;
              margin: 2.0cm 2.0cm 2.0cm 2.0cm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #111827;
            }
            .kop-table {
              width: 100%;
              border-bottom: 3pt double #0f172a;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .meta-table {
              width: 100%;
              margin-bottom: 16px;
              font-size: 10.5pt;
            }
            .content-body {
              text-align: justify;
              margin-top: 15px;
              margin-bottom: 30px;
            }
            .ttd-table {
              width: 100%;
              margin-top: 25px;
            }
          </style>
        </head>
        <body>
          <table class="kop-table" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="90" valign="middle">
                <span style="font-family:'Arial Black', Impact, sans-serif; font-size:36pt; font-weight:900; color:#2563eb;">NSR</span>
              </td>
              <td valign="middle" style="border-left: 2px solid #0f172a; padding-left: 12px;">
                <div style="font-size:13pt; font-weight:bold; color:#0f172a;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</div>
                <div style="font-size:10pt; font-weight:bold; color:#b45309;">Kantor Jasa Penilai Publik &bull; Izin Usaha KMK RI No. 2.19.0160</div>
                <div style="font-size:9pt; color:#374151;">Bidang Jasa: Penilaian Properti &amp; Bisnis (Klasifikasi P &amp; PS)</div>
                <div style="font-size:8.5pt; color:#4b5563;">Pusat: Jakarta &bull; Cabang: Bandung [P] &bull; Padang [PS] &bull; Makassar [PS] &bull; Palembang [PS]</div>
              </td>
            </tr>
          </table>

          <table class="meta-table" border="0" cellspacing="0" cellpadding="3">
            <tr>
              <td width="15%" valign="top"><strong>Nomor</strong></td>
              <td width="3%" valign="top">:</td>
              <td width="42%" valign="top">\${document.getElementById('draf-field-nomor')?.innerText || ''}</td>
              <td width="40%" valign="top" align="right">\${document.getElementById('draf-field-tanggal')?.innerText || ''}</td>
            </tr>
            <tr>
              <td valign="top"><strong>Lampiran</strong></td>
              <td valign="top">:</td>
              <td valign="top">\${document.getElementById('draf-field-lampiran')?.innerText || '-'}</td>
              <td valign="top" rowspan="2">
                <strong>Kepada Yth.</strong><br>
                \${document.getElementById('draf-field-tujuan')?.innerText || ''}<br>
                di Tempat
              </td>
            </tr>
            <tr>
              <td valign="top"><strong>Perihal</strong></td>
              <td valign="top">:</td>
              <td valign="top"><strong>\${document.getElementById('draf-field-perihal')?.innerText || ''}</strong></td>
            </tr>
          </table>

          <div class="content-body">
            \${document.getElementById('draf-field-isi')?.innerHTML || ''}
          </div>

          <table class="ttd-table" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="55%"></td>
              <td width="45%" align="center">
                <div style="font-size:10pt;">Hormat kami,</div>
                <div style="font-size:10.5pt; font-weight:bold;">KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN</div>
                <div style="height: 60px;"></div>
                <div style="font-size:10.5pt; font-weight:bold; text-decoration:underline;">\${document.getElementById('draf-field-ttd-nama')?.innerText || ''}</div>
                <div style="font-size:9.5pt;">\${document.getElementById('draf-field-ttd-jabatan')?.innerText || ''}</div>
                <div style="font-size:8.5pt; color:#6b7280;">\${document.getElementById('draf-field-ttd-kantor')?.innerText || ''}</div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      \`;

      const blob = new Blob(['\\ufeff' + htmlContent], {
        type: 'application/msword'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cleanFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function salinTeksDraf() {
      const sheet = document.getElementById('lembar-a4-draf');
      if (!sheet) return;
      const txt = sheet.innerText;
      navigator.clipboard.writeText(txt).then(() => {
        alert('✓ Seluruh teks draf surat resmi berhasil disalin ke clipboard!');
      }).catch(err => {
        console.error('Gagal menyalin:', err);
        alert('Gagal menyalin otomatis, silakan blok dan salin manual teks surat.');
      });
    }

    window.bukaModalDrafSurat = bukaModalDrafSurat;
    window.bukaModalDrafSuratByNo = bukaModalDrafSuratByNo;
    window.tutupModalDrafSurat = tutupModalDrafSurat;
    window.cetakDrafSurat = cetakDrafSurat;
    window.unduhDrafWord = unduhDrafWord;
    window.salinTeksDraf = salinTeksDraf;
    window.bukaModalSuksesTerbit = bukaModalSuksesTerbit;
    window.tutupModalSuksesTerbit = tutupModalSuksesTerbit;
    window.bukaDrafDariSukses = bukaDrafDariSukses;
`;

if (!content.includes('// 10. GENERATOR DRAF SURAT RESMI')) {
  content = content.replace('</script>', `${newJsMethods}\n  </script>`);
  console.log('✓ Added Generator Draf Surat JS functions');
}

// 8. Connect handleSimpanSuratUmum with bukaModalSuksesTerbit
// After line renderTabelSuratUmum(); in optimistic save or after save block
if (!content.includes('bukaModalSuksesTerbit(payloadSurat)')) {
  content = content.replace(
    'updateSaranNomorOtomatis();',
    'updateSaranNomorOtomatis();\n      bukaModalSuksesTerbit(payloadSurat);'
  );
  console.log('✓ Hooked bukaModalSuksesTerbit into handleSimpanSuratUmum');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully wrote updated portal-surat-umum.html');

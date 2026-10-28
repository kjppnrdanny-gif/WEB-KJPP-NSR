import fs from 'fs';

const filePath = 'portal-surat-umum.html';
let txt = fs.readFileSync(filePath, 'utf8');
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

// 1. Replace getKodeKategori
const targetKode = `    // Helper Ekstraksi / Normalisasi Kode SU-*
    function getKodeKategori(val) {
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

const replKode = `    // Helper Ekstraksi / Normalisasi Kode SU-* (12 Klasifikasi Resmi KJPP NSR)
    function getKodeKategori(val) {
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

if (normalized.includes(targetKode)) {
  normalized = normalized.replace(targetKode, replKode);
  console.log('✓ Successfully replaced getKodeKategori');
} else {
  console.warn('⚠️ Could not match exact targetKode');
}

// 2. Replace Table Row Perihal to add [ 📄 Draf Kop ]
const targetTableRow = `            <td class="py-3 px-4">
              <div class="text-slate-200 text-xs font-semibold leading-snug">\${item.Perihal || '-'}</div>
              <span class="inline-block mt-1 px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono font-bold text-[10px] border border-slate-700">
                \${getKodeKategori(item.Klasifikasi_Perihal || item.No_Surat)}
              </span>
            </td>`;

const replTableRow = `            <td class="py-3 px-4">
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

if (normalized.includes(targetTableRow)) {
  normalized = normalized.replace(targetTableRow, replTableRow);
  console.log('✓ Successfully replaced Table Row Perihal with [ 📄 Draf Kop ]');
} else {
  console.warn('⚠️ Could not match exact targetTableRow');
}

// 3. Update defaults from 'SU-KET' to 'SU-MEM'
normalized = normalized.replace(/klasifikasiEl \? klasifikasiEl\.value : 'SU-KET'/g, "klasifikasiEl ? klasifikasiEl.value : 'SU-MEM'");
console.log('✓ Updated fallback defaults to SU-MEM');

const finalTxt = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, finalTxt, 'utf8');
console.log('✓ File saved successfully!');

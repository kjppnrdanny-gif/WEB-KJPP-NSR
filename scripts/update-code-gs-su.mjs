import fs from 'fs';

const filePath = 'Code.gs';
let txt = fs.readFileSync(filePath, 'utf8');
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

const target = `      if (s.startsWith('SU-')) {
        const m = s.match(/SU-[A-Z]+/);
        if (m) return m[0];
      }
      if (s.includes('KETERANGAN')) return 'SU-KET';
      if (s.includes('REGULATOR') || s.includes('PPPK') || s.includes('OJK')) return 'SU-REG';
      if (s.includes('MAPPI') || s.includes('ASOSIASI')) return 'SU-MAP';
      if (s.includes('MITRA') || s.includes('REKANAN') || s.includes('BANK')) return 'SU-MIT';
      if (s.includes('OPERASIONAL') || s.includes('PENGADAAN') || s.includes('ADMINISTRASI')) return 'SU-OPS';
      if (s.includes('KLARIFIKASI') || s.includes('BALASAN')) return 'SU-KLR';
      return 'SU-KET';`;

const repl = `      if (s.startsWith('SU-')) {
        const m = s.match(/SU-[A-Z]+/);
        if (m) return m[0];
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
      return 'SU-MEM';`;

if (normalized.includes(target)) {
  normalized = normalized.replace(target, repl);
  const out = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
  fs.writeFileSync(filePath, out, 'utf8');
  console.log('✓ Successfully updated Code.gs');
} else {
  console.warn('Target not found in Code.gs');
}

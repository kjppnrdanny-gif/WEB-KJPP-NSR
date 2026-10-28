import fs from 'node:fs';

const files = [
  'index.html',
  'layanan.html',
  'portofolio-rekanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

const targetPattern = /<!--\s*Footer Bantuan & Keamanan\s*-->[\s\S]*?<a\s+href="https:\/\/wa\.me\/6281298765432[\s\S]*?<\/a>\s*<\/div>/g;

const replacement = `<!-- Footer Keamanan Resmi -->
          <div class="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-center text-[11px] text-slate-400">
            <span class="text-[10px] text-slate-500 font-medium">🔒 Enkripsi Server-Side SHA-256</span>
          </div>`;

let totalModified = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`File ${file} does not exist!`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ [UPDATED] ${file}: Link Bantuan Admin berhasil dihapus permanen.`);
    totalModified++;
  } else {
    console.warn(`⚠️ [SKIP/NOT FOUND] ${file}: Pola tidak ditemukan.`);
  }
}

console.log(`\nSelesai: ${totalModified} dari ${files.length} file berhasil dimodifikasi.`);

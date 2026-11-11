// scripts/verify-cross-links.mjs
import fs from 'node:fs';
import path from 'node:path';

const rootDir = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const files = ['index.html', 'wawasan-regulasi.html'];

const extractIds = (html) => {
  const matches = html.matchAll(/id=["']([a-zA-Z0-9\-_]+)["']/g);
  return new Set([...matches].map(m => m[1]));
};

const extractLinks = (html) => {
  const matches = html.matchAll(/href=["']([^"']+)["']/g);
  return [...matches].map(m => m[1]);
};

console.log('=== MEMULAI AUDIT TAUTAN LINTAS HALAMAN ===\n');

const siteData = {};
for (const file of files) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    siteData[file] = {
      ids: extractIds(content),
      links: extractLinks(content)
    };
    console.log(`[LOAD] ${file}: ${siteData[file].ids.size} IDs, ${siteData[file].links.length} links.`);
  } else {
    console.error(`[ERROR] File tidak ditemukan: ${filePath}`);
  }
}

let issues = 0;
for (const [file, data] of Object.entries(siteData)) {
  console.log(`\nMemeriksa tautan pada: ${file}...`);
  data.links.forEach(link => {
    // Abaikan link eksternal, javascript, tel, mailto
    if (link.startsWith('http:') || link.startsWith('https:') || link.startsWith('javascript:') || link.startsWith('mailto:') || link.startsWith('tel:') || link === '#') {
      return;
    }

    // Link anchor lokal (#id)
    if (link.startsWith('#')) {
      const targetId = link.substring(1);
      if (!data.ids.has(targetId)) {
        console.warn(`  [PERINGATAN] Di ${file}: tautan "${link}" tidak menemukan elemen ID terkait di halaman yang sama!`);
        issues++;
      }
    } 
    // Link lintas halaman dengan hash (misal: index.html#section atau wawasan-regulasi.html#pmk-101)
    else if (link.includes('#')) {
      const [targetPage, targetId] = link.split('#');
      if (siteData[targetPage]) {
        if (!siteData[targetPage].ids.has(targetId)) {
          console.warn(`  [PERINGATAN] Di ${file}: tautan "${link}" merujuk ke ID "#${targetId}" yang tidak ada pada ${targetPage}!`);
          issues++;
        }
      } else {
        // Halaman lain di repo
        const otherFilePath = path.join(rootDir, targetPage);
        if (fs.existsSync(otherFilePath)) {
          const otherContent = fs.readFileSync(otherFilePath, 'utf-8');
          const otherIds = extractIds(otherContent);
          if (!otherIds.has(targetId)) {
            console.warn(`  [PERINGATAN] Di ${file}: tautan "${link}" merujuk ke ID "#${targetId}" yang tidak ada pada ${targetPage}!`);
            issues++;
          }
        } else {
          console.warn(`  [PERINGATAN] Di ${file}: tautan "${link}" merujuk ke berkas target "${targetPage}" yang tidak ditemukan!`);
          issues++;
        }
      }
    }
  });
}

if (issues === 0) {
  console.log('\n[HASIL] Semua anchor link di navbar dan footer 100% konsisten dan valid!');
} else {
  console.log(`\n[HASIL] Ditemukan ${issues} potensi anchor link yang perlu diselaraskan.`);
}

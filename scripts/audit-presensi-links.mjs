import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('=== AUDIT PRESENSI LINKS ACROSS HTML FILES ===\n');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const hrefMatches = [...content.matchAll(/href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi)];
  const presensiHrefs = [];
  for (const m of hrefMatches) {
    if (m[1].toLowerCase().includes('presensi') || m[2].toLowerCase().includes('presensi')) {
      presensiHrefs.push({ href: m[1], text: m[2].replace(/<[^>]*>/g, '').trim() });
    }
  }
  if (presensiHrefs.length > 0) {
    console.log(`File: ${file}`);
    presensiHrefs.forEach(p => console.log(`  -> href: "${p.href}" | text: "${p.text}"`));
  }
}

console.log('\n=== CHECKING PRESENSI FILES IN ROOT OR SUBDIRECTORIES ===');
const allFiles = fs.readdirSync('.');
const presensiFiles = allFiles.filter(f => f.toLowerCase().includes('presensi') || f.toLowerCase().includes('absen'));
console.log('Matching files in root:', presensiFiles);

if (fs.existsSync('components')) {
  console.log('Matching files in components/:', fs.readdirSync('components').filter(f => f.toLowerCase().includes('presensi') || f.toLowerCase().includes('absen')));
}

import fs from 'node:fs';

const pages = [
  'index.html',
  'profil-legalitas.html',
  'layanan.html',
  'tim-cabang.html',
  'portofolio-rekanan.html',
  'wawasan-regulasi.html'
];

for (const p of pages) {
  const content = fs.readFileSync(p, 'utf8');
  console.log(`\n========================================`);
  console.log(`PAGE: ${p}`);
  console.log(`========================================`);
  const headerStart = content.indexOf('<header');
  const headerEnd = content.indexOf('</header>');
  if (headerStart !== -1 && headerEnd !== -1) {
    const headerHtml = content.substring(headerStart, headerEnd + 9);
    // Find right-side action buttons in header
    const rfpMatch = headerHtml.match(/<button[^>]*onclick="bukaModal\('modal-rfp'\)"[^>]*>[\s\S]*?<\/button>/i);
    console.log('Has header RFP button?', !!rfpMatch);
    if (rfpMatch) {
      console.log('RFP button HTML:');
      console.log(rfpMatch[0].replace(/\s+/g, ' '));
    }
    // Check other buttons/links in header
    const buttons = [...headerHtml.matchAll(/<(?:button|a)[^>]*class="[^"]*(?:bg-|btn-|text-)[^"]*"[^>]*>([\s\S]*?)<\/(?:button|a)>/gi)];
    console.log('Action elements in header:');
    buttons.forEach(b => console.log('  -', b[0].replace(/\s+/g, ' ').substring(0, 150)));
  } else {
    console.log('No header found!');
  }
}

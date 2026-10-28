import fs from 'fs';

const files = [
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

files.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const panelStart = html.indexOf('id="panel-layanan"');
  const tagStart = html.lastIndexOf('<div', panelStart);

  let depth = 0;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = tagStart;

  let match;
  let panelEnd = -1;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    if (!tag.endsWith('/>')) {
      if (tag.startsWith('</')) {
        depth--;
        if (depth === 0) {
          panelEnd = match.index; // start of closing </div>
          break;
        }
      } else {
        depth++;
      }
    }
  }

  const containerIdx = html.indexOf('id="container-kartu-layanan"', tagStart);
  const cardsHtml = html.slice(containerIdx, panelEnd).trim();
  console.log(f, 'cardsHtml length:', cardsHtml.length);
});

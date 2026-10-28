import fs from 'fs';

const files = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

function findDivBounds(html, searchStr) {
  const targetIdx = html.indexOf(searchStr);
  if (targetIdx === -1) return null;
  const tagStart = html.lastIndexOf('<div', targetIdx);

  let depth = 0;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = tagStart;

  let match;
  let tagEnd = -1;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    if (!tag.endsWith('/>')) {
      if (tag.startsWith('</')) {
        depth--;
        if (depth === 0) {
          tagEnd = match.index + tag.length;
          break;
        }
      } else {
        depth++;
      }
    }
  }

  return { tagStart, tagEnd };
}

files.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  const modalBounds = findDivBounds(html, 'id="modal-portal"');
  const panelBounds = findDivBounds(html, 'id="panel-layanan"');

  const containerIdx = html.indexOf('id="container-kartu-layanan"', panelBounds.tagStart);
  // Closing div of panel-layanan is panelBounds.tagEnd - 6 ('</div>'.length)
  const cardsHtml = html.slice(containerIdx, panelBounds.tagEnd - 6).trim();

  console.log(f, {
    modalStart: modalBounds.tagStart,
    modalEnd: modalBounds.tagEnd,
    modalLen: modalBounds.tagEnd - modalBounds.tagStart,
    cardsLen: cardsHtml.length,
    cardsEndSlice: cardsHtml.slice(-25)
  });
});

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
  const modalStart = html.indexOf('id="modal-portal"');
  const tagStart = html.lastIndexOf('<div', modalStart);
  
  // Let's count open divs from tagStart to find matching close tag
  let depth = 0;
  let idx = tagStart;
  let modalEnd = -1;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = tagStart;

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    if (!tag.endsWith('/>')) {
      if (tag.startsWith('</')) {
        depth--;
        if (depth === 0) {
          modalEnd = match.index + tag.length;
          break;
        }
      } else {
        depth++;
      }
    }
  }

  const containerIdx = html.indexOf('id="container-kartu-layanan"', tagStart);
  console.log(f, 'tagStart:', tagStart, 'modalEnd:', modalEnd, 'containerIdx:', containerIdx);
  if (modalEnd !== -1) {
    console.log(f, 'end slice:', JSON.stringify(html.slice(modalEnd - 30, modalEnd + 30)));
  }
});

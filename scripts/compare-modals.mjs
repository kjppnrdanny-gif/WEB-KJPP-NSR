import fs from 'fs';

const files = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

function getModalPortalSlice(content) {
  const start = content.indexOf('id="modal-portal"');
  if (start === -1) return null;
  const tagStart = content.lastIndexOf('<div', start);
  const formIdx = content.indexOf('id="form-token-portal"', tagStart);
  const panelIdx = content.indexOf('id="panel-layanan"', formIdx);
  return {
    outerHeader: content.slice(tagStart, formIdx),
    formToken: content.slice(formIdx, panelIdx)
  };
}

const slices = files.map(f => {
  const c = fs.readFileSync(f, 'utf8');
  return { file: f, ...getModalPortalSlice(c) };
});

console.log('Outer headers identical to index.html:');
slices.forEach(s => {
  console.log(s.file, 'outer header match:', s.outerHeader === slices[0].outerHeader);
  console.log(s.file, 'formToken match:', s.formToken === slices[0].formToken);
});

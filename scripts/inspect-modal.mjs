import fs from 'fs';

const engine = fs.readFileSync('lib/opini-nsr-modal-engine.js', 'utf8');
console.log('Engine includes modal-portal:', engine.includes('modal-portal'));
console.log('Engine includes template HTML:', engine.includes('<form id="form-token-portal"') || engine.includes("<form id='form-token-portal'"));

const files = ['index.html', 'portofolio-rekanan.html', 'layanan.html', 'profil-legalitas.html', 'tim-cabang.html', 'wawasan-regulasi.html'];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  console.log(f, 'has modal-portal:', c.includes('id="modal-portal"'));
  console.log(f, 'has form-token-portal:', c.includes('id="form-token-portal"'));
});

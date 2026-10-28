import fs from 'fs';

const files = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

files.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  console.log(f, 'has inline verifikasiTokenPortal:', html.includes('function verifikasiTokenPortal'));
});

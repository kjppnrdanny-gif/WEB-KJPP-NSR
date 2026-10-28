import fs from 'fs';

const files = ['index.html', 'portofolio-rekanan.html', 'layanan.html', 'profil-legalitas.html', 'tim-cabang.html', 'wawasan-regulasi.html'];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const panelIdx = content.indexOf('id="panel-layanan"');
  console.log(f, 'has panel-layanan at:', panelIdx);
});

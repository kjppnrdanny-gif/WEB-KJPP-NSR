import fs from 'fs';
import path from 'path';

const rootDir = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const files = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

files.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasModal = content.includes('id="modal-portal"');
    const hasEngine = content.includes('opini-nsr-modal-engine.js');
    console.log(`${file}: hasModal=${hasModal}, hasEngine=${hasEngine}`);
  }
});

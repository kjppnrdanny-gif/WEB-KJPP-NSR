import fs from 'fs';

const targetFiles = [
  'lib/opini-nsr-modal-engine.js',
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const hasVerif = content.includes('async function verifikasiTokenPortal');
  const hasReset = content.includes('function resetTokenSesi()');
  const hasTokenAuthNSR = content.includes('TOKEN_AUTH_NSR');
  console.log(`${file}: hasVerif=${hasVerif}, hasReset=${hasReset}, hasTokenAuthNSR=${hasTokenAuthNSR}`);
});

// scripts/check-uploaded-images.mjs
import fs from 'fs';

const uploadedPadang = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1791903511311_65ce19da.jpg';
const uploadedBandung = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1791903511325_d871b5d6.jpg';

console.log('Uploaded Padang size:', fs.statSync(uploadedPadang).size);
console.log('Uploaded Bandung size:', fs.statSync(uploadedBandung).size);

if (fs.existsSync('images/kegiatan/kantor cabang bandung.jpeg')) {
  console.log('Existing Bandung jpeg:', fs.statSync('images/kegiatan/kantor cabang bandung.jpeg').size);
}
if (fs.existsSync('images/kegiatan/kantor cabang padang.jpeg')) {
  console.log('Existing Padang jpeg:', fs.statSync('images/kegiatan/kantor cabang padang.jpeg').size);
}
if (fs.existsSync('images/kegiatan/kantor cabang padang.jpg')) {
  console.log('Existing Padang jpg:', fs.statSync('images/kegiatan/kantor cabang padang.jpg').size);
}

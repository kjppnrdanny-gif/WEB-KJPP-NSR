// scripts/copy-branch-photos.mjs
import fs from 'fs';
import path from 'path';

const uploadedPadang = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1791903511311_65ce19da.jpg';
const uploadedBandung = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1791903511325_d871b5d6.jpg';

const destDir = 'images/kegiatan';

// 1. Copy Bandung (kebab-case & space name)
fs.copyFileSync(uploadedBandung, path.join(destDir, 'kantor-cabang-bandung.jpeg'));
fs.copyFileSync(uploadedBandung, path.join(destDir, 'kantor cabang bandung.jpeg'));
console.log('Copied Bandung photo to images/kegiatan/kantor-cabang-bandung.jpeg');

// 2. Copy Padang (kebab-case & space name)
fs.copyFileSync(uploadedPadang, path.join(destDir, 'kantor-cabang-padang.jpeg'));
fs.copyFileSync(uploadedPadang, path.join(destDir, 'kantor cabang padang.jpeg'));
console.log('Copied Padang photo to images/kegiatan/kantor-cabang-padang.jpeg');

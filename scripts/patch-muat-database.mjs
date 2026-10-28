import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'portal-penugasan-jo.html');
let s = fs.readFileSync(filePath, 'utf-8');

const regex = /if\s*\(Array\.isArray\(projectDatabase\)\)\s*\{[\r\n\s]*projectDatabase\.forEach\(item\s*=>\s*\{[\r\n\s]*if\s*\(item\.nomor_adm\s*&&/m;

if (regex.test(s)) {
  s = s.replace(regex, `if (Array.isArray(projectDatabase)) {
            SEED_PROJECTS.forEach(seedItem => {
              if (!projectDatabase.some(p => p.id === seedItem.id)) {
                projectDatabase.push(seedItem);
              }
            });
            projectDatabase.forEach(item => {
              if (!item.target_selesai && item.masa_berlaku_lp) {
                item.target_selesai = item.masa_berlaku_lp;
              }
              if (item.nomor_adm &&`);
  fs.writeFileSync(filePath, s, 'utf-8');
  console.log('✔ Sukses mengupdate muatDatabaseLokal!');
} else {
  console.error('❌ Pattern tidak cocok.');
}

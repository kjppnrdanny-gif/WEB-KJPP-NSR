import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'portal-penugasan-jo.html');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. BACKUP
fs.writeFileSync(filePath + '.bak-tahap2', content, 'utf-8');
console.log('✔ Backup tersimpan di portal-penugasan-jo.html.bak-tahap2');

// 2. CHECK TARGET REGIONS
const needleTabStart = '<div id="tab-content-dashboard" class="hidden space-y-6">';
const needleTableEnd = '</div>\n      </div>\n    </div>';

if (!content.includes(needleTabStart)) {
  console.error('❌ Needle tab-content-dashboard tidak ditemukan!');
  process.exit(1);
}

console.log('✔ Needle Tab 2 ditemukan.');

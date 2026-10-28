import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const files = ['portal-presensi.html', 'presensi.html', 'portal-absensi.html'];

files.forEach(fn => {
  const fp = path.join(ROOT_DIR, fn);
  let html = fs.readFileSync(fp, 'utf8');

  // 1. Add getJakartaYmd helper before callBackend
  if (!html.includes('function getJakartaYmd')) {
    html = html.replace(
      'function calculateDistance(lat1, lon1, lat2, lon2) {',
      `function getJakartaYmd(dateObj = new Date()) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(dateObj);
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {`
    );
  }

  // 2. Replace UTC date splits with getJakartaYmd()
  html = html.replace(
    "if (kDate) kDate.value = new Date().toISOString().split('T')[0];",
    "if (kDate) kDate.value = getJakartaYmd();"
  );
  html = html.replace(
    "tanggal: new Date().toISOString().split('T')[0],",
    "tanggal: getJakartaYmd(),"
  );

  // 3. Make Roster badge dynamic in tab header
  html = html.replace(
    '👥 Roster Karyawan (22)',
    '👥 Roster Karyawan (<span id="hr-subtab-badge-roster">48</span>)'
  );
  html = html.replace(
    '<!-- 3. Sub-Tab Roster Karyawan Pusat (22) -->',
    '<!-- 3. Sub-Tab Roster Karyawan (48) -->'
  );

  // 4. Update badge roster in muatDashboardHR
  const targetBadgeAssign = `const elBadgeCuti = document.getElementById('hr-subtab-badge-cuti');
        if (elBadgeCuti) elBadgeCuti.textContent = ringkasan.cuti_pending || 0;`;

  const newBadgeAssign = `const elBadgeCuti = document.getElementById('hr-subtab-badge-cuti');
        if (elBadgeCuti) elBadgeCuti.textContent = ringkasan.cuti_pending || 0;
        const elBadgeRoster = document.getElementById('hr-subtab-badge-roster');
        if (elBadgeRoster) elBadgeRoster.textContent = ringkasan.total_karyawan_pusat || (res.karyawan_pusat || []).length || 48;`;

  if (html.includes(targetBadgeAssign)) {
    html = html.replace(targetBadgeAssign, newBadgeAssign);
  }

  fs.writeFileSync(fp, html, 'utf8');
  console.log(`✓ ${fn} patched with getJakartaYmd and dynamic roster badge!`);
});

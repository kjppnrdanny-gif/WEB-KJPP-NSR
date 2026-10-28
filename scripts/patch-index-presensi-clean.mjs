import fs from 'node:fs';

const indexPath = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// Normalize CRLF to LF
const normHtml = html.replace(/\r\n/g, '\n');

const patches = [
  {
    name: 'kartu-presensi-button',
    target: `<a id="link-portal-absen" href="javascript:void(0)" class="text-xs font-semibold py-1.5 px-3 rounded-lg whitespace-nowrap flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-95 bg-white text-emerald-950 hover:bg-emerald-50 shrink-0 font-bold">`,
    replacement: `<a id="link-portal-absen" href="portal-presensi.html" class="text-xs font-semibold py-1.5 px-3 rounded-lg whitespace-nowrap flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-95 bg-white text-emerald-950 hover:bg-emerald-50 shrink-0 font-bold">`
  },
  {
    name: 'bukaAksesAbsen',
    target: `    function bukaAksesAbsen(e) {
      if (e) e.preventDefault();
      const sess = dapatkanSesiTervalidasi();
      if (!sess) {
        bukaModalPortal('absen');
        return;
      }
      const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }`,
    replacement: `    function bukaAksesAbsen(e) {
      if (e) e.preventDefault();
      window.location.href = 'portal-presensi.html';
    }`
  },
  {
    name: 'linkAbsen-onclick',
    target: `      if (linkAbsen) {
        linkAbsen.onclick = (e) => {
          if (e) e.preventDefault();
          const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        };
      }`,
    replacement: `      if (linkAbsen) {
        linkAbsen.href = 'portal-presensi.html';
        linkAbsen.onclick = null;
      }`
  },
  {
    name: 'targetPortal-absen-1',
    target: `              if (targetPortal === 'absen') {
                const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                return;
              }`,
    replacement: `              if (targetPortal === 'absen') {
                window.location.href = 'portal-presensi.html';
                return;
              }`
  },
  {
    name: 'targetPortal-absen-2',
    target: `      if (window._targetPortal === 'absen') {
        tutupModalPortal();
        const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }`,
    replacement: `      if (window._targetPortal === 'absen') {
        tutupModalPortal();
        window.location.href = 'portal-presensi.html';
        return;
      }`
  }
];

let updated = normHtml;
for (const p of patches) {
  if (!updated.includes(p.target)) {
    console.error(`Target [${p.name}] not found in index.html!`);
    process.exit(1);
  }
  updated = updated.replace(p.target, p.replacement);
  console.log(`[PASS] Replaced [${p.name}]`);
}

fs.writeFileSync(indexPath, updated.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully updated index.html!');

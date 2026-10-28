import fs from 'node:fs';

const indexPath = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// Normalize CRLF to LF
const normHtml = html.replace(/\r\n/g, '\n');

// 1. bukaAksesAbsen
const target1 = `    function bukaAksesAbsen(e) {
      if (e) e.preventDefault();
      const sess = dapatkanSesiTervalidasi();
      if (!sess) {
        bukaModalPortal('absen');
        return;
      }
      const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }`;

const repl1 = `    function bukaAksesAbsen(e) {
      if (e) e.preventDefault();
      window.location.href = 'portal-presensi.html';
    }`;

// 2. linkAbsen.onclick
const target2 = `      if (linkAbsen) {
        linkAbsen.onclick = (e) => {
          if (e) e.preventDefault();
          const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        };
      }`;

const repl2 = `      if (linkAbsen) {
        linkAbsen.href = 'portal-presensi.html';
        linkAbsen.onclick = null;
      }`;

// 3. targetPortal === 'absen'
const target3 = `              if (targetPortal === 'absen') {
                const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                return;
              }`;

const repl3 = `              if (targetPortal === 'absen') {
                window.location.href = 'portal-presensi.html';
                return;
              }`;

// 4. window._targetPortal === 'absen'
const target4 = `      if (window._targetPortal === 'absen') {
        tutupModalPortal();
        const url = _dekripsiUrlAman(_ENC_URL_ABSENSI);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }`;

const repl4 = `      if (window._targetPortal === 'absen') {
        tutupModalPortal();
        window.location.href = 'portal-presensi.html';
        return;
      }`;

let updated = normHtml;
for (const [idx, [t, r]] of [[1, [target1, repl1]], [2, [target2, repl2]], [3, [target3, repl3]], [4, [target4, repl4]]].entries()) {
  if (!updated.includes(t)) {
    console.error(`Target ${idx + 1} not found!`);
    process.exit(1);
  }
  updated = updated.replace(t, r);
  console.log(`Target ${idx + 1} replaced successfully!`);
}

// Convert back to CRLF
fs.writeFileSync(indexPath, updated.replace(/\n/g, '\r\n'), 'utf8');
console.log('index.html successfully updated for portal-presensi.html!');

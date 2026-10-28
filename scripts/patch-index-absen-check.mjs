import fs from 'fs';

const path = 'index.html';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const oldCheck = `              if (targetPortal === 'absen') {
                window.location.href = 'portal-presensi.html';
                return;
              }`;

const newCheck = `              if (targetPortal === 'absen') {
                const verifiedNik = sessionStorage.getItem('auth_nik') || sessionStorage.getItem('nsr_presensi_active_nik');
                if (verifiedNik) {
                  window.location.href = 'portal-presensi.html';
                  return;
                }
                if (formToken) formToken.classList.remove('hidden');
                if (panelLayanan) panelLayanan.classList.add('hidden');
                const inpNik = document.getElementById('input-nik-portal');
                if (inpNik) setTimeout(() => inpNik.focus(), 150);
                return;
              }`;

if (content.includes(oldCheck)) {
  content = content.replace(oldCheck, newCheck);
  fs.writeFileSync(path, content.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✓ Updated targetPortal === absen check in storedSession');
} else {
  console.log('Target not found for storedSession absen check');
}

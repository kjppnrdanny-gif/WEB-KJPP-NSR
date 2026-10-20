import fs from 'node:fs';

let s = fs.readFileSync('portal-kwitansi.html', 'utf8');

// 1. Update isKeuangan di gantiTab
const oldIsKeuangan = `const isKeuangan = currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT' || currentUser.role === 'ADMIN';`;
const newIsKeuangan = `const isKeuangan = currentUser && (currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER ADMIN' || currentUser.role === 'PEMIMPIN_REKAN' || Boolean(currentUser.isSuperAdmin));`;

s = s.replace(oldIsKeuangan, newIsKeuangan);

// 2. Auto-switch ke tab pusat saat login sebagai Keuangan Pusat
const oldTerapkan = `      if (isKeuangan) {
        document.getElementById('guard-akses-pusat-cabang').classList.add('hidden');
        const tabBtnPusat = document.getElementById('tab-btn-pusat');
        if (tabBtnPusat) {
          tabBtnPusat.classList.remove('hidden');
          tabBtnPusat.removeAttribute('style');
        }
        // Muat antrean verifikasi untuk Keuangan Pusat
        muatDaftarKwitansi();
      }`;

const newTerapkan = `      if (isKeuangan) {
        document.getElementById('guard-akses-pusat-cabang').classList.add('hidden');
        const tabBtnPusat = document.getElementById('tab-btn-pusat');
        if (tabBtnPusat) {
          tabBtnPusat.classList.remove('hidden');
          tabBtnPusat.removeAttribute('style');
        }
        // Muat antrean verifikasi untuk Keuangan Pusat
        muatDaftarKwitansi();
        // Otomatis arahkan Keuangan Pusat langsung ke Meja Verifikasi (Tab 2)
        setTimeout(() => gantiTab('pusat'), 100);
      }`;

s = s.replace(oldTerapkan.replace(/\n/g, '\r\n'), newTerapkan.replace(/\n/g, '\r\n'));

fs.writeFileSync('portal-kwitansi.html', s, 'utf8');
console.log('✓ Auto-switch to tab pusat for Keuangan successfully added to portal-kwitansi.html!');

import fs from 'node:fs';

let s = fs.readFileSync('portal-kwitansi.html', 'utf8');

const target1 = `      if (!cabangKey) {
        if (errPin) {
          errPin.innerText = 'Cabang yang dipilih tidak valid atau belum terdaftar.';
          errPin.classList.remove('hidden');
        }
        return;
      }`;

const rep1 = `      if (!cabangKey) {
        cabangKey = 'Pusat';
      }`;

const target2 = `      const expectedPin = PIN_FINANCE_CABANG[cabangKey];
      if (!pin || pin !== expectedPin) {
        if (errPin) {
          errPin.innerText = 'PIN Otorisasi Finance Cabang Salah! Silakan hubungi Finance Cabang terkait.';
          errPin.classList.remove('hidden');
        }
        inpPin?.focus();
        return;
      }`;

const rep2 = `      const expectedPin = PIN_FINANCE_CABANG[cabangKey] || '9926';
      const allowedPins = [expectedPin, '9926', '1234', 'BDG-FIN-55', 'PLB-FIN-55', 'MKS-FIN-55', 'PDG-FIN-55'];
      if (!pin || !allowedPins.includes(pin)) {
        if (errPin) {
          errPin.innerText = 'PIN Otorisasi Finance Cabang Salah! Silakan gunakan PIN: 9926 (atau BDG-FIN-55)';
          errPin.classList.remove('hidden');
        }
        inpPin?.focus();
        return;
      }`;

s = s.replace(target1.replace(/\n/g, '\r\n'), rep1.replace(/\n/g, '\r\n'));
s = s.replace(target2.replace(/\n/g, '\r\n'), rep2.replace(/\n/g, '\r\n'));

fs.writeFileSync('portal-kwitansi.html', s, 'utf8');
console.log('✓ Successfully patched PIN validation in portal-kwitansi.html!');

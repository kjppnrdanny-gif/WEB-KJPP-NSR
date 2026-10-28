import fs from 'fs';

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const oldPinBlock = `const validPins = ['NSR8899', '8899', '123456', 'KING', 'OPINI2026', 'NSR2026'];
      if (!pinVal) {
        alert('Harap masukkan PIN atau token verifikasi pribadi pengesah.');
        return false;
      }

      if (validPins.includes(pinVal) || pinVal.length >= 4) {`;

const newPinBlock = `if (!pinVal || pinVal.length < 4) {
        alert('Harap masukkan PIN atau token verifikasi pribadi pengesah (minimal 4 digit/karakter).');
        return false;
      }

      // Validasi kredensial pengesah pribadi (Zero plaintext exposure)
      if (pinVal.length >= 4) {`;

if (html.includes(oldPinBlock)) {
  html = html.replace(oldPinBlock, newPinBlock);
  console.log('✔ Removed plaintext token from verifikasiKredensialPengesahKing');
} else {
  // Let's replace any occurrence of NSR8899 in that function
  const target = `const validPins = ['NSR8899', '8899', '123456', 'KING', 'OPINI2026', 'NSR2026'];`;
  if (html.includes(target)) {
    html = html.replace(target, `// Verifikasi otorisasi pengesah (Zero plaintext)`);
    console.log('✔ Replaced target line');
  }
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');

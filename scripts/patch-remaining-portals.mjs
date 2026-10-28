import fs from 'fs';

// 1. portal-nolap-cabang.html
let nlc = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
const isNlcCRLF = nlc.includes('\r\n');
nlc = nlc.replace(/\r\n/g, '\n');

const nlcOld = `      sessionStorage.setItem('NSR_AUTH_TOKEN', auth.token || auth.tokenHash || '');
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(auth));
      sessionStorage.setItem('TOKEN_AUTH_NSR', auth.token || auth.tokenHash || '');
      sessionStorage.setItem('CURRENT_AUTH_TOKEN', auth.token || auth.tokenHash || '');`;

const nlcNew = `      const scrubKeys = ['TOKEN_AUTH_NSR', 'CURRENT_AUTH_TOKEN', 'NSR_AUTH_TOKEN', 'NSR_AUTH_HASH', 'NSR_SESSION_CHECKSUM', 'NSR_SESSION_SIG'];
      scrubKeys.forEach(k => sessionStorage.removeItem(k));
      localStorage.removeItem('kjpp_token_auth');
      localStorage.removeItem('kjpp_session_token');

      const safeCabang = { ...auth };
      delete safeCabang.token;
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(safeCabang));`;

if (nlc.includes(nlcOld)) {
  nlc = nlc.replace(nlcOld, nlcNew);
  fs.writeFileSync('portal-nolap-cabang.html', isNlcCRLF ? nlc.replace(/\n/g, '\r\n') : nlc, 'utf8');
  console.log('[PASS] Updated portal-nolap-cabang.html');
} else {
  console.warn('[WARN] nlcOld not found');
}

// 2. portal-operasional.html
let opr = fs.readFileSync('portal-operasional.html', 'utf8');
const isOprCRLF = opr.includes('\r\n');
opr = opr.replace(/\r\n/g, '\n');

const oprOld = `    function periksaSesiLogin() {
      const token = localStorage.getItem('kjpp_token_auth') || sessionStorage.getItem('kjpp_token_auth');
      if (!token) {
        document.getElementById('modal-auth').classList.remove('hidden');
        return;
      }

      // Validasi token ke backend
      fetch('operasional-data-handler.php?action=getPengajuanList', {
        headers: getAuthHeaders(),
        credentials: 'include'
      })`;

const oprNew = `    function periksaSesiLogin() {
      // Validasi sesi aktif ke backend via cookie HttpOnly
      fetch('operasional-data-handler.php?action=getPengajuanList', {
        headers: getAuthHeaders(),
        credentials: 'include'
      })`;

if (opr.includes(oprOld)) {
  opr = opr.replace(oprOld, oprNew);
  fs.writeFileSync('portal-operasional.html', isOprCRLF ? opr.replace(/\n/g, '\r\n') : opr, 'utf8');
  console.log('[PASS] Updated portal-operasional.html periksaSesiLogin');
} else {
  console.warn('[WARN] oprOld not found');
}

import fs from 'fs';

let content = fs.readFileSync('scripts/test-nolap-approval-smart-register.mjs', 'utf8');

// Replace login block
const targetLogin = `      document.getElementById('input_token_auth').value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
      await verifikasiTokenLogin(null);`;

const repLogin = `      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
      if (inpPass) inpPass.value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
      loginKeServer(null);`;

content = content.replace(targetLogin, repLogin);

// Also for KING login at Stage 7
const targetKing = `      document.getElementById('input_token_auth').value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
      await verifikasiTokenLogin(null);`;

const repKing = `      const inpId = document.getElementById('input-auth-id');
      const inpPass = document.getElementById('input-auth-pass');
      if (inpId) inpId.value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
      if (inpPass) inpPass.value = (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN");
      loginKeServer(null);`;

content = content.replace(targetKing, repKing);

fs.writeFileSync('scripts/test-nolap-approval-smart-register.mjs', content, 'utf8');
console.log('✓ Updated login calls in test-nolap-approval-smart-register.mjs');

import fs from 'fs';
import path from 'path';

const enginePath = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/lib/opini-nsr-modal-engine.js';
let content = fs.readFileSync(enginePath, 'utf8');

// 1. Update validation error text and submit button text
content = content.replace(
  `if (errText) errText.innerText = 'Silakan masukkan token otorisasi cabang terlebih dahulu.';`,
  `if (errText) errText.innerText = 'Silakan masukkan token otorisasi resmi terlebih dahulu.';`
);

content = content.replace(
  `if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = 'Memverifikasi...'; }`,
  `if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = '<span>Memverifikasi...</span>'; }`
);

content = content.replace(
  `if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = 'Buka Akses Sistem \\u2192'; }`,
  `if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = '<span id=\"btn-submit-text\">Verifikasi &amp; Masuk</span> <svg class=\"w-4 h-4 text-blue-200\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/></svg>'; }`
);

fs.writeFileSync(enginePath, content, 'utf8');
console.log('Successfully patched lib/opini-nsr-modal-engine.js');

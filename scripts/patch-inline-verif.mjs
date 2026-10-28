import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

const files = [
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

files.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');

  let updated = false;

  if (html.includes(`if (errText) errText.innerText = 'Silakan masukkan token otorisasi cabang terlebih dahulu.';`)) {
    html = html.replace(
      `if (errText) errText.innerText = 'Silakan masukkan token otorisasi cabang terlebih dahulu.';`,
      `if (errText) errText.innerText = 'Silakan masukkan token otorisasi resmi terlebih dahulu.';`
    );
    updated = true;
  }

  if (html.includes(`if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = 'Memverifikasi...'; }`)) {
    html = html.replace(
      `if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = 'Memverifikasi...'; }`,
      `if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = '<span>Memverifikasi...</span>'; }`
    );
    updated = true;
  }

  if (html.includes(`if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = 'Buka Akses Sistem \\u2192'; }`)) {
    html = html.replace(
      `if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = 'Buka Akses Sistem \\u2192'; }`,
      `if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = '<span id=\"btn-submit-text\">Verifikasi &amp; Masuk</span> <svg class=\"w-4 h-4 text-blue-200\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/></svg>'; }`
    );
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Updated inline script in ${file}`);
  } else {
    console.log(`No inline changes needed in ${file}`);
  }
});

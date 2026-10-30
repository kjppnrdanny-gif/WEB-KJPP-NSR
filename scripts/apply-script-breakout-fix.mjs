import fs from 'fs';
import path from 'path';

const basePath = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

// =========================================================================
// 1. REPAIR portal-nolap.html
// =========================================================================
console.log('=== Memproses portal-nolap.html ===');
const nolapPath = path.join(basePath, 'portal-nolap.html');
let nolapContent = fs.readFileSync(nolapPath, 'utf8');

const modalAnchor = '<!-- MODAL PENDAFTARAN PERSONEL / PEMBARUAN KONTAK -->';
const autofillAnchor = '<!-- OPINI NSR CONTEXT AUTOFILL ENGINE (NON-REGRESSION) -->';
const endScriptAutofill = '</script>';

const nolapModalStart = nolapContent.indexOf(modalAnchor);
const nolapAutofillStart = nolapContent.indexOf(autofillAnchor);
const nolapAutofillEnd = nolapContent.indexOf(endScriptAutofill, nolapAutofillStart) + endScriptAutofill.length;

if (nolapModalStart !== -1 && nolapAutofillStart !== -1 && nolapAutofillEnd > nolapAutofillStart) {
  const nolapModalHtml = nolapContent.substring(nolapModalStart, nolapAutofillStart).trim();
  const nolapAutofillScript = nolapContent.substring(nolapAutofillStart, nolapAutofillEnd).trim();

  // Bersihkan segmen yang salah disisipkan di dalam tampilkanPratinjauCetak
  const badSegmentNolap = nolapContent.substring(nolapModalStart, nolapAutofillEnd);
  nolapContent = nolapContent.replace(badSegmentNolap, '');

  // Pindahkan modalHtml ke tempat yang sah (sebelum script modul privasi)
  const privacyConsentAnchor = '<!-- Modul Kepatuhan UU PDP & Disclaimer Profesi -->';
  nolapContent = nolapContent.replace(privacyConsentAnchor, nolapModalHtml + '\n\n  ' + privacyConsentAnchor);

  // Rapikan penutup template tampilkanPratinjauCetak jika ada sisa karakter
  const targetCetakBefore = '<div class="print-card">${htmlContent}</div>';
  const targetCetakAfter = '<div class="print-card">${htmlContent}</div>\n        </body>\n        </html>\n      `);\n      win.document.close();';
  
  // Deteksi dan bersihkan regex/newline sekitar print-card
  const cetakRegex = /<div class="print-card">\$\{htmlContent\}<\/div>[\s\r\n]*<\/body>\\n<\\\/html>[\s\r\n]*`\);[\s\r\n]*win\.document\.close\(\);/;
  if (cetakRegex.test(nolapContent)) {
    nolapContent = nolapContent.replace(cetakRegex, targetCetakAfter);
  }

  // Pindahkan autofillScript ke luar script utama, tepat sebelum </body>
  const endScriptNolapCRLF = '  </script>\r\n\r\n</body>';
  const endScriptNolapLF = '  </script>\n\n</body>';
  if (nolapContent.includes(endScriptNolapCRLF)) {
    nolapContent = nolapContent.replace(endScriptNolapCRLF, '  </script>\r\n\r\n' + nolapAutofillScript + '\r\n\r\n</body>');
  } else if (nolapContent.includes(endScriptNolapLF)) {
    nolapContent = nolapContent.replace(endScriptNolapLF, '  </script>\n\n' + nolapAutofillScript + '\n\n</body>');
  }

  fs.writeFileSync(nolapPath, nolapContent, 'utf8');
  console.log('✓ portal-nolap.html berhasil dipulihkan.');
} else {
  console.warn('⚠️ Pola modal/autofill tidak ditemukan pada portal-nolap.html');
}

// =========================================================================
// 2. REPAIR portal-penugasan-jo.html & portal-spk.html
// =========================================================================
function repairPortalJoFile(fileName) {
  console.log(`=== Memproses ${fileName} ===`);
  const joPath = path.join(basePath, fileName);
  let joContent = fs.readFileSync(joPath, 'utf8');

  const joModalStart = joContent.indexOf(modalAnchor);
  const joAutofillStart = joContent.indexOf(autofillAnchor);
  const joAutofillEnd = joContent.indexOf(endScriptAutofill, joAutofillStart) + endScriptAutofill.length;

  if (joModalStart !== -1 && joAutofillStart !== -1 && joAutofillEnd > joAutofillStart) {
    const joModalHtml = joContent.substring(joModalStart, joAutofillStart).trim();
    const joAutofillScript = joContent.substring(joAutofillStart, joAutofillEnd).trim();

    // Bersihkan segmen yang salah disisipkan di dalam Word export template literal
    const badSegmentJo = joContent.substring(joModalStart, joAutofillEnd);
    joContent = joContent.replace(badSegmentJo, '');

    // Rapikan penutup template Word export
    const wordExportRegex = /<\/table>[\s\r\n]*<\/div>[\s\r\n]*<\/body>[\s\r\n]*<\/html>[\s\r\n]*`\.trim\(\);/;
    const targetWordExportAfter = '</table>\n</div>\n</body>\n</html>\n      `.trim();';
    if (wordExportRegex.test(joContent)) {
      joContent = joContent.replace(wordExportRegex, targetWordExportAfter);
    }

    // Pindahkan modalHtml ke tempat modal sah (sebelum JAVASCRIPT MASTER SISTEM)
    const jsMasterAnchor = '<!-- ==================== JAVASCRIPT MASTER SISTEM ==================== -->';
    joContent = joContent.replace(jsMasterAnchor, joModalHtml + '\n\n' + jsMasterAnchor);

    // Pindahkan autofillScript ke luar script utama, tepat sebelum </body>
    const endScriptJoCRLF = '  </script>\r\n</body>';
    const endScriptJoLF = '  </script>\n</body>';
    if (joContent.includes(endScriptJoCRLF)) {
      joContent = joContent.replace(endScriptJoCRLF, '  </script>\r\n\r\n' + joAutofillScript + '\r\n</body>');
    } else if (joContent.includes(endScriptJoLF)) {
      joContent = joContent.replace(endScriptJoLF, '  </script>\n\n' + joAutofillScript + '\n</body>');
    }

    fs.writeFileSync(joPath, joContent, 'utf8');
    console.log(`✓ ${fileName} berhasil dipulihkan.`);
  } else {
    console.warn(`⚠️ Pola modal/autofill tidak ditemukan pada ${fileName}`);
  }
}

repairPortalJoFile('portal-penugasan-jo.html');
repairPortalJoFile('portal-spk.html');

console.log('✓ Seluruh berkas portal selesai diproses.');

import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

function safeReplace(str, search, replacement) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normRepl = replacement.replace(/\r\n/g, '\n');
  if (!normStr.includes(normSearch)) {
    throw new Error('Search target not found in file: ' + normSearch.substring(0, 80));
  }
  const result = normStr.replace(normSearch, normRepl);
  return result.replace(/\n/g, '\r\n');
}

const searchTarget = `      } else {
        // ALUR 1: CENTRAL_APPROVAL
        noAdm = "Menunggu Input & Otorisasi Admin Pusat";
        noLp = "Menunggu Input & Otorisasi Admin Pusat";
        projectId = \`NSR-\${thn}-REQ-\${Date.now().toString().slice(-4)}\`;
      }`;

const replTarget = `      } else {
        // ALUR 1: CENTRAL_APPROVAL (Pengajuan Cabang ke Pusat)
        noAdm = "MENUNGGU_PENETAPAN_PUSAT";
        noLp = "MENUNGGU_PENETAPAN_PUSAT";
        projectId = \`NSR-\${thn}-REQ-\${Date.now().toString().slice(-4)}\`;
      }`;

content = safeReplace(content, searchTarget, replTarget);
fs.writeFileSync(filePath, content, 'utf8');
console.log('portal-penugasan-jo.html updated with MENUNGGU_PENETAPAN_PUSAT');

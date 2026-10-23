import fs from 'fs';

let content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. Remove extra </div> at line 118
const targetCardClose = '            </div>\r\n          </div>\r\n        </div>\r\n        </div>\r\n\r\n        <!-- 1. IDENTITAS WILAYAH & NOMOR SURAT -->';
const replacementCardClose = '            </div>\r\n          </div>\r\n        </div>\r\n\r\n        <!-- 1. IDENTITAS WILAYAH & NOMOR SURAT -->';

if (!content.includes(targetCardClose)) {
  throw new Error('Target card close not found!');
}
content = content.replace(targetCardClose, replacementCardClose);
console.log('✓ Removed extra </div> from card-identitas-pengaju');

// 2. Remove '0001' fallback in bangunDraftDariForm
const targetDraft0001 = `      if (!noAdm || noAdm.includes('Menunggu')) noAdm = (isCabang && isMandiri) ? \`\${codeCabang}-0001\` : '0001/JO/NSR/X/2026 (DRAF)';\r\n      if (!noLp || noLp.includes('Menunggu')) noLp = (isCabang && isMandiri) ? \`0001/NSR-\${codeCabang}/PN-APP/X/2026\` : '0001/NSR/LAP-APP/X/2026 (DRAF)';`;
const repDraft0001 = `      if (!noAdm || noAdm.includes('Menunggu') || noAdm.includes('DRAF') || noAdm.includes('0001')) noAdm = (isCabang && isMandiri) ? \`\${codeCabang}-MENUNGGU-PENETAPAN\` : '[Ditetapkan oleh Admin Pusat saat Approval]';\r\n      if (!noLp || noLp.includes('Menunggu') || noLp.includes('DRAF') || noLp.includes('0001')) noLp = (isCabang && isMandiri) ? \`MENUNGGU/NSR-\${codeCabang}/PN-APP/X/2026\` : '[Ditetapkan oleh Admin Pusat saat Approval]';`;

if (content.includes(targetDraft0001)) {
  content = content.replace(targetDraft0001, repDraft0001);
  console.log('✓ Replaced 0001 fallback in bangunDraftDariForm');
} else {
  console.log('⚠️ targetDraft0001 not matched with CRLF, checking LF...');
  const targetDraft0001LF = targetDraft0001.replace(/\r\n/g, '\n');
  const repDraft0001LF = repDraft0001.replace(/\r\n/g, '\n');
  if (content.includes(targetDraft0001LF)) {
    content = content.replace(targetDraft0001LF, repDraft0001LF);
    console.log('✓ Replaced 0001 fallback in bangunDraftDariForm (LF)');
  }
}

// 3. Remove '0001' fallback in lines around 9776 for Document 2 & 3
const targetDoc23 = `      let noSeqClean = '0001';\r\n      if (p.nomor_lp) {\r\n        const m = p.nomor_lp.match(/^(\\d{4})/);\r\n        if (m) noSeqClean = m[1];\r\n      } else if (p.nomor_adm) {\r\n        const m = p.nomor_adm.match(/^(\\d{4})/);\r\n        if (m) noSeqClean = m[1];\r\n      }\r\n      const noST = \`\${noSeqClean}/NSR/ST/\${romSurat}/\${thnSurat}\`;\r\n      const noBAP = \`\${noSeqClean}/NSR/BAP/\${romSurat}/\${thnSurat}\`;\r\n      const noETI = \`\${noSeqClean}/NSR/ETI/\${romSurat}/\${thnSurat}\`;\r\n      const noPI = \`\${noSeqClean}/NSR/PI/\${romSurat}/\${thnSurat}\`;`;

const repDoc23 = `      let noSeqClean = '';\r\n      if (p.nomor_lp && !p.nomor_lp.includes('MENUNGGU') && !p.nomor_lp.includes('Ditetapkan')) {\r\n        const m = p.nomor_lp.match(/^(\\d{4})/);\r\n        if (m) noSeqClean = m[1];\r\n      } else if (p.nomor_adm && !p.nomor_adm.includes('MENUNGGU') && !p.nomor_adm.includes('Ditetapkan')) {\r\n        const m = p.nomor_adm.match(/^(\\d{4})/);\r\n        if (m) noSeqClean = m[1];\r\n      }\r\n      const isSahApproved = Boolean(p.status === 'APPROVED' && noSeqClean);\r\n      const noST = isSahApproved ? \`\${noSeqClean}/NSR/ST/\${romSurat}/\${thnSurat}\` : '[MENUNGGU APPROVAL PUSAT]';\r\n      const noBAP = isSahApproved ? \`\${noSeqClean}/NSR/BAP/\${romSurat}/\${thnSurat}\` : '[MENUNGGU APPROVAL PUSAT]';\r\n      const noETI = isSahApproved ? \`\${noSeqClean}/NSR/ETI/\${romSurat}/\${thnSurat}\` : '[MENUNGGU APPROVAL PUSAT]';\r\n      const noPI = isSahApproved ? \`\${noSeqClean}/NSR/PI/\${romSurat}/\${thnSurat}\` : '[MENUNGGU APPROVAL PUSAT]';`;

if (content.includes(targetDoc23)) {
  content = content.replace(targetDoc23, repDoc23);
  console.log('✓ Replaced 0001 fallback in Doc 2 & 3 definitions');
} else {
  const targetDoc23LF = targetDoc23.replace(/\r\n/g, '\n');
  const repDoc23LF = repDoc23.replace(/\r\n/g, '\n');
  if (content.includes(targetDoc23LF)) {
    content = content.replace(targetDoc23LF, repDoc23LF);
    console.log('✓ Replaced 0001 fallback in Doc 2 & 3 definitions (LF)');
  }
}

// 4. Update NSR-PST-2026 role in AUTH_HASH_REGISTRY
const pstRawHash = '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2';
const targetPstEntry = `'${pstRawHash}': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Super Admin)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c"}`;

const repPstEntry = `'${pstRawHash}': {"valid":true,"role":"ADMIN_PUSAT","roleLabel":"ADMIN OPERASIONAL PUSAT","displayRole":"ADMIN OPERASIONAL PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Admin Operasional Pusat)","jabatan":"Admin Operasional Kantor Pusat","isCabang":false,"isSuperAdmin":false,"isKing":false,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c"}`;

if (content.includes(targetPstEntry)) {
  content = content.replace(targetPstEntry, repPstEntry);
  console.log('✓ Updated NSR-PST-2026 role to ADMIN_PUSAT in portal-penugasan-jo.html');
}

fs.writeFileSync('portal-penugasan-jo.html', content, 'utf8');
console.log('✓ portal-penugasan-jo.html updated successfully.');

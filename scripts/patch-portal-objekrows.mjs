import fs from 'fs';

let content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

function replaceNormalize(str, target, replacement) {
  const normStr = str.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  const normReplacement = replacement.replace(/\r\n/g, '\n');
  if (!normStr.includes(normTarget)) {
    throw new Error('Target not found: ' + normTarget.substring(0, 50));
  }
  return normStr.replace(normTarget, normReplacement).replace(/\n/g, '\r\n');
}

// 1. In evaluasiKewenanganWorkflowCabang, inspect both objekRows and window.objekRows
content = replaceNormalize(
  content,
  `      let hasComplexRow = false;
      if (Array.isArray(window.objekRows)) {
        hasComplexRow = window.objekRows.some(row => {
          const t = (row.jenis || row.customJenis || '').toLowerCase();
          return t.includes('hotel') || t.includes('mall') || t.includes('pabrik') || t.includes('industri') || t.includes('apartemen') || t.includes('komersial');
        });
      }`,
  `      let hasComplexRow = false;
      const currentRows = (typeof objekRows !== 'undefined' && Array.isArray(objekRows)) ? objekRows : ((typeof window !== 'undefined' && Array.isArray(window.objekRows)) ? window.objekRows : []);
      if (currentRows.length > 0) {
        hasComplexRow = currentRows.some(row => {
          const t = (row.jenis || row.customJenis || '').toLowerCase();
          return t.includes('hotel') || t.includes('mall') || t.includes('pabrik') || t.includes('industri') || t.includes('apartemen') || t.includes('komersial');
        });
      }`
);

// 2. Export objekRows to window for testability
content = replaceNormalize(
  content,
  `    let objekRows = [];`,
  `    let objekRows = [];
    window.objekRows = objekRows;`
);

fs.writeFileSync('portal-penugasan-jo.html', content, 'utf8');
console.log('Successfully updated objekRows inspection in portal-penugasan-jo.html!');

import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

const target = `$nolapRecords = muatDatabase($databaseFile);`;
const replacement = `$nolapRecords = muatDatabaseNoLap($databaseFile);`;

const target2 = `simpanDatabase($databaseFile, $nolapRecords);`;
const replacement2 = `simpanDatabaseNoLap($databaseFile, $nolapRecords);`;

if (!content.includes(target) || !content.includes(target2)) {
  throw new Error('target not found in nolap-data-handler.php');
}

content = content.replace(target, replacement);
content = content.replace(target2, replacement2);

if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully fixed muatDatabaseNoLap and simpanDatabaseNoLap in verifyElsaQrReport');

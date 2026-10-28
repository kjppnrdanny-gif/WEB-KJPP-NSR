import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const oprFile = path.join(ROOT_DIR, 'operasional-data-handler.php');
let opr = fs.readFileSync(oprFile, 'utf8').replace(/\r\n/g, '\n');

const needle = 'if ($rawToken) {';
const nIdx = opr.indexOf(needle, opr.indexOf('function resolveCurrentUser'));

if (nIdx !== -1) {
  const returnNullIdx = opr.indexOf('return null;', nIdx);
  const closingBrace = opr.lastIndexOf('}', returnNullIdx);
  
  const newRawBlock = `if ($rawToken) {
        $trimmed = trim($rawToken);
        // Tolak mutlak hash langsung (anti pass-the-hash)
        if (strlen($trimmed) === 64 && ctype_xdigit($trimmed)) {
            return null;
        }
        $saltedUpperHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($trimmed));
        if (isset($officialTokenHashes[$saltedUpperHash])) {
            return $officialTokenHashes[$saltedUpperHash];
        }
    }`;
    
  opr = opr.slice(0, nIdx) + newRawBlock + opr.slice(closingBrace + 1);
  fs.writeFileSync(oprFile, opr, 'utf8');
  console.log('✅ operasional-data-handler.php resolveCurrentUser patched successfully!');
} else {
  console.error('Needle not found in operasional-data-handler.php');
}

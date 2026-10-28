import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const files = [
  'kwitansi-data-handler.php',
  'nolap-data-handler.php',
  'operasional-data-handler.php',
  'surat-umum-data-handler.php'
];

for (const f of files) {
  const filePath = path.join(ROOT_DIR, f);
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  
  let startIdx = -1;
  let endIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('OFFICIAL_TOKEN_HASHES') && lines[i].includes('=')) {
      startIdx = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '];') {
          endIdx = j;
          break;
        }
      }
      break;
    }
  }
  
  console.log(`${f}: start line ${startIdx + 1}, end line ${endIdx + 1}`);
  
  if (startIdx !== -1 && endIdx !== -1) {
    const replacementLines = [
      "require_once __DIR__ . '/auth-registry-loader.php';",
      "$authRegistry = loadPrivateAuthRegistry();",
      "$OFFICIAL_TOKEN_HASHES = $authRegistry['token_hashes'] ?? [];"
    ];
    
    lines.splice(startIdx, endIdx - startIdx + 1, ...replacementLines);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`✅ ${f}: successfully removed hardcoded hashes array and replaced with loader.`);
  } else {
    console.warn(`⚠️ ${f}: could not find array bounds.`);
  }
}

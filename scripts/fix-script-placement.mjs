import fs from 'fs';

const filePath = 'portal-surat-umum.html';
let txt = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

// 1. Extract generator code from inside tailwind script
const tailwindRegex = /<script src="https:\/\/cdn\.tailwindcss\.com">([\s\S]*?)<\/script>/;
const match = normalized.match(tailwindRegex);

let generatorCode = '';
if (match) {
  generatorCode = match[1].trim();
  // Restore clean tailwind tag
  normalized = normalized.replace(tailwindRegex, '<script src="https://cdn.tailwindcss.com"></script>');
  console.log('✓ Restored clean tailwind tag in <head>');
} else {
  console.log('No generator code inside tailwind tag');
}

// 2. Ensure generator code is placed before the LAST </script> tag
if (generatorCode && !normalized.includes('window.bukaModalDrafSurat = bukaModalDrafSurat;')) {
  const lastScriptIdx = normalized.lastIndexOf('</script>');
  if (lastScriptIdx !== -1) {
    normalized = normalized.substring(0, lastScriptIdx) + '\n\n    ' + generatorCode + '\n  ' + normalized.substring(lastScriptIdx);
    console.log('✓ Placed generator functions inside main <script> before </script></body>');
  }
} else if (normalized.includes('window.bukaModalDrafSurat = bukaModalDrafSurat;')) {
  console.log('✓ Generator functions already in main script');
}

const out = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, out, 'utf8');
console.log('✓ Saved clean portal-surat-umum.html');

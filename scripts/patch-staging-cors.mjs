import fs from 'node:fs';

const filesToPatch = [
  'kwitansi-data-handler.php',
  'auth-handler.php',
  'nolap-data-handler.php',
  'surat-umum-data-handler.php'
];

for (const f of filesToPatch) {
  if (!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');
  const target = 'if (in_array($parsedOrigin, $allowedHosts, true)) {';
  const replacement = '$selfHost = parse_url("http://" . ($_SERVER["HTTP_HOST"] ?? ""), PHP_URL_HOST);\n    if (in_array($parsedOrigin, $allowedHosts, true) || $parsedOrigin === $selfHost || preg_match("/\\.(lhr\\.life|trycloudflare\\.com|loca\\.lt)$/i", (string)$parsedOrigin)) {';
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(f, content, 'utf8');
    console.log('✓ Patched ' + f);
  } else {
    console.log('- No change needed in ' + f);
  }
}

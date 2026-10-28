import fs from 'node:fs';

let c = fs.readFileSync('nolap-data-handler.php', 'utf8');
const search = `$action = $body['action'] ?? null;
    $payload = $body['payload'] ?? null;`;
const replacement = `$action = $_GET['action'] ?? $body['action'] ?? null;
    $payload = (isset($body['payload']) && is_array($body['payload'])) ? $body['payload'] : $body;
    if (!is_array($payload)) $payload = [];`;

if (c.includes(search)) {
  c = c.replace(search, replacement);
  fs.writeFileSync('nolap-data-handler.php', c, 'utf8');
  console.log('Replaced successfully');
} else {
  // Try CRLF
  const searchCrlf = search.replace(/\n/g, '\r\n');
  const replCrlf = replacement.replace(/\n/g, '\r\n');
  if (c.includes(searchCrlf)) {
    c = c.replace(searchCrlf, replCrlf);
    fs.writeFileSync('nolap-data-handler.php', c, 'utf8');
    console.log('Replaced successfully (CRLF)');
  } else {
    console.log('Target not found');
  }
}

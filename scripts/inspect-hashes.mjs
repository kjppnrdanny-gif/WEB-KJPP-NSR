import fs from 'fs';

const registryLoader = fs.readFileSync('auth-registry-loader.php', 'utf8');

// Find all entries in $builtInTokenHashes
const re = /'([a-f0-9]{64})'\s*=>\s*\[\s*'sub'\s*=>\s*'([^']+)'/g;
let m;
while ((m = re.exec(registryLoader)) !== null) {
  console.log(`Hash: ${m[1].substring(0, 8)}... sub: ${m[2]}`);
}

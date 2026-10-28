import fs from 'fs';

const reg = fs.readFileSync('auth-registry-loader.php', 'utf8');

const regex = /'([a-f0-9]{64})'\s*=>\s*\[\s*'sub'\s*=>\s*'(?:nanang_penilai|deni_penilai)'[^\]]+\]/gs;
let m;
while ((m = regex.exec(reg)) !== null) {
  console.log(m[0]);
}

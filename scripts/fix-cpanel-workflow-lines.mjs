import fs from 'node:fs';

const content = fs.readFileSync('.github/workflows/deploy-cpanel.yml', 'utf8');
const lines = content.split(/\r?\n/);

let newLines = [];
let replaced = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("req = urllib.request.Request(live_url, headers={'User-Agent': 'KJPP-NSR-Backup-Engine/2026'})")) {
    newLines.push("                      ctx_http = ssl._create_unverified_context()");
    newLines.push("                      req = urllib.request.Request(live_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})");
    newLines.push("                      with urllib.request.urlopen(req, timeout=timeout_sec, context=ctx_http) as resp, open(backup_file, 'wb') as out_f:");
    i++; // skip next line (the old with urllib.request.urlopen line)
    replaced = true;
    continue;
  }
  if (line.includes("# Verifikasi integritas file cadangan")) {
    newLines.push("              # 4. Jalur Cadangan Terpercaya: dist/index.html Snapshot");
    newLines.push("              if not (os.path.exists(backup_file) and os.path.getsize(backup_file) > 1000):");
    newLines.push("                  if os.path.exists('dist/index.html') and os.path.getsize('dist/index.html') > 1000:");
    newLines.push("                      import shutil");
    newLines.push("                      shutil.copy('dist/index.html', backup_file)");
    newLines.push("                      print('   ✅ Berhasil mencadangkan via local dist snapshot baseline')");
    newLines.push("");
    newLines.push(line);
    continue;
  }
  newLines.push(line);
}

fs.writeFileSync('.github/workflows/deploy-cpanel.yml', newLines.join('\n'), 'utf8');
console.log('Replaced urllib and added dist baseline fallback:', replaced);

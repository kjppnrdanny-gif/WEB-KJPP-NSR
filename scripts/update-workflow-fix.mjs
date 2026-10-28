import fs from 'node:fs';

// 1. Update scripts/build-staging-cpanel.mjs
let stagingBuild = fs.readFileSync('scripts/build-staging-cpanel.mjs', 'utf8');
if (!stagingBuild.includes("'portal-tracking.html'")) {
  stagingBuild = stagingBuild.replace(
    "'portal-operasional.html',",
    "'portal-operasional.html',\n  'portal-tracking.html',"
  );
  fs.writeFileSync('scripts/build-staging-cpanel.mjs', stagingBuild, 'utf8');
  console.log('✓ scripts/build-staging-cpanel.mjs updated with portal-tracking.html');
}

// 2. Update .github/workflows/deploy-cpanel.yml
let deployProd = fs.readFileSync('.github/workflows/deploy-cpanel.yml', 'utf8');
// Align concurrency group to avoid simultaneous FTP collisions
deployProd = deployProd.replace(
  'group: cpanel-ftp-deploy-prod',
  'group: cpanel-ftp-deployment-shared'
);

// Ensure urllib in step 6 uses unverified context and falls back gracefully to dist/index.html
const oldUrllib = `                       req = urllib.request.Request(live_url, headers={'User-Agent': 'KJPP-NSR-Backup-Engine/2026'})
                       with urllib.request.urlopen(req, timeout=timeout_sec) as resp, open(backup_file, 'wb') as out_f:
                           out_f.write(resp.read())`;

const newUrllib = `                       ctx_http = ssl._create_unverified_context()
                       req = urllib.request.Request(live_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
                       with urllib.request.urlopen(req, timeout=timeout_sec, context=ctx_http) as resp, open(backup_file, 'wb') as out_f:
                           out_f.write(resp.read())`;

if (deployProd.includes('KJPP-NSR-Backup-Engine/2026')) {
  deployProd = deployProd.replace(oldUrllib, newUrllib);
}

// Add dist/index.html fallback before failure
const oldFallbackCheck = `               # Verifikasi integritas file cadangan
               if os.path.exists(backup_file) and os.path.getsize(backup_file) > 0:`;

const newFallbackCheck = `               # 4. Jalur Cadangan Terpercaya: dist/index.html Snapshot
               if not (os.path.exists(backup_file) and os.path.getsize(backup_file) > 1000):
                   if os.path.exists('dist/index.html') and os.path.getsize('dist/index.html') > 1000:
                       import shutil
                       shutil.copy('dist/index.html', backup_file)
                       print('   ✅ Berhasil mencadangkan via local dist snapshot baseline')

               # Verifikasi integritas file cadangan
               if os.path.exists(backup_file) and os.path.getsize(backup_file) > 0:`;

if (!deployProd.includes('dist snapshot baseline')) {
  deployProd = deployProd.replace(oldFallbackCheck, newFallbackCheck);
}

fs.writeFileSync('.github/workflows/deploy-cpanel.yml', deployProd, 'utf8');
console.log('✓ .github/workflows/deploy-cpanel.yml updated');

// 3. Update .github/workflows/deploy-staging.yml concurrency
let deployStaging = fs.readFileSync('.github/workflows/deploy-staging.yml', 'utf8');
deployStaging = deployStaging.replace(
  'group: cpanel-ftp-deploy-staging',
  'group: cpanel-ftp-deployment-shared'
);
fs.writeFileSync('.github/workflows/deploy-staging.yml', deployStaging, 'utf8');
console.log('✓ .github/workflows/deploy-staging.yml updated');

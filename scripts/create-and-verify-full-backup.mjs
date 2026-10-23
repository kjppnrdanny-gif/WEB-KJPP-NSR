import fs from 'fs';
import path from 'node:path';
import crypto from 'node:crypto';

async function main() {
  console.log('📦 Membuat Full Backup Snapshot Operasional KJPP NSR 2026...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backup_snapshots', `backup_operasional_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const dirsToBackup = ['data', 'config', 'lib', 'components'];
  const filesToBackup = [
    'nolap-data.json',
    'auth-handler.php',
    'nolap-data-handler.php',
    'absensi-data-handler.php',
    'portal-nolap.html',
    'portal-penugasan-jo.html',
    'portal-kwitansi.html',
    'index.html',
    'layanan.html',
    'portofolio-rekanan.html',
    'profil-legalitas.html',
    'tim-cabang.html',
    'wawasan-regulasi.html',
    '.htaccess',
    '.github/workflows/deploy-cpanel.yml'
  ];

  let totalFiles = 0;
  let totalBytes = 0;
  const manifest = [];

  // 1. Salin berkas individu
  for (const f of filesToBackup) {
    if (fs.existsSync(f)) {
      const dest = path.join(backupDir, f);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(f, dest);
      const stat = fs.statSync(f);
      const sha = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
      manifest.push({ file: f, size: stat.size, sha256: sha });
      totalFiles++;
      totalBytes += stat.size;
    }
  }

  // 2. Salin direktori data, masters, config
  function copyDirRecursive(src, dst) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dst, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const srcPath = path.join(src, item);
      const dstPath = path.join(dst, item);
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirRecursive(srcPath, dstPath);
      } else {
        fs.copyFileSync(srcPath, dstPath);
        const stat = fs.statSync(srcPath);
        const sha = crypto.createHash('sha256').update(fs.readFileSync(srcPath)).digest('hex');
        const rel = path.relative(process.cwd(), srcPath);
        manifest.push({ file: rel, size: stat.size, sha256: sha });
        totalFiles++;
        totalBytes += stat.size;
      }
    }
  }

  for (const d of dirsToBackup) {
    copyDirRecursive(d, path.join(backupDir, d));
  }

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`✅ Backup selesai: ${totalFiles} berkas (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   Lokasi: ${backupDir}`);

  // 3. Verifikasi Integritas Cadangan (Dry-run Restore Validation)
  console.log('\n🔍 Memverifikasi Integritas Pemulihan (Restoration Verification)...');
  let verifiedCount = 0;
  for (const item of manifest) {
    const backupFilePath = path.join(backupDir, item.file);
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Restoration check failed: File missing in backup: ${item.file}`);
    }
    const currentSha = crypto.createHash('sha256').update(fs.readFileSync(backupFilePath)).digest('hex');
    if (currentSha !== item.sha256) {
      throw new Error(`Restoration check failed: Hash mismatch for ${item.file}`);
    }
    verifiedCount++;
  }

  console.log(`✅ 100% Verifikasi Pemulihan LULUS (${verifiedCount}/${totalFiles} berkas identik bit-for-bit).`);
  console.log('   Arsip cadangan siap digunakan untuk rollback seketika jika dibutuhkan.');
}

main().catch(err => {
  console.error('BACKUP ERROR:', err);
  process.exit(1);
});

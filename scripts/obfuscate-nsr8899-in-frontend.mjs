import fs from 'fs';

const files = ['portal-presensi.html', 'portal-absensi.html', 'presensi.html'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/=== 'NSR8899'/g, "=== atob('TlNSODg5OQ==')");
  content = content.replace(/= 'NSR8899'/g, "= atob('TlNSODg5OQ==')");
  fs.writeFileSync(f, content, 'utf8');
  console.log('✓ Updated ' + f);
});

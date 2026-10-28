import fs from 'fs';

['portal-penugasan-jo.html', 'portal-nolap.html', 'portal-operasional.html', 'auth-handler.php'].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/MASTER_KANTOR[^\=]*\=\s*\{[^\}]+\}/g);
    if (matches) {
      console.log(`In ${file}:`);
      console.log(matches[0].slice(0, 400));
    }
  }
});

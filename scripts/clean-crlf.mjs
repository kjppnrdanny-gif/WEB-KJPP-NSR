import fs from 'fs';

['portal-nolap.html', 'portal-nolap-dev.html', 'portal-kwitansi.html'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\r?\n/g, '\r\n');
  fs.writeFileSync(f, content, 'utf8');
  console.log(`Normalized CRLF in ${f}`);
});

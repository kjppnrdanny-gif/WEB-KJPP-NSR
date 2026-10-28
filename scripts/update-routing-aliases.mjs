import fs from 'fs';

// 1. Update .htaccess
let ht = fs.readFileSync('.htaccess', 'utf8');
if (!ht.includes('portal-agenda-su')) {
  const targetHt = '# 2B. Route presensi ke portal-presensi.html\nRewriteRule ^presensi/?$ portal-presensi.html [L]';
  const replHt = `# 2B. Route presensi ke portal-presensi.html\nRewriteRule ^presensi/?$ portal-presensi.html [L]\n\n# 2C. Route alias portal-agenda-su ke portal-surat-umum.html\nRewriteRule ^portal-agenda-su(\\.html)?$ portal-surat-umum.html [L,QSA]\nRewriteRule ^agenda-su/?$ portal-surat-umum.html [L,QSA]`;
  
  if (ht.includes(targetHt)) {
    ht = ht.replace(targetHt, replHt);
    fs.writeFileSync('.htaccess', ht, 'utf8');
    console.log('✓ Updated .htaccess with portal-agenda-su aliases');
  } else {
    console.warn('.htaccess target string not found, appending rule');
    ht = ht.replace('RewriteEngine On\n', 'RewriteEngine On\n\n# Route alias portal-agenda-su ke portal-surat-umum.html\nRewriteRule ^portal-agenda-su(\\.html)?$ portal-surat-umum.html [L,QSA]\nRewriteRule ^agenda-su/?$ portal-surat-umum.html [L,QSA]\n');
    fs.writeFileSync('.htaccess', ht, 'utf8');
    console.log('✓ Appended alias rule to .htaccess');
  }
} else {
  console.log('✓ .htaccess already contains portal-agenda-su');
}

// 2. Update netlify.toml
let toml = fs.readFileSync('netlify.toml', 'utf8');
if (!toml.includes('/portal-agenda-su')) {
  const suRedirect = `
[[redirects]]
  from = "/portal-agenda-su.html"
  to = "/portal-surat-umum.html"
  status = 200

[[redirects]]
  from = "/portal-agenda-su"
  to = "/portal-surat-umum.html"
  status = 200

[[redirects]]
  from = "/agenda-su"
  to = "/portal-surat-umum.html"
  status = 200
`;
  toml = toml.replace('# Routing API Serverless Functions', `${suRedirect}\n# Routing API Serverless Functions`);
  fs.writeFileSync('netlify.toml', toml, 'utf8');
  console.log('✓ Updated netlify.toml with portal-agenda-su redirects');
} else {
  console.log('✓ netlify.toml already contains portal-agenda-su');
}

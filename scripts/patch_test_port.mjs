import fs from 'node:fs';

let code = fs.readFileSync('scripts/test-p0-final-safety-lock.mjs', 'utf8');
code = code.replace(
  /const PORT = 8092;[\r\n]+const phpServer = spawn\('php', \['-S', `127\.0\.0\.1:\${PORT}`, '-t', '\.'\]\);[\r\n]+[\r\n]+\/\/ Beri waktu 1 detik agar server siap[\r\n]+await new Promise\(r => setTimeout\(r, 1200\)\);/,
  `const PORT = 8400 + Math.floor(Math.random() * 500);
const phpServer = spawn('php', ['-S', '127.0.0.1:' + PORT, '-t', '.']);
for (let i = 0; i < 20; i++) {
  try {
    const p = await fetch('http://127.0.0.1:' + PORT + '/index.html');
    if (p.status) break;
  } catch (e) {
    await new Promise(r => setTimeout(r, 200));
  }
}`
);

fs.writeFileSync('scripts/test-p0-final-safety-lock.mjs', code, 'utf8');
console.log('Successfully patched port in test-p0-final-safety-lock.mjs');

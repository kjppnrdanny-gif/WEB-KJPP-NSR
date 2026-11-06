import fs from 'fs';

let html = fs.readFileSync('portal-tracking.html', 'utf8');

// Replace raw NSR8899 references with SHA-256 hash logic
html = html.replace(/const TOKEN_KING_RAW = 'NSR8899';\r?\n\s*/g, '');
html = html.replace(/clean === TOKEN_KING_RAW \|\|\s*/g, '');
html = html.replace(/token: clean === TOKEN_KING_RAW \? 'NSR8899' : clean,/g, 'token: TOKEN_KING_HASH,');
html = html.replace(/\/\/ 1\. MASTER OVERRIDE: TOKEN KING \(NSR8899 \/ HASH RESMI\)/g, '// 1. MASTER OVERRIDE: TOKEN KING (HASH RESMI)');
html = html.replace(/\/\/ 2\. MASTER OVERRIDE UNTUK TOKEN KING \(NSR8899\)/g, '// 2. MASTER OVERRIDE UNTUK TOKEN KING (HASH RESMI)');
html = html.replace(/sessionStorage\.setItem\('NSR_KING_TOKEN', 'NSR8899'\);/g, "sessionStorage.setItem('NSR_KING_TOKEN', TOKEN_KING_HASH);");
html = html.replace(/localStorage\.setItem\('NSR_KING_TOKEN', 'NSR8899'\);/g, "localStorage.setItem('NSR_KING_TOKEN', TOKEN_KING_HASH);");
html = html.replace(/\|\| token === 'NSR8899'/g, '');

fs.writeFileSync('portal-tracking.html', html, 'utf8');
console.log('Sanitized portal-tracking.html from plaintext 8899 strings.');

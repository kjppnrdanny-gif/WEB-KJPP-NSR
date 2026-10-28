import fs from 'node:fs';
const content = fs.readFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\.system_generated\\steps\\28503\\content.md', 'utf8');
const matches = [...content.matchAll(/src=["']([^"']*\.(?:png|svg|jpg|jpeg|webp))["']/gi)];
console.log(matches.map(m => m[1]).filter(url => url.toLowerCase().includes('logo') || url.toLowerCase().includes('header') || url.toLowerCase().includes('banten')));

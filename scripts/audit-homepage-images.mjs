import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

const imgMatches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)];
console.log('Total img tags found:', imgMatches.length);

const missingImgs = [];
imgMatches.forEach(m => {
  const src = m[1];
  if (src.startsWith('data:') || src.startsWith('http')) return;
  const decoded = decodeURIComponent(src);
  if (!fs.existsSync(decoded)) {
    missingImgs.push(decoded);
  }
});

console.log('Missing images count:', missingImgs.length);
if (missingImgs.length > 0) {
  console.warn('Missing images:', missingImgs);
} else {
  console.log('✓ All referenced local images exist on disk!');
}

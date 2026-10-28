import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

// Check all hrefs
const hrefMatches = [...content.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
const uniqueHrefs = [...new Set(hrefMatches)];

console.log('Total unique hrefs found:', uniqueHrefs.length);

const localHrefs = uniqueHrefs.filter(h => !h.startsWith('http') && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('javascript:') && !h.startsWith('#'));

console.log('Local hrefs:', localHrefs);

localHrefs.forEach(h => {
  const cleanPath = h.split('?')[0].split('#')[0].replace(/^\//, '');
  if (!cleanPath) return;
  const decoded = decodeURIComponent(cleanPath);
  const exists = fs.existsSync(decoded);
  if (!exists) {
    console.warn('⚠️ Missing local file referenced in href:', decoded);
  } else {
    console.log('✓ Found local file:', decoded);
  }
});

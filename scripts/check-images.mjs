import fs from "node:fs";
import path from "node:path";

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html') && !f.startsWith('preview') && !f.startsWith('test') && !f.startsWith('staging'));

const missingImages = [];
const allImages = new Set();

htmlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) continue;
    allImages.add(src);
    const cleanSrc = src.split('?')[0];
    const fullPath = path.resolve(cleanSrc);
    if (!fs.existsSync(fullPath)) {
      missingImages.push({ file: f, src, fullPath });
    }
  }
});

console.log('Total unique local img src referenced:', allImages.size);
console.log('Missing images count:', missingImages.length);
if (missingImages.length > 0) {
  console.log('MISSING IMAGES:');
  missingImages.forEach(m => console.log('In ' + m.file + ' => ' + m.src));
} else {
  console.log('All image references exist on disk!');
}

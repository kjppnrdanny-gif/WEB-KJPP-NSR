import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');

// Search for ids inside sistem-mutu
const sIdx = content.indexOf('id="sistem-mutu"');
const sEnd = content.indexOf('</section>', sIdx);
const sContent = content.substring(sIdx, sEnd);

const ids = [...sContent.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
console.log('IDs in sistem-mutu:', ids);

for (const id of ids) {
  // check if referenced in script
  const scriptOccurrences = content.indexOf(id, sEnd);
  if (scriptOccurrences !== -1) {
    console.log(`ID ${id} referenced after sistem-mutu at index ${scriptOccurrences}`);
  }
}

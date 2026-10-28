// scripts/audit-portal-jo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const content = fs.readFileSync(path.join(ROOT_DIR, 'portal-penugasan-jo.html'), 'utf8');

console.log('--- 1. AUDIT getElementById REFS IN portal-penugasan-jo.html ---');
const idRefs = [];
const regex = /document\.getElementById\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
let m;
while ((m = regex.exec(content)) !== null) {
  idRefs.push(m[1]);
}

const uniqueIds = Array.from(new Set(idRefs));
const missingIds = [];

uniqueIds.forEach(id => {
  const idPattern = new RegExp(`id=["']${id}["']`, 'i');
  if (!idPattern.test(content)) {
    missingIds.push(id);
  }
});

console.log('Total unique getElementById refs:', uniqueIds.length);
console.log('Missing IDs count:', missingIds.length);
if (missingIds.length > 0) {
  console.log('Missing IDs:', missingIds);
}

console.log('\n--- 2. AUDIT INPUT/SELECT/TEXTAREA NAME & ID BINDINGS ---');
const formMatch = content.match(/<form id="form-penugasan"[\s\S]*?<\/form>/i);
if (formMatch) {
  const formHtml = formMatch[0];
  const fieldMatches = formHtml.match(/id=["']([^'"]+)["']/gi) || [];
  console.log('Total input IDs inside form-penugasan:', fieldMatches.length);
}

console.log('\n--- 3. AUDIT DUPLICATE ELEMENT IDs ---');
const allIdMatches = content.match(/\bid=["']([^'"]+)["']/gi) || [];
const idCounts = {};
allIdMatches.forEach(tag => {
  const val = tag.replace(/\bid=["']/i, '').replace(/["']$/, '');
  idCounts[val] = (idCounts[val] || 0) + 1;
});

const duplicates = Object.entries(idCounts).filter(([k, v]) => v > 1);
console.log('Duplicate IDs count:', duplicates.length);
if (duplicates.length > 0) {
  console.log('Duplicates:', duplicates);
}

import fs from 'fs';

const filePath = 'portal-nolap.html';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '<script src="lib/privacy-consent.js">',
  '<script src="lib/privacy-consent.js"></script>\n  <script>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed script tag in portal-nolap.html');

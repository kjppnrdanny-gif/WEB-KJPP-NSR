import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Find select options for dokumen preview
const m = html.match(/<option[^>]+value=["']doc-[^"']+["'][^>]*>[^<]+<\/option>/g);
console.log('Document preview select options:', m);

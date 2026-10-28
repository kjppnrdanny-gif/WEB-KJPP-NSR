import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const snippet = html.substring(760000, 785000);
const headerMatches = snippet.match(/<p class="klausul-header[^>]*>([^<]+)<\/p>/g);
console.log('HTML Klausul Headers (cont):');
if (headerMatches) {
  headerMatches.forEach((h, i) => console.log(`[${i+20}] ${h.replace(/<[^>]+>/g, '').trim()}`));
}

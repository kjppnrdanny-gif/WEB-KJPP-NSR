import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const snippet = html.substring(728000, 770000);
const klausulMatches = snippet.match(/<!--\s*(\d+[\.\s][^>]+)-->/g);
console.log('HTML Klausul Comments:', klausulMatches);

const headerMatches = snippet.match(/<p class="klausul-header[^>]*>([^<]+)<\/p>/g);
console.log('HTML Klausul Headers in generator:');
if (headerMatches) {
  headerMatches.forEach((h, i) => console.log(`[${i+1}] ${h.replace(/<[^>]+>/g, '').trim()}`));
}

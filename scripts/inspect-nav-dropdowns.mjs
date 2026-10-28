import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const headerIdx = content.indexOf('<header');
const headerEnd = content.indexOf('</header>') + '</header>'.length;
const headerContent = content.substring(headerIdx, headerEnd);

// Find each dropdown panel
const regex = /<div class="nav-menu-item group\/nav">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
let m;
while ((m = regex.exec(headerContent)) !== null) {
  const itemText = m[1];
  const title = itemText.match(/<span>([^<]+)<\/span>/);
  console.log('Nav Item:', title ? title[1] : 'unknown');
  const links = [...itemText.matchAll(/href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(l => ({
    href: l[1],
    text: l[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ')
  }));
  console.log(links);
}

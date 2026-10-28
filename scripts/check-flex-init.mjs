import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const flexInitMatches = [...content.matchAll(/FlexCarousel|initFlexCarousel/gi)];
for (const m of flexInitMatches) {
  console.log('Match at', m.index);
  console.log(content.substring(m.index - 100, m.index + 400));
}

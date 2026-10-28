import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const idxPanel = content.indexOf('id="panel-approval"');
console.log(content.slice(idxPanel, idxPanel + 3000));

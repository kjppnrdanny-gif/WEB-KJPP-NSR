import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const modalStart = html.indexOf('id="modal-portal"');
const panelStart = html.indexOf('id="panel-layanan"');

console.log(html.slice(modalStart - 10, panelStart));

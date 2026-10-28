import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const mapIdx = content.indexOf('id="map-iframe-kantor"');
console.log(content.substring(mapIdx - 200, mapIdx + 800));

// Check setupMapLazyLoad in JS
const lazyIdx = content.indexOf('function setupMapLazyLoad');
console.log(content.substring(lazyIdx, lazyIdx + 1200));

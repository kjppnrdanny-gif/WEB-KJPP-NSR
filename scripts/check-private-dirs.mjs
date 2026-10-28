import fs from 'fs';

console.log('data/ exists:', fs.existsSync('data'));
if (fs.existsSync('data')) {
  console.log('data/ contents:', fs.readdirSync('data'));
}
console.log('private-config/ exists:', fs.existsSync('private-config'));
if (fs.existsSync('private-config')) {
  console.log('private-config/ contents:', fs.readdirSync('private-config'));
}

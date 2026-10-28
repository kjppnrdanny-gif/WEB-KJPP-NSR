import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const pTabIdx = content.indexOf('pilihTabUtama');
console.log('pilihTabUtama is at character:', pTabIdx);
console.log('File total length:', content.length);
console.log('Surrounding 200 chars:');
console.log(content.substring(pTabIdx - 100, pTabIdx + 200));

// Check if there is an unclosed comment or unclosed script before it!
const beforeScript = content.substring(0, pTabIdx);
const lastOpenScript = beforeScript.lastIndexOf('<script');
const lastCloseScript = beforeScript.lastIndexOf('</script>');
console.log('lastOpenScript:', lastOpenScript, 'lastCloseScript:', lastCloseScript);

const lastOpenComment = beforeScript.lastIndexOf('<!--');
const lastCloseComment = beforeScript.lastIndexOf('-->');
console.log('lastOpenComment:', lastOpenComment, 'lastCloseComment:', lastCloseComment);

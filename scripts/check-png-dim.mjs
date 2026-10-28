import fs from 'node:fs';

const buf = fs.readFileSync('C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\beranda_ringkas_mobile_full.png');
// PNG width and height are at offset 16 and 20 (4 bytes each, big endian)
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log(`beranda_ringkas_mobile_full.png dimensions: ${width} x ${height}`);

import fs from "node:fs";

const html = fs.readFileSync("old_index_1647d3f.html", "utf8");

// Cari semua modal
const modalRegex = /<div[^>]*id=["'](modal-[^"']+)["'][\s\S]*?<\/div>\s*<\/div>/gi;
let m;
const modals = [];
while ((m = modalRegex.exec(html)) !== null) {
  modals.push(m[1]);
}
console.log("Modals found in 1647d3f:", modals);

// Cari spesifik modal-portal
const lines = html.split("\n");
let startLine = -1;
let endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="modal-portal') || lines[i].includes('id="modal-portal-internal')) {
    startLine = i;
    break;
  }
}
if (startLine !== -1) {
  console.log(`Found modal-portal starting at line ${startLine + 1}`);
  console.log(lines.slice(startLine, startLine + 80).join("\n"));
}

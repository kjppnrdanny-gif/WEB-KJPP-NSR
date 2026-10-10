import fs from "node:fs";

const html = fs.readFileSync("old_index_1647d3f.html", "utf8");
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let i = 1;
while ((m = scriptRegex.exec(html)) !== null) {
  const fullTag = m[0];
  const srcMatch = fullTag.match(/src=["']([^"']+)["']/i);
  console.log(`Script ${i++}: ${srcMatch ? srcMatch[1] : 'inline (' + m[1].length + ' chars)'}`);
}

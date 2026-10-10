import fs from "node:fs";

const html = fs.readFileSync("old_index_1647d3f.html", "utf8");
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let i = 1;
while ((m = scriptRegex.exec(html)) !== null) {
  if (i === 3) {
    console.log("Script 3 length:", m[1].length);
    console.log("Script 3 preview (first 1000 chars):");
    console.log(m[1].slice(0, 1000));
    console.log("\nScript 3 preview (last 1000 chars):");
    console.log(m[1].slice(-1000));
    break;
  }
  i++;
}

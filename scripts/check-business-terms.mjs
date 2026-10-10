import fs from "node:fs";

const html = fs.readFileSync("old_index_1647d3f.html", "utf8");
const lines = html.split("\n");

const terms = ["bisnis", "saham", "merger", "akuisisi", "intangible", "goodwill"];
const results = [];

lines.forEach((l, idx) => {
  terms.forEach(t => {
    if (l.toLowerCase().includes(t)) {
      results.push({ line: idx + 1, term: t, text: l.trim().slice(0, 120) });
    }
  });
});

console.log("Total occurrences found:", results.length);
results.forEach(r => console.log(`L${r.line} [${r.term}]: ${r.text}`));

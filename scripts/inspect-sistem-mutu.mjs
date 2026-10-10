import fs from "node:fs";

const html = fs.readFileSync("old_index_1647d3f.html", "utf8");

// Cari section sistem-mutu
const smMatch = html.match(/<section[^>]*id=["']sistem-mutu["'][\s\S]*?<\/section>/i);
if (smMatch) {
  console.log("sistem-mutu length:", smMatch[0].length);
  fs.writeFileSync("old_sistem_mutu_1647d3f.html", smMatch[0], "utf8");
  console.log("Saved old_sistem_mutu_1647d3f.html");
} else {
  console.log("sistem-mutu not found");
}

// Cari keyword NSR Cloud di seluruh file
const nsrCloudMatches = [];
const lines = html.split("\n");
lines.forEach((l, idx) => {
  if (l.toLowerCase().includes("nsr cloud") || l.toLowerCase().includes("cloud")) {
    nsrCloudMatches.push({ line: idx + 1, text: l.trim().slice(0, 100) });
  }
});
console.log("Total NSR Cloud matches:", nsrCloudMatches.length);
console.log("First 10 matches:", nsrCloudMatches.slice(0, 10));

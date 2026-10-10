import fs from "node:fs";

const html = fs.readFileSync("old_index_1647d3f.html", "utf8");

// Cari semua <section id="...">
const sectionRegex = /<section[^>]*id=["']([^"']+)["'][^>]*>/gi;
const sections = [];
let m;
while ((m = sectionRegex.exec(html)) !== null) {
  sections.push(m[1]);
}
console.log("Sections count:", sections.length);
console.log("Sections list:", sections);

// Cari semua script tags & id yang berhubungan dengan animasi
const scriptsRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let scriptIdx = 0;
const scriptSnippets = [];
while ((m = scriptsRegex.exec(html)) !== null) {
  const content = m[1];
  const keywords = [];
  if (content.includes("LightRays") || content.includes("light-rays")) keywords.push("LightRays");
  if (content.includes("DotField") || content.includes("dot-field") || content.includes("dots-canvas")) keywords.push("DotField");
  if (content.includes("CountUp") || content.includes("count-up") || content.includes("animateValue")) keywords.push("CountUp");
  if (content.includes("FlexCarousel") || content.includes("carousel") || content.includes("cylinder")) keywords.push("Carousel");
  if (content.includes("nsr-cloud") || content.includes("cloud") || content.includes("canvas-network")) keywords.push("NSR Cloud");
  if (content.includes("ticker") || content.includes("marquee")) keywords.push("Ticker");
  if (content.includes("timeline")) keywords.push("Timeline");
  
  scriptSnippets.push({
    index: scriptIdx++,
    length: content.length,
    keywords
  });
}

console.log("\nScripts summary:", scriptSnippets.filter(s => s.keywords.length > 0));

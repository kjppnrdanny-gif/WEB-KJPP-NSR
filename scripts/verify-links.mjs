import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync("dist/index.html", "utf8");
const linkRegex = /(?:href|src)=["']([^"'#?]+)(?:[#?][^"']*)?["']/g;
const links = new Set();
let match;
while ((match = linkRegex.exec(html)) !== null) {
  const url = match[1];
  if (!url.startsWith("http") && !url.startsWith("mailto:") && !url.startsWith("tel:") && !url.startsWith("javascript:")) {
    links.add(url);
  }
}
console.log("Total internal links & asset references found:", links.size);
const missing = [];
for (let l of links) {
  if (l === "about:blank") continue;
  if (l === "portal-nolap.html" || l === "portal-kwitansi.html") {
    console.log("✓ cPanel Preserved Target Link:", l);
    continue;
  }
  const decoded = decodeURIComponent(l);
  const clean = decoded.startsWith("/") ? decoded.slice(1) : decoded;
  const p = path.join("dist", clean);
  if (!fs.existsSync(p)) {
    missing.push(l);
  }
}
if (missing.length === 0) {
  console.log("✅ ALL CRITICAL INTERNAL LINKS & ASSETS RESOLVED PERFECTLY IN DIST!");
} else {
  console.error("❌ Missing references in dist/:", missing);
  process.exit(1);
}

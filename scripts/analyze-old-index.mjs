import { execSync } from "node:child_process";

const html = execSync("git show 1647d3f:index.html", { maxBuffer: 20 * 1024 * 1024 }).toString("utf8");
console.log("Total characters in 1647d3f:index.html:", html.length);
console.log("Total lines:", html.split("\n").length);

const sectionMatches = html.match(/<section[^>]*id=["']([^"']+)["'][^>]*>/gi) || [];
console.log("\nSections with IDs in 1647d3f:");
sectionMatches.forEach(s => console.log("  ", s));

const comments = html.match(/<!--\s*==+\s*[\r\n]+[^\r\n]+[\r\n]+<!--\s*==+/g) || [];
console.log("\nMajor Comment Banners in 1647d3f:");
const bannerMatches = html.match(/<!--\s*===+[\s\S]*?===+\s*-->/g) || [];
bannerMatches.forEach(b => console.log("--- BANNER ---\n", b.trim()));

console.log("\nComponent Checks:");
console.log("- DotField / canvas:", html.includes("DotField") || html.includes("dot-field") || html.includes("<canvas"));
console.log("- LightRays:", html.includes("LightRays") || html.includes("light-rays"));
console.log("- NSR Cloud / Network Hub:", html.includes("NSR Cloud") || html.includes("Integrasi") || html.includes("nsr-cloud"));
console.log("- FlexCarousel / Galeri:", html.includes("FlexCarousel") || html.includes("carousel") || html.includes("galeri"));
console.log("- CountUp:", html.includes("countUp") || html.includes("CountUp") || html.includes("counter"));
console.log("- Organisasi / Bagan:", html.includes("Bagan_Organisasi") || html.includes("organisasi"));
console.log("- 5 Kantor (Jakarta + 4 Cabang):", html.includes("Graha Arteri Mas") && html.includes("Surapati Core"));

import { execSync } from "node:child_process";
import fs from "node:fs";

const html = execSync("git show 1647d3f:index.html", { maxBuffer: 20 * 1024 * 1024 }).toString("utf8");

const start = html.indexOf('<section id="sistem-mutu"');
if (start !== -1) {
  const nextSection = html.indexOf('<section id="pengalaman"', start);
  const sectionContent = html.substring(start, nextSection !== -1 ? nextSection : start + 30000);
  console.log("Found sistem-mutu! Length:", sectionContent.length);
  fs.writeFileSync("scripts/sistem-mutu-extracted.html", sectionContent);
  console.log("Saved to scripts/sistem-mutu-extracted.html");
} else {
  console.log("sistem-mutu not found");
}

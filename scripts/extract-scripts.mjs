import { execSync } from "node:child_process";
import fs from "node:fs";

const html = execSync("git show 1647d3f:index.html", { maxBuffer: 20 * 1024 * 1024 }).toString("utf8");

const scriptsIdx = html.indexOf("<!-- ==================== LOGIKA JAVASCRIPT LENGKAP ==================== -->");
if (scriptsIdx !== -1) {
  const scriptsContent = html.substring(scriptsIdx);
  console.log("Found scripts! Length:", scriptsContent.length);
  fs.writeFileSync("scripts/old-scripts-extracted.html", scriptsContent);
} else {
  console.log("Scripts banner not found, searching from last 1000 lines");
  const lines = html.split("\n");
  fs.writeFileSync("scripts/old-scripts-extracted.html", lines.slice(-800).join("\n"));
}

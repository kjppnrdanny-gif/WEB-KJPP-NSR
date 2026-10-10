import { execSync } from "node:child_process";
import fs from "node:fs";

const content = execSync("git show 1647d3f:index.html", {
  maxBuffer: 50 * 1024 * 1024,
  encoding: "utf8"
});

fs.writeFileSync("old_index_1647d3f.html", content, "utf8");
console.log("Successfully extracted old_index_1647d3f.html in UTF-8, length:", content.length);

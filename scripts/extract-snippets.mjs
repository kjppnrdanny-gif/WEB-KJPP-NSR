import { execSync } from "node:child_process";

const html = execSync("git show 1647d3f:index.html", { maxBuffer: 20 * 1024 * 1024 }).toString("utf8");

function searchContext(keyword, before = 200, after = 800) {
  const idx = html.indexOf(keyword);
  if (idx === -1) {
    console.log(`[NOT FOUND] ${keyword}`);
    return;
  }
  console.log(`\n================ FOUND: "${keyword}" (pos: ${idx}) ================`);
  const start = Math.max(0, idx - before);
  const end = Math.min(html.length, idx + after);
  console.log(html.substring(start, end));
}

searchContext("DotField");
searchContext("LightRays");
searchContext("NSR Cloud");
searchContext("flex-carousel");
searchContext("data-counter");
searchContext("Graha Arteri Mas");
searchContext("Surapati Core");
searchContext("Rimbo Kaluang");
searchContext("Hertasning");
searchContext("Abdul Rozak");

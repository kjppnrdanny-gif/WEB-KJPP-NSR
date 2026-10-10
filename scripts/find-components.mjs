import { execSync } from "node:child_process";

const html = execSync("git show 1647d3f:index.html", { maxBuffer: 20 * 1024 * 1024 }).toString("utf8");

function findAllSnippets(keyword, len = 500) {
  let pos = 0;
  console.log(`\n================ ALL MATCHES FOR "${keyword}" ================`);
  while ((pos = html.indexOf(keyword, pos)) !== -1) {
    console.log(`--- Match at ${pos} ---`);
    console.log(html.substring(Math.max(0, pos - 100), Math.min(html.length, pos + len)));
    pos += keyword.length;
  }
}

findAllSnippets("galeri-flex-carousel", 400);
findAllSnippets("LightRays", 400);
findAllSnippets("DotField", 400);
findAllSnippets("CountUp", 400);
findAllSnippets("sistem-mutu", 600);

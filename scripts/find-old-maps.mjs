import { execSync } from 'child_process';

const commits = ['9b8a792', '1647d3f', 'HEAD~2', 'HEAD~3', 'HEAD~4', 'HEAD~5', 'HEAD~10'];
for (const c of commits) {
  try {
    const out = execSync(`git show ${c}:index.html`, { maxBuffer: 15 * 1024 * 1024 }).toString('utf8');
    const matches = out.match(/https:\/\/(www\.)?google\.com\/maps\/embed\?[^"'<>]+/g);
    console.log(c, 'matches:', matches ? matches.slice(0, 3) : 'none');
    const pusatMatch = out.match(/pusat:\s*\{[^}]+\}/);
    if (pusatMatch) {
      console.log(c, 'pusat object:', pusatMatch[0]);
    }
  } catch (e) {
    console.log(c, e.message);
  }
}

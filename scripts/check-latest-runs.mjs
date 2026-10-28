// scripts/check-latest-runs.mjs
async function main() {
  const url = 'https://api.github.com/repos/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs?per_page=6';
  const res = await fetch(url, { headers: { 'User-Agent': 'Node-Fetch' } });
  const data = await res.json();
  data.workflow_runs.forEach(r => {
    console.log(`Run ${r.id} | ${r.name} | Branch: ${r.head_branch} | Status: ${r.status} | Conclusion: ${r.conclusion}`);
  });
}
main().catch(console.error);

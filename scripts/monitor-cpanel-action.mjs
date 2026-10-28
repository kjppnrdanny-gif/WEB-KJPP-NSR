async function main() {
  const repo = 'kjppnrdanny-gif/WEB-KJPP-NSR';
  console.log('Fetching latest workflow runs for repo:', repo);
  
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=5`, {
    headers: { 'User-Agent': 'Node-Fetch' }
  });
  const data = await res.json();
  
  if (!data.workflow_runs || data.workflow_runs.length === 0) {
    console.log('No workflow runs found.');
    return;
  }

  for (const run of data.workflow_runs) {
    console.log(`- Run ID: ${run.id} | Name: ${run.name} | Event: ${run.event} | Status: ${run.status} | Conclusion: ${run.conclusion} | Commit: ${run.head_commit?.id?.slice(0, 7)} - ${run.head_commit?.message?.slice(0, 50)}`);
  }
}

main().catch(console.error);

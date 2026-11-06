async function check() {
  const res = await fetch('https://api.github.com/repos/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs?per_page=5', {
    headers: { 'User-Agent': 'Node-Fetch' }
  });
  const data = await res.json();
  if (data.workflow_runs) {
    data.workflow_runs.forEach(r => {
      const msg = r.head_commit?.message ? r.head_commit.message.split('\n')[0] : '';
      console.log(`Run ID: ${r.id} | SHA: ${r.head_sha.slice(0, 7)} | Status: ${r.status} | Conclusion: ${r.conclusion} | Name: ${r.name} | Msg: ${msg}`);
    });
  } else {
    console.log(data);
  }
}
check();

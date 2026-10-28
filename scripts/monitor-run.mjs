async function monitorRun() {
  const runId = 39985502173;
  for (let i = 1; i <= 30; i++) {
    try {
      const resp = await fetch('https://api.github.com/repos/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs/' + runId, {
        headers: { 'User-Agent': 'node' }
      });
      const data = await resp.json();
      console.log(`[Attempt ${i}] Status: ${data.status} | Conclusion: ${data.conclusion}`);
      if (data.status === 'completed') {
        return data.conclusion === 'success';
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

monitorRun().then(ok => {
  console.log('Finished with ok =', ok);
  process.exit(ok ? 0 : 1);
});

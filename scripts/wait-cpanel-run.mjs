async function waitWorkflow() {
  const repo = 'kjppnrdanny-gif/WEB-KJPP-NSR';
  console.log('=== MENUNGGU DEPLOYMENT CPANEL GITHUB ACTION (COMMIT e2fc429) ===\n');

  let completed = false;
  let attempts = 0;

  while (!completed && attempts < 30) {
    attempts++;
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=3`, {
        headers: { 'User-Agent': 'Node-Fetch' }
      });
      const data = await res.json();
      const run = data.workflow_runs?.find(r => r.name === 'Deploy ke cPanel KJPP NSR');
      
      if (run) {
        console.log(`[Attempt ${attempts}] Run ID: ${run.id} | Status: ${run.status} | Conclusion: ${run.conclusion}`);
        if (run.status === 'completed') {
          completed = true;
          console.log(`\n🎉 Deploy ke cPanel KJPP NSR SELESAI dengan status: ${run.conclusion}`);
          break;
        }
      }
    } catch (e) {
      console.warn('Polling error:', e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

waitWorkflow().catch(console.error);

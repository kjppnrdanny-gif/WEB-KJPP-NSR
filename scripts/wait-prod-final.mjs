async function poll() {
  for (let i = 0; i < 20; i++) {
    const res = await fetch('https://api.github.com/repos/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs/40710855689', {
      headers: { 'User-Agent': 'Node' }
    });
    const r = await res.json();
    console.log(`[${i+1}] Status: ${r.status} | Conclusion: ${r.conclusion}`);
    if (r.status === 'completed') {
      return r.conclusion;
    }
    await new Promise(res => setTimeout(res, 5000));
  }
}

poll().then(res => console.log('Final Result:', res)).catch(console.error);

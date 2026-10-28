async function pollDeployment() {
  const base = 'https://kjppnanangrahayu.com';
  const hexHash = '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0';
  console.log('Polling cPanel live deployment for commit 02f498f...');

  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const res = await fetch(base + '/auth-handler.php?action=token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: hexHash })
      });
      const data = await res.json();
      console.log(`[Attempt ${attempt}] Status: ${res.status} | Authenticated: ${data.authenticated}`);

      if (res.status === 401 && data.authenticated === false) {
        console.log('\n🚀 SUCCESS: Commit 02f498f is LIVE on cPanel!');
        console.log('🛡️ Direct hex hash authentication is STRICTLY REJECTED (HTTP 401 Unauthorized)');
        return true;
      }
    } catch (e) {
      console.log(`[Attempt ${attempt}] Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('Deployment still running in GitHub Actions.');
  return false;
}

pollDeployment().then(ok => {
  if (!ok) process.exit(1);
}).catch(console.error);

async function poll() {
  const url = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html';
  console.log('Polling live site for commit ac49a66 deployment at:', url);

  for (let i = 1; i <= 25; i++) {
    try {
      const resp = await fetch(url + '?_nocache=' + Date.now() + '_' + i);
      const text = await resp.text();
      const hasCleanTitle = text.includes('Deni Siswandi, S.T., MAPPI');
      const hasOldCert = text.includes('Deni Siswandi, S.T., MAPPI (Cert.)');
      const hasBadTitle = text.includes('Deni Siswandi, S.T., M.Ec.Dev.');
      
      console.log(`[Attempt ${i}] HTTP ${resp.status} | Clean Title: ${hasCleanTitle} | Old (Cert.): ${hasOldCert} | Bad Title: ${hasBadTitle}`);
      
      if (hasCleanTitle && !hasOldCert && !hasBadTitle) {
        console.log('\n======================================================');
        console.log('🚀 DEPLOYMENT SUCCESS & CONFIRMED LIVE ON CPANEL!');
        console.log('• Gelar Deni Siswandi, S.T., MAPPI aktif tanpa M.Ec.Dev.');
        console.log('• Commit ac49a66 aktif pada hosting produksi cPanel');
        console.log('======================================================\n');
        return true;
      }
    } catch (e) {
      console.log(`[Attempt ${i}] Error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

poll().then(ok => process.exit(ok ? 0 : 1));

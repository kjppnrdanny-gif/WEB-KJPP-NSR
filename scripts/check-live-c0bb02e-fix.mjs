async function pollLive() {
  const url = 'https://kjppnanangrahayu.com/portal-penugasan-jo.html?_t=' + Date.now();
  try {
    const res = await fetch(url);
    const text = await res.text();
    const hasIndividual = text.includes('konfirmasiDeklarasiPersonelIndividual');
    const hasNoOmnibus = !text.includes('deklarasiSemuaIndependen');
    const hasBackendVerif = text.includes('verifyPengesahKing');
    console.log('Live Check:');
    console.log('- konfirmasiDeklarasiPersonelIndividual:', hasIndividual);
    console.log('- Omnibus button removed:', hasNoOmnibus);
    console.log('- verifyPengesahKing referenced:', hasBackendVerif);
  } catch (e) {
    console.error('Fetch err:', e.message);
  }
}
pollLive();

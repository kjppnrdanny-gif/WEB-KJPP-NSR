import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('========================================================================');
  console.log('VERIFIKASI LIVE cPANEL: DROPDOWN DOK1 - DOK9 & RENDERER MAPPING');
  console.log('========================================================================');

  const cacheBust = Date.now();
  const htmlRes = await fetchUrl(`https://kjppnanangrahayu.com/portal-penugasan-jo.html?_t=${cacheBust}`);
  console.log(`[1] portal-penugasan-jo.html status: HTTP ${htmlRes.status}`);

  const hasAll9Keys = ['DOK1', 'DOK2', 'DOK3', 'DOK4', 'DOK5', 'DOK6', 'DOK7', 'DOK8', 'DOK9'].every(k =>
    htmlRes.data.includes(`value="${k}"`)
  );
  const noSupp = !htmlRes.data.includes('value="SUPP_PENAWARAN"') &&
                 !htmlRes.data.includes('value="SUPP_DISPOSISI"') &&
                 !htmlRes.data.includes('value="SUPP_REVIEW"');

  const hasRendererDOK9 = htmlRes.data.includes('selDok === "DOK9" || selDok === "DOK3G"');
  const hasRendererDOK8 = htmlRes.data.includes('selDok === "DOK8" || selDok === "DOK3F"');
  const hasRendererDOK7 = htmlRes.data.includes('selDok === "DOK7" || selDok === "DOK3E"');
  const hasRendererDOK6 = htmlRes.data.includes('selDok === "DOK6" || selDok === "DOK3D"');
  const hasRendererDOK5 = htmlRes.data.includes('selDok === "DOK5" || selDok === "DOK3C"');
  const hasRendererDOK4 = htmlRes.data.includes('selDok === "DOK4" || selDok === "DOK3B"');
  const hasRendererDOK3 = htmlRes.data.includes('selDok === "DOK3" || selDok === "DOK3A"');

  console.log(`  - Seluruh kunci DOK1 - DOK9 terpasang di dropdown: ${hasAll9Keys ? 'TERPASANG (OK)' : 'GAGAL'}`);
  console.log(`  - Opsi placeholder SUPP_* dibersihkan total: ${noSupp ? 'BERSIH (OK)' : 'GAGAL'}`);
  console.log(`  - Renderer Dokumen 9 (PI): ${hasRendererDOK9 ? 'TERHUBUNG (OK)' : 'GAGAL'}`);
  console.log(`  - Renderer Dokumen 8 (ETI): ${hasRendererDOK8 ? 'TERHUBUNG (OK)' : 'GAGAL'}`);
  console.log(`  - Renderer Dokumen 7 (BAP): ${hasRendererDOK7 ? 'TERHUBUNG (OK)' : 'GAGAL'}`);
  console.log(`  - Renderer Dokumen 6 (Surat Tugas): ${hasRendererDOK6 ? 'TERHUBUNG (OK)' : 'GAGAL'}`);
  console.log(`  - Renderer Dokumen 5 (Kartu Proyek): ${hasRendererDOK5 ? 'TERHUBUNG (OK)' : 'GAGAL'}`);
  console.log(`  - Renderer Dokumen 4 (Lembar Order): ${hasRendererDOK4 ? 'TERHUBUNG (OK)' : 'GAGAL'}`);
  console.log(`  - Renderer Dokumen 3 (Isian UMUM): ${hasRendererDOK3 ? 'TERHUBUNG (OK)' : 'GAGAL'}`);

  const dropdownIdx = htmlRes.data.indexOf('id="pilih_tampilan_dokumen"');
  if (dropdownIdx !== -1) {
    console.log('\n  Snippet Dropdown Live:');
    console.log(htmlRes.data.slice(dropdownIdx, dropdownIdx + 600));
  }
  console.log('========================================================================');
}

verify().catch(console.error);

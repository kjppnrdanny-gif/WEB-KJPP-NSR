import fetch from 'node-fetch';

async function main() {
  const url = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec?action=admin_inspect_prod&key=nsr_prod_secret_2026&include_rows=true';
  const res = await fetch(url, { redirect: 'follow' });
  const data = await res.json();
  
  for (const s of data.sheets) {
    console.log(`\n================ Sheet: ${s.name} (lastRow: ${s.lastRow}, lastCol: ${s.lastCol}) ================`);
    console.log('Headers:', s.headers);
    if (s.tailRows && s.tailRows.length > 0) {
      console.log('Tail Rows:');
      for (const r of s.tailRows) {
        console.log(`Row #${r.rowNum}:`, JSON.stringify(r.values));
      }
    }
  }
}

main().catch(console.error);

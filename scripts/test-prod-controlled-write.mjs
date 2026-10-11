import fetch from 'node-fetch';

async function main() {
  const url = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec?action=admin_controlled_prod_test&key=nsr_prod_secret_2026';
  console.log('Sending request to:', url);
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log('HTTP Status:', res.status);
  console.log('Response body:\n', text);
}

main().catch(console.error);

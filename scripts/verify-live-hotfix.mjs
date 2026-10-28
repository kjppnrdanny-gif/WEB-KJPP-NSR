async function test() {
  const res = await fetch('https://kjppnanangrahayu.com/portal-nolap.html?nocache=' + Date.now());
  const text = await res.text();
  console.log('--- HASIL VERIFIKASI LANGSUNG DI SERVER LIVE ---');
  console.log('HTTP Status Code:', res.status);
  console.log('Total Ukuran Konten (Bytes):', text.length);
  console.log('Literal LaTeX rightarrow Terdeteksi:', text.includes('$\\rightarrow$') || text.includes('$\\rightarrow'));
  console.log('Literal LaTeX ge Terdeteksi:', text.includes('$\\ge$'));
  console.log('Jalur Kepentingan Desa (Panah →):', text.includes('Musdes → Perdes → Persetujuan Bupati/Wali Kota melalui Camat.'));
  console.log('Jalur Swasta (Panah →):', text.includes('Bupati → Rekomendasi Gubernur →'));
  console.log('Pertanyaan E06 (Panah →):', text.includes('desa setempat → desa lain satu kecamatan → kecamatan berbatasan'));
  console.log('Status Badge Ekivalensi (Simbol ≥):', text.includes('EKIVALENSI MEMENUHI (NILAI ≥ ASAL)'));
}
test().catch(console.error);

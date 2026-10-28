import fs from 'fs';

const html = fs.readFileSync('portal-nolap.html', 'utf8');

const targetIds = [
  'f-cabang',
  'f-pemohon',
  'f-jabatan',
  'f-penilai',
  'entitas-badan',
  'entitas-perorangan',
  'f-klien',
  'f-status-klien',
  'f-npwp',
  'f-kontak-klien',
  'f-alamat-klien',
  'input_pengguna_lap_a_nama',
  'input_pengguna_lap_a_alamat',
  'input_pengguna_lap_b_nama',
  'input_pengguna_lap_b_alamat',
  'f-jenis-objek',
  'f-lokasi-objek',
  'f-luas-tanah',
  'f-luas-bangunan',
  'f-pemilik-objek',
  'input_tujuan_penilaian',
  'f-dasar-nilai',
  'skala_besar',
  'skala_kecil_tahapan',
  'skala_kecil_tanpa_tahapan',
  'input_no_danom',
  'input_no_penlok',
  'input_tgl_penlok',
  'input_kesesuaian_rtrw',
  'f-no-spk',
  'f-tgl-spk'
];

targetIds.forEach(id => {
  const has = html.includes(`id="${id}"`);
  console.log(`ID [${id}]:`, has ? 'FOUND' : 'MISSING');
});

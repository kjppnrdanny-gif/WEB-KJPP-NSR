import fs from 'node:fs';

const stagingFile = 'data/job_tracking_staging.json';
const data = JSON.parse(fs.readFileSync(stagingFile, 'utf8'));

for (const [id, job] of Object.entries(data)) {
  job.pemberi_tugas = job.pemberi_tugas || job.instansi || 'PT Bank Tabungan Negara (Persero) Tbk';
  job.pengguna_laporan = job.pengguna_laporan || job.pemberi_tugas;
  job.client_pic_name = job.client_pic_name || job.pic_pemohon || 'PIC Pemberi Tugas';
  job.client_pic_phone = job.client_pic_phone || job.pic_contact || '081288997766';
  
  job.survey_contact_name = job.survey_contact_name || (job.debitur ? (job.debitur.split(',')[0] + ' (Debitur / Pendamping)') : 'Pendamping Lapangan');
  job.survey_contact_phone = job.survey_contact_phone || '081388772211';
  
  const isKomersial = (job.jenis_properti || '').toLowerCase().includes('pabrik') ||
                      (job.jenis_properti || '').toLowerCase().includes('gudang') ||
                      (job.jenis_properti || '').toLowerCase().includes('gedung') ||
                      (job.jenis_properti || '').toLowerCase().includes('pln') ||
                      (job.jenis_properti || '').toLowerCase().includes('industri');

  job.klasifikasi_izin_objek = job.klasifikasi_izin_objek || (isKomersial ? 'P' : 'PS');
  job.tujuan_penilaian = job.tujuan_penilaian || ((job.jenis_properti || '').includes('PLN') ? 'Pengadaan Tanah (SPI 204)' : 'Penjaminan Utang / Agunan Kredit');
  job.dokumen_kepemilikan = job.dokumen_kepemilikan || (isKomersial ? 'SHGB No. 1205/Cakung & IMB Industri' : 'SHM No. 402/Kuningan');
  job.tanggal_penilaian = job.tanggal_penilaian || job.spk_date || '2026-10-26';
  job.wa_admin = '6285110513157';

  // NoLap & Opini Nilai internal
  if (job.current_milestone === 'M-06' || job.current_milestone === 'M-07') {
    job.nomor_laporan_resmi = job.nomor_laporan_resmi || `00${job.jo_number.slice(-2)}/2.0160-01/PI/X/2026`;
    job.opini_nilai_pasar = job.opini_nilai_pasar || (isKomersial ? 14500000000 : 2850000000);
    job.opini_nilai_likuidasi = job.opini_nilai_likuidasi || (isKomersial ? 10875000000 : 2280000000);
  } else {
    job.nomor_laporan_resmi = job.nomor_laporan_resmi || '';
    job.opini_nilai_pasar = job.opini_nilai_pasar || 0;
    job.opini_nilai_likuidasi = job.opini_nilai_likuidasi || 0;
  }
}

fs.writeFileSync(stagingFile, JSON.stringify(data, null, 4), 'utf8');
console.log('✓ Successfully enriched data/job_tracking_staging.json with SPI 103 & NoLap fields');

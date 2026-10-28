import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('portal-operasional.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const p1 = html.indexOf('async function simpanPengajuan');
const p2 = html.indexOf('if (JENIS_AKTIF === \'OPR-SRV\') {', p1);
const p3 = html.indexOf('} else if (JENIS_AKTIF === \'OPR-MTG\') {', p2);

if (p1 === -1 || p2 === -1 || p3 === -1) {
  console.error('Failed to locate simpanPengajuan survey block');
  process.exit(1);
}

const replacement = `if (JENIS_AKTIF === 'OPR-SRV') {
        const selWilayah = document.getElementById('survey_wilayah');
        const wilayahVal = selWilayah ? selWilayah.value : 'JABODETABEK';
        const wilayahLabel = selWilayah ? selWilayah.options[selWilayah.selectedIndex].text.split('(')[0].trim() : 'Jabodetabek';

        const biayaPersonal = [];
        document.querySelectorAll('#tbody-survey-personal tr').forEach(tr => {
          const selJabatan = tr.querySelector('.item-jabatan');
          const jab = selJabatan ? selJabatan.value : 'SURVEYOR';
          const isManual = jab === 'MANUAL';
          const jabLabel = selJabatan ? selJabatan.options[selJabatan.selectedIndex].text.split('(')[0].trim() : 'Surveyor Lapangan';
          const uraian = isManual ? (tr.querySelector('.item-nama-manual')?.value || 'Biaya Personal Manual') : \`Allowance \${jabLabel}\`;
          const personel = Math.max(1, parseInt(tr.querySelector('.item-personel')?.value) || 1);
          const durasi = Math.max(0, parseFloat(tr.querySelector('.item-durasi')?.value) || 0);
          const satuan = tr.querySelector('.item-satuan')?.value || 'Hari';
          const tarif = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const alasan = isManual ? (tr.querySelector('.item-alasan-manual')?.value || '') : '';
          const subtotal = personel * durasi * tarif;

          biayaPersonal.push({
            jabatan: jab,
            jabatanLabel: jabLabel,
            uraian: uraian,
            jumlahPersonel: personel,
            durasi: durasi,
            volume: personel * durasi,
            satuan: satuan,
            tarif: tarif,
            total: subtotal,
            isManual: isManual,
            alasanManual: alasan
          });
        });

        const biayaKolektif = [];
        document.querySelectorAll('#tbody-survey-kolektif tr').forEach(tr => {
          const uraian = tr.querySelector('.item-nama')?.value || '';
          const vol = Math.max(0, parseFloat(tr.querySelector('.item-volume')?.value) || 0);
          const sat = tr.querySelector('.item-satuan')?.value || 'Paket';
          const trf = Math.max(0, parseFloat(tr.querySelector('.item-tarif')?.value) || 0);
          const isBandara = tr.dataset.kategori === 'TRANSPORTASI_BANDARA' || uraian.toLowerCase().includes('bandara');
          const alasan = tr.querySelector('.item-alasan')?.value || '';
          const subtotal = vol * trf;

          biayaKolektif.push({
            uraian: uraian,
            volume: vol,
            satuan: sat,
            tarif: trf,
            total: subtotal,
            isBandara: isBandara,
            alasan: alasan
          });
        });

        payload.survey = {
          wilayahSurvey: wilayahVal,
          wilayahSurveyLabel: wilayahLabel,
          idPenugasan: document.getElementById('label-lookup-id').innerText !== '-' ? document.getElementById('label-lookup-id').innerText : '',
          nomorLaporan: document.getElementById('label-lookup-nolap').innerText !== '-' ? document.getElementById('label-lookup-nolap').innerText : '',
          namaKlien: document.getElementById('label-lookup-klien').innerText !== '-' ? document.getElementById('label-lookup-klien').innerText : '',
          lokasiObjek: document.getElementById('label-lookup-objek').innerText !== '-' ? document.getElementById('label-lookup-objek').innerText : '',
          tglMulaiSurvey: document.getElementById('survey_tgl_mulai').value,
          tglSelesaiSurvey: document.getElementById('survey_tgl_selesai').value,
          daftarSurveyor: [document.getElementById('survey_daftar_surveyor').value],
          biayaPersonal: biayaPersonal,
          biayaKolektif: biayaKolektif,
          tarifSnapshot: {
            versi: '2026.1',
            wilayahSurvey: wilayahVal,
            timestamp: new Date().toISOString()
          }
        };
      `;

html = html.substring(0, p2) + replacement + html.substring(p3);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Successfully fixed simpanPengajuan survey payload extraction!');

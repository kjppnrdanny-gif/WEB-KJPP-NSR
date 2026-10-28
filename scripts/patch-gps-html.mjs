import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const gpsFile = path.join(ROOT_DIR, 'GPS.html');
if (fs.existsSync(gpsFile)) {
  let c = fs.readFileSync(gpsFile, 'utf8');

  // Replace KANTOR_REF
  const oldKantorRefRegex = /const KANTOR_REF\s*=\s*\[[\s\S]*?\];/;
  const newKantorRef = `const KANTOR_REF = [
      { nama: "Pusat Jakarta", lat: -6.28797, lng: 106.82478, radius: 150, alamat: "Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550" },
      { nama: "Cabang Bandung", lat: -6.85978, lng: 107.56043, radius: 150, alamat: "Perumahan Pancanaka Royal Garden II, Jl. Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512" },
      { nama: "Cabang Padang", lat: -0.94932, lng: 100.37606, radius: 150, alamat: "Jl. Parak Gadang VIII No. 19, Kel. Simpang Haru, Kec. Padang Timur, Kota Padang, Sumatera Barat" },
      { nama: "Cabang Makassar", lat: -5.15650, lng: 119.41200, radius: 200, alamat: "Jl. Nuri Lr. 301 No. 7, Mariso, Makassar, Sulawesi Selatan" },
      { nama: "Cabang Palembang", lat: -2.92904, lng: 104.69598, radius: 150, alamat: "Komplek Griya Hero Abadi Maskarebet, Kec. Alang-Alang Lebar, Kota Palembang, Sumatera Selatan" }
    ];`;

  c = c.replace(oldKantorRefRegex, newKantorRef);
  c = c.replace('<span class="text-slate-400 font-mono text-xs font-normal normal-case">Contoh: NSR-[tahun masuk]-[nomor urut]</span>', '');
  c = c.replace('placeholder="Contoh: NSR-001"', 'placeholder="Ketik NIK Karyawan"');

  fs.writeFileSync(gpsFile, c, 'utf8');
  console.log('GPS.html updated successfully!');
}

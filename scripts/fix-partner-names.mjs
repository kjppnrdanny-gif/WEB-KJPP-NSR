import fs from 'fs';
import path from 'path';

const filePath = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/daftar-token-akses-internal.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. In Bagian 1 (Tabel Master 11 Token)
html = html.replace(
  'Deni Siswandi, S.T., MAPPI</span>',
  'Deni Siswandi, S.T., MAPPI (Cert.)</span>'
);

html = html.replace(
  'Hernita, S.E., M.Si.</span>',
  'Hernita, S.Si., MAPPI (Cert.)</span>'
);

html = html.replace(
  'Muhammad Amin Sade, S.T.</span>',
  'Muhammad Amin Sade, S.M., MAPPI (Cert.)</span>'
);

html = html.replace(
  'Dharma Priyanto Sih Budi S.</span>',
  'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)</span>'
);

// 2. In Bagian 2 (Tabel 48 Karyawan)
html = html.replace(
  '<td class="p-2.5 font-bold text-white">Nanang Rahayu</td>',
  '<td class="p-2.5 font-bold text-white">Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)</td>'
);

html = html.replace(
  '<td class="p-2.5 font-bold text-white">Deni Siswandi</td>',
  '<td class="p-2.5 font-bold text-white">Deni Siswandi, S.T., MAPPI (Cert.)</td>'
);

html = html.replace(
  '<td class="p-2.5 font-bold text-white">Hernita</td>',
  '<td class="p-2.5 font-bold text-white">Hernita, S.Si., MAPPI (Cert.)</td>'
);

html = html.replace(
  '<td class="p-2.5 font-bold text-white">Muhammad Amin Sade</td>',
  '<td class="p-2.5 font-bold text-white">Muhammad Amin Sade, S.M., MAPPI (Cert.)</td>'
);

html = html.replace(
  '<td class="p-2.5 font-bold text-white">Dharma Priyanto Sih Budi Susilo</td>',
  '<td class="p-2.5 font-bold text-white">Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)</td>'
);

// 3. In Bagian 3 (Slip Penyerahan Kredensial Individual)
html = html.replace(
  'Penerima :</span> <strong>Deni Siswandi, S.T., MAPPI</strong>',
  'Penerima :</span> <strong>Deni Siswandi, S.T., MAPPI (Cert.)</strong>'
);

html = html.replace(
  'Penerima :</span> <strong>Hernita, S.E., M.Si.</strong>',
  'Penerima :</span> <strong>Hernita, S.Si., MAPPI (Cert.)</strong>'
);

html = html.replace(
  'Penerima :</span> <strong>Muhammad Amin Sade, S.T.</strong>',
  'Penerima :</span> <strong>Muhammad Amin Sade, S.M., MAPPI (Cert.)</strong>'
);

html = html.replace(
  'Penerima :</span> <strong>Dharma Priyanto Sih Budi Susilo</strong>',
  'Penerima :</span> <strong>Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)</strong>'
);

fs.writeFileSync(filePath, html, 'utf8');
console.log('🎉 Successfully fixed all 5 partner names and degrees!');

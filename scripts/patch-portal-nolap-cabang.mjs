import fs from 'node:fs';
import path from 'node:path';

// 1. Patch portal-nolap-cabang.html
const cabFilePath = path.resolve('portal-nolap-cabang.html');
let raw = fs.readFileSync(cabFilePath, 'utf8');
const hadCrlf = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

// Update select options
const targetSelect = `<option value="Bandung" data-kode="2.0160-04">Kantor Cabang Bandung (2.0160-04)</option>
                  <option value="Padang" data-kode="2.0160-02">Kantor Cabang Padang (2.0160-02)</option>
                  <option value="Makassar" data-kode="2.0160-03">Kantor Cabang Makassar (2.0160-03)</option>
                  <option value="Palembang" data-kode="2.0160-05">Kantor Cabang Palembang (2.0160-05)</option>`;

const replaceSelect = `<option value="Bandung" data-kode="2.0160-04">Kantor Cabang Bandung (2.0160-04)</option>
                  <option value="Padang" data-kode="2.0160-01">Kantor Cabang Padang (2.0160-01)</option>
                  <option value="Makassar" data-kode="2.0160-02">Kantor Cabang Makassar (2.0160-02)</option>
                  <option value="Palembang" data-kode="2.0160-03">Kantor Cabang Palembang (2.0160-03)</option>`;

if (!content.includes(targetSelect)) {
  throw new Error('targetSelect not found in portal-nolap-cabang.html');
}
content = content.replace(targetSelect, replaceSelect);

// Update CABANG_CONFIG
const targetCfg = `'Padang': {
        kodeKemenkeu: '2.0160-02',
        kodeCabang: 'PDG',
        namaCabang: 'Kantor Cabang Padang',
        kota: 'Padang',
        rekan: {
          nama: 'Hernita, S.Si., MAPPI (Cert.)',
          izin: '00046',
          izinLengkap: 'PS-1.15.00046',
          mappi: '09-S-02262',
          rmk: 'RMK-2017.00437',
          jabatan: 'Rekan / Pimpinan Cabang Padang'
        },
                              },
      'Makassar': {
        kodeKemenkeu: '2.0160-03',
        kodeCabang: 'MKS',
        namaCabang: 'Kantor Cabang Makassar',
        kota: 'Makassar',
        rekan: {
          nama: 'Muhammad Amin Sade, SM., MAPPI (Cert.)',
          izin: '00126',
          izinLengkap: 'PS-1.16.00126',
          mappi: '09-S-02425',
          rmk: 'RMK-2017.00527',
          jabatan: 'Rekan / Pimpinan Cabang Makassar'
        },
                              },
      'Palembang': {
        kodeKemenkeu: '2.0160-05',`;

const replaceCfg = `'Padang': {
        kodeKemenkeu: '2.0160-01',
        kodeCabang: 'PDG',
        namaCabang: 'Kantor Cabang Padang',
        kota: 'Padang',
        rekan: {
          nama: 'Hernita, S.Si., MAPPI (Cert.)',
          izin: '00046',
          izinLengkap: 'PS-1.15.00046',
          mappi: '09-S-02262',
          rmk: 'RMK-2017.00437',
          jabatan: 'Rekan / Pimpinan Cabang Padang'
        },
                              },
      'Makassar': {
        kodeKemenkeu: '2.0160-02',
        kodeCabang: 'MKS',
        namaCabang: 'Kantor Cabang Makassar',
        kota: 'Makassar',
        rekan: {
          nama: 'Muhammad Amin Sade, SM., MAPPI (Cert.)',
          izin: '00126',
          izinLengkap: 'PS-1.16.00126',
          mappi: '09-S-02425',
          rmk: 'RMK-2017.00527',
          jabatan: 'Rekan / Pimpinan Cabang Makassar'
        },
                              },
      'Palembang': {
        kodeKemenkeu: '2.0160-03',`;

if (!content.includes(targetCfg)) {
  throw new Error('targetCfg not found in portal-nolap-cabang.html');
}
content = content.replace(targetCfg, replaceCfg);

const finalOut = hadCrlf ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(cabFilePath, finalOut, 'utf8');
console.log('✓ portal-nolap-cabang.html patched successfully.');

// 2. Patch scripts/generate-portal-nolap-cabang.mjs if it exists
const genScriptPath = path.resolve('scripts/generate-portal-nolap-cabang.mjs');
if (fs.existsSync(genScriptPath)) {
  let genRaw = fs.readFileSync(genScriptPath, 'utf8');
  let genContent = genRaw.replace(/\r\n/g, '\n');
  if (genContent.includes(targetSelect)) {
    genContent = genContent.replace(targetSelect, replaceSelect);
  }
  if (genContent.includes(targetCfg)) {
    genContent = genContent.replace(targetCfg, replaceCfg);
  }
  fs.writeFileSync(genScriptPath, genRaw.includes('\r\n') ? genContent.replace(/\n/g, '\r\n') : genContent, 'utf8');
  console.log('✓ scripts/generate-portal-nolap-cabang.mjs patched successfully.');
}

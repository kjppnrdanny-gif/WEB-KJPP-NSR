import fs from 'node:fs';
import assert from 'node:assert';

console.log('Testing frontend & GAS code compliance...');

const pNolap = fs.readFileSync('portal-nolap.html', 'utf8');
assert(pNolap.includes('-- Pilih Sektor Industri Kemenkeu (01–12) * --'), 'portal-nolap.html must have default disabled option');
assert(pNolap.includes('kodeIndustri = (rawIndustri && !isNaN(numInd) && numInd >= 1 && numInd <= 12) ? cleanInd : "--";'), 'portal-nolap.html preview must not fallback to 07');
assert(pNolap.includes('Sektor Industri Kemenkeu (01–12) wajib dipilih sesuai master klasifikasi resmi'), 'portal-nolap.html must have mandatory check in submission');

const pCabang = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
assert(pCabang.includes('-- Pilih Sektor Industri (01–12) * --'), 'portal-nolap-cabang.html must have default disabled option');
assert(!pCabang.includes('14 - Jasa Lainnya'), 'portal-nolap-cabang.html must NOT contain invalid sector 14');
assert(pCabang.includes('const cleanDigits = inpNpwp.replace'), 'portal-nolap-cabang.html must derive NPWP code dynamically');

const codeGs = fs.readFileSync('Code.gs', 'utf8');
assert(codeGs.includes('VALIDASI GAGAL: Kode Industri Kemenkeu wajib dipilih dan valid (01–12)'), 'Code.gs must validate sector 01-12');
assert(codeGs.includes('${seq}/${conf.kodeKemenkeu}/${klasifikasi}/${sektor}/${conf.izin}/${kodeNpwp}/${romawiBln}/${thn}'), 'Code.gs must use dynamic kodeNpwp');

const gasNolap = fs.readFileSync('gas-nolap-Code.gs', 'utf8');
assert(gasNolap.includes('VALIDASI GAGAL: Kode Industri Kemenkeu wajib dipilih dan valid (01–12)'), 'gas-nolap-Code.gs must validate sector 01-12');
assert(gasNolap.includes('${nextSeqStr}/${conf.kodeKemenkeu}/${reportCode}/${sektor}/${conf.izin}/${kodeNpwp}/${romawiBln}/${thn}'), 'gas-nolap-Code.gs must use dynamic kodeNpwp');

console.log('✅ ALL FRONTEND & GAS INTEGRITY CHECKS PASSED (8/8)!');

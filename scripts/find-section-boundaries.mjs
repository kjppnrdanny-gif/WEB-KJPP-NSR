import fs from 'node:fs';
import path from 'node:path';

const file = 'd:\\WEB KJPP NSR_Compro new ver\\kjpp-nsr-netlify-production\\index.html';
const content = fs.readFileSync(file, 'utf8');

// Find section markers:
// 1. Header & Hero: from start up to end of section rekanan + statistics
const markerHeroStart = '<section id="profil"';
const markerRekananStart = '<section id="rekanan"';
const markerStatsStart = '<section class="bg-slate-950 text-white py-12';
const markerVisiMisiStart = '<!-- ==================== 5A. VISI & MISI PERUSAHAAN ==================== -->';
const markerLayananStart = '<!-- ==================== 6. RUANG LINGKUP JASA LENGKAP ==================== -->';
const markerSistemMutuStart = '<!-- ==================== 6A. NSR CLOUD ==================== -->';
const markerPengalamanStart = '<!-- ==================== 7. PORTOFOLIO PROYEK TOL & PORTOFOLIO KORPORASI ==================== -->';
const markerGaleriStart = '<!-- ==================== 8. DOKUMENTASI & REKAM JEJAK LAPANGAN (FLEX CAROUSEL 3D) ==================== -->';
const markerManajemenStart = '<!-- ==================== 9. TIM & ORGANISASI KANTOR ==================== -->';
const markerFaqStart = '<!-- ==================== 13. TANYA JAWAB (FAQ) ==================== -->';
const markerKontakStart = '<!-- ==================== 14. JARINGAN KANTOR CABANG RESMI & FORMULIR KONSULTASI ==================== -->';
const markerFooterStart = '<!-- ==================== 15. FOOTER RESMI ==================== -->';

console.log('Finding markers in index.html...');
console.log('markerHeroStart:', content.indexOf(markerHeroStart));
console.log('markerRekananStart:', content.indexOf(markerRekananStart));
console.log('markerStatsStart:', content.indexOf(markerStatsStart));
console.log('markerVisiMisiStart:', content.indexOf(markerVisiMisiStart));
console.log('markerLayananStart:', content.indexOf(markerLayananStart));
console.log('markerSistemMutuStart:', content.indexOf(markerSistemMutuStart));
console.log('markerPengalamanStart:', content.indexOf(markerPengalamanStart));
console.log('markerGaleriStart:', content.indexOf(markerGaleriStart));
console.log('markerManajemenStart:', content.indexOf(markerManajemenStart));
console.log('markerFaqStart:', content.indexOf(markerFaqStart));
console.log('markerKontakStart:', content.indexOf(markerKontakStart));
console.log('markerFooterStart:', content.indexOf(markerFooterStart));

import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_-_pmZdNWdGCzYMeTa0-d8nPXzOaKpIfBSG9s2Bhs_9KIsNzqhQ77Hk60lKv47gyR/exec';
const SPREADSHEET_ID = '1X7kJ8tJbb_bOC08RWmy6us9O-U1fkoSRTxQ3rx8b9VY';
const SCRIPT_ID = '1rhoSmiU3bgTUwJhD5EgmCtHqybAn9oLPyeQaQlw8Ucv14AQHoCbaFvv6';

async function main() {
  console.log('=== PENGUJIAN 1: AKSES HTTP GET KE WEB APP STAGING ===');
  const res = await fetch(WEB_APP_URL, { redirect: 'follow' });
  console.log('HTTP Status:', res.status, res.statusText);
  const html = await res.text();
  console.log('Panjang HTML yang diterima:', html.length, 'karakter');

  const hasTitle = html.includes('Absensi');
  const hasAuthBox = html.includes('auth-nik-input') || html.includes('Autentikasi NIK');
  console.log('Cek Elemen HTML Portal Absensi:', hasTitle ? 'OK ✅' : 'TIDAK SESUAI ❌');
  console.log('Cek Form Autentikasi NIK & OTP:', hasAuthBox ? 'TERSEDIA ✅' : 'TIDAK DITEMUKAN ❌');

  console.log('\n=== PENGUJIAN 2: CEK & INITIALIZE SHEET STAGING VIA SPREADSHEET API ===');
  const authInfo = await initAuth({});
  const sheets = google.sheets({ version: 'v4', auth: authInfo.credentials });

  // Baca metadata spreadsheet staging
  const ssMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = ssMeta.data.sheets.map(s => s.properties.title);
  console.log('Sheet yang ada saat ini:', sheetNames);

  // Pastikan struktur sheet MASTER_KARYAWAN terisi dengan data testing resmi
  // Kolom: NIK, Nama, Jabatan, Divisi, Email, StatusAktif
  // Menggunakan email penguji resmi: kjppnr.danny@gmail.com
  let hasMaster = sheetNames.includes('MASTER_KARYAWAN');
  if (!hasMaster) {
    console.log('Menambahkan sheet MASTER_KARYAWAN...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'MASTER_KARYAWAN' } } }]
      }
    });
  }

  // Tulis/Pastikan header & data dummy karyawan pengujian
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MASTER_KARYAWAN!A1:F5',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['NIK', 'Nama', 'Jabatan', 'Divisi', 'Email', 'StatusAktif'],
        ['NSR-001', 'Danny Taufik Hidayat, S.T.', 'Penilai Properti', 'Divisi Penilaian Properti', 'kjppnr.danny@gmail.com', 'AKTIF'],
        ['NSR-002', 'Siti Aminah, S.E.', 'Penilai Bisnis', 'Divisi Penilaian Bisnis', 'kjppnr.danny@gmail.com', 'AKTIF'],
        ['NSR-003', 'Ahmad Fauzi', 'Staf Teknis Inspeksi', 'Divisi Operasional', 'kjppnr.danny@gmail.com', 'AKTIF'],
        ['NSR-004', 'Dewi Lestari', 'Administrasi & Keuangan', 'Divisi Keuangan', 'kjppnr.danny@gmail.com', 'AKTIF']
      ]
    }
  });
  console.log('✓ Sheet MASTER_KARYAWAN terisi dengan data penguji resmi (kjppnr.danny@gmail.com)!');

  // Pastikan Sheet ABSENSI ada
  if (!sheetNames.includes('ABSENSI')) {
    console.log('Menambahkan sheet ABSENSI...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'ABSENSI' } } }]
      }
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'ABSENSI!A1:M1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'Timestamp', 'Tanggal', 'Jam', 'NIK', 'Nama', 'Jabatan', 'Divisi',
        'JenisPresensi', 'LokasiPresensi', 'KoordinatGPS', 'KantorTerdekat', 'JarakMeter', 'StatusValidasi'
      ]]
    }
  });

  // Pastikan Sheet MASTER_WFH ada
  if (!sheetNames.includes('MASTER_WFH')) {
    console.log('Menambahkan sheet MASTER_WFH...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'MASTER_WFH' } } }]
      }
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MASTER_WFH!A1:F1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['Timestamp', 'NIK', 'Nama', 'AlamatRumah', 'KoordinatGPS', 'Status']]
    }
  });

  // Pastikan Sheet PENGAJUAN_CUTI ada
  if (!sheetNames.includes('PENGAJUAN_CUTI')) {
    console.log('Menambahkan sheet PENGAJUAN_CUTI...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'PENGAJUAN_CUTI' } } }]
      }
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'PENGAJUAN_CUTI!A1:J1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        'Timestamp', 'NIK', 'Nama', 'KategoriCuti', 'TanggalMulai', 'TanggalSelesai',
        'Alasan', 'FileUrl', 'FileName', 'StatusPersetujuan'
      ]]
    }
  });
  console.log('✓ Struktur 4 Sheet Staging Terverifikasi Lengkap!');
}

main().catch(console.error);

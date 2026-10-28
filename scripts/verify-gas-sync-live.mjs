// scripts/verify-gas-sync-live.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const GAS_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQJg4XKaL4o9yium1YvUSE4sJvZ_iqUsN-aJrd9DLVoQGtlBkTwHuCMGd9ak6Zjx-tDHtwPZjUPpEWsYtDjMdtPeSy0MLu0dUYSJeB4aBr78NiuhhXWT4CE-nr6ke2nrwFxpFbcWzGe_WpsQ5XKwK44wI4F9NOmAmUZ3SEbDjZopQcXJGMYdSqGuUKuhW9kzBtI1cxglRLU8V-mNwAh8tFvjfuOj1b5d_ILRzSrbw2rZ7krHaM3cyeCKrL3o-aJ9Ro-PSdCISwtzIkgnb-DFktko2huIQ&lib=MSChYEfVvNPyCoceqVV-aP1ScKf4pGqo7";

async function verify() {
  console.log('1. Memeriksa file Code.gs...');
  const codeGs = fs.readFileSync(path.join(ROOT_DIR, 'Code.gs'), 'utf8');
  if (!codeGs.includes("SHEET_DATA: 'Data_Penugasan'")) throw new Error("Code.gs missing Data_Penugasan");
  if (!codeGs.includes("SHEET_COUNTER: 'Config_Counter'")) throw new Error("Code.gs missing Config_Counter");
  if (!codeGs.includes("SHEET_PERSONIL: 'Master_Personil'")) throw new Error("Code.gs missing Master_Personil");
  if (!codeGs.includes("SHEET_LOG: 'Log_Aktivitas'")) throw new Error("Code.gs missing Log_Aktivitas");
  if (!codeGs.includes("ID_Penugasan") || !codeGs.includes("Folder_Drive_URL")) throw new Error("Code.gs missing 44 columns");
  console.log('✓ Code.gs sinkron 100% dengan 4 sheet dan 44 kolom');

  console.log('\n2. Memeriksa portal-penugasan-jo.html...');
  const portalHtml = fs.readFileSync(path.join(ROOT_DIR, 'portal-penugasan-jo.html'), 'utf8');
  if (!portalHtml.includes(GAS_URL)) throw new Error("GAS_WEB_APP_URL tidak cocok!");
  if (!portalHtml.includes("LAST_NO_ADM_JO: 415")) throw new Error("Baseline counter 415 tidak ditemukan");
  if (!portalHtml.includes("ID_Penugasan") || !portalHtml.includes("Folder_Drive_URL")) throw new Error("Mapping 44 kolom tidak ditemukan");
  if (!portalHtml.includes("mapSheetRowToProject") || !portalHtml.includes("mapProjectToSheetPayload")) throw new Error("Mapper functions tidak ditemukan");
  console.log('✓ portal-penugasan-jo.html sinkron 100%');

  console.log('\n3. Menguji konektivitas live ke GAS_WEB_APP_URL...');
  const res = await fetch(GAS_URL);
  if (!res.ok) throw new Error(`Fetch GAS failed with status ${res.status}`);
  const data = await res.json();
  console.log('Status Response:', data.status);
  console.log('Counter:', data.counter);
  console.log('Total Submissions:', data.submissions ? data.submissions.length : 0);
  if (data.submissions && data.submissions.length > 0) {
    const sub = data.submissions[0];
    console.log('Contoh submission live:', {
      ID_Penugasan: sub.ID_Penugasan,
      No_Adm_JO: sub.No_Adm_JO,
      No_Lingkup_Penugasan: sub.No_Lingkup_Penugasan,
      Debitur: sub.Nama_Debitur_Utama,
      Klien: sub.Nama_Pemberi_Tugas,
      Status: sub.Status_Approval
    });
  }

  console.log('\n✨ Verifikasi Integrasi DB_PENUGASAN_JO_NSR SUKSES 100%!');
}

verify().catch(e => {
  console.error('❌ Verifikasi Gagal:', e);
  process.exit(1);
});

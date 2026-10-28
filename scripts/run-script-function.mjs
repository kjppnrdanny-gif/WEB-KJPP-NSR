import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1rhoSmiU3bgTUwJhD5EgmCtHqybAn9oLPyeQaQlw8Ucv14AQHoCbaFvv6';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('Menjalankan fungsi setupTestingSheet() pada proyek staging...');
  try {
    const res = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: 'setupTestingSheet'
      }
    });
    console.log('Hasil eksekusi:', res.data);
  } catch (err) {
    console.error('Error saat menjalankan script:', err.message);
  }
}

main().catch(console.error);

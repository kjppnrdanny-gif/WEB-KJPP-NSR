// scripts/redeploy-anonymous.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SPREADSHEET_ID = '1Rg-1F4sZHvYvSamuvuslyBKN5Xe14_y3u7wn2VjNzbM';
const SCRIPT_ID = '1rNKsYZ_Rd2PAg47NcCbuwHKbSMYgpDbV0aVS2GHd57rxR0sR02daIZ5a';

async function main() {
  console.log('1. Auth via Clasp...');
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  const gasCodePath = path.join(ROOT_DIR, 'gas-job-tracking.gs');
  let gasSource = fs.readFileSync(gasCodePath, 'utf8');

  gasSource = gasSource.replace(
    /SPREADSHEET_ID:\s*['"][^'"]*['"]/,
    `SPREADSHEET_ID: '${SPREADSHEET_ID}'`
  );

  const manifest = JSON.stringify({
    timeZone: 'Asia/Jakarta',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      executeAs: 'USER_DEPLOYING',
      access: 'ANYONE_ANONYMOUS'
    }
  }, null, 2);

  console.log('2. Updating content with ANYONE_ANONYMOUS manifest...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: {
      files: [
        {
          name: 'appsscript',
          type: 'JSON',
          source: manifest
        },
        {
          name: 'Code',
          type: 'SERVER_JS',
          source: gasSource
        }
      ]
    }
  });

  console.log('3. Creating new version...');
  const verRes = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'v2.0: Anonymous Web App Access for Public Tracing'
    }
  });
  const versionNumber = verRes.data.versionNumber;
  console.log(`   ✓ Versi: v${versionNumber}`);

  console.log('4. Creating new deployment...');
  const deployRes = await script.projects.deployments.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      versionNumber: versionNumber,
      description: 'Production Anonymous Web App v2.0'
    }
  });

  const deploymentId = deployRes.data.deploymentId;
  const webAppUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
  console.log(`   ✓ New Deployment ID: ${deploymentId}`);
  console.log(`   ✓ New Web App URL: ${webAppUrl}`);

  // Simpan konfigurasi cloud
  const configOutput = {
    spreadsheetTitle: 'DATABASE TRACING PENUGASAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    scriptId: SCRIPT_ID,
    deploymentId: deploymentId,
    webAppUrl: webAppUrl,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(ROOT_DIR, 'data/job_tracking_cloud_config.json'),
    JSON.stringify(configOutput, null, 2),
    'utf8'
  );
  console.log('   ✓ Config updated in data/job_tracking_cloud_config.json');
}

main().catch(err => {
  console.error('Failed:', err.message, err.response?.data || '');
});

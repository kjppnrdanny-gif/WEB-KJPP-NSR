import fs from 'fs';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1Hol-8rsthtC_PdY7Rhj0-VS-yZRl2Pyb7bM8kd8uytwms02lzKtbO-vX';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('1. Membaca konten proyek standalone...');
  const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = proj.data.files;

  const manifestIndex = files.findIndex(f => f.name === 'appsscript');
  const manifest = {
    timeZone: 'Asia/Jakarta',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      executeAs: 'USER_DEPLOYING',
      access: 'ANYONE_ANONYMOUS'
    }
  };

  files[manifestIndex].source = JSON.stringify(manifest, null, 2);

  console.log('2. Mengupdate manifest dengan ANYONE_ANONYMOUS...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files }
  });
  console.log('✓ Manifest terupdate!');

  console.log('3. Membuat Versi 2...');
  const ver = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'Staging Versi 2 - Akses Publik Anonymous (Execute as Me)'
    }
  });
  const versionNumber = ver.data.versionNumber;
  console.log('✓ Versi baru:', versionNumber);

  console.log('4. Membuat Deployment Baru...');
  const deploy = await script.projects.deployments.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      versionNumber,
      description: 'Staging Web App v2 Anonymous',
      manifestFileName: 'appsscript'
    }
  });

  const ep = deploy.data.entryPoints?.find(e => e.entryPointType === 'WEB_APP');
  const webAppUrl = ep ? ep.webApp?.url : `https://script.google.com/macros/s/${deploy.data.deploymentId}/exec`;
  console.log('==============================================');
  console.log('🔗 URL WEB APP BARU:', webAppUrl);
  console.log('==============================================');
  fs.writeFileSync('scripts/staging-webapp-url.txt', webAppUrl);
}

main().catch(console.error);

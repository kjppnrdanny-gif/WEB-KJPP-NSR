import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1rhoSmiU3bgTUwJhD5EgmCtHqybAn9oLPyeQaQlw8Ucv14AQHoCbaFvv6';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  const content = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const manifest = content.data.files.find(f => f.name === 'appsscript');
  console.log('Manifest appsscript.json:');
  console.log(manifest.source);

  const deps = await script.projects.deployments.list({ scriptId: SCRIPT_ID });
  console.log('\nDeployments list:');
  for (const d of deps.data.deployments) {
    console.log(JSON.stringify(d, null, 2));
  }
}

main().catch(console.error);

// scripts/init-tracking-database.mjs
import fs from 'fs';
import path from 'path';

async function main() {
  const configPath = path.resolve('data/job_tracking_cloud_config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Config file not found: ' + configPath);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const webAppUrl = config.webAppUrl;
  console.log(`Connecting to GAS Web App: ${webAppUrl}`);

  const targetUrl = `${webAppUrl}?action=setup_database`;
  console.log(`Triggering setup_database at: ${targetUrl}`);

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      redirect: 'follow'
    });

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Raw Response:`, text);

    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Response is not JSON.');
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function testScriptCreate() {
  console.log("Testing script.projects.create...");
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  const res = await script.projects.create({
    requestBody: {
      title: 'GAS-ENGINE-JOB-TRACKING-NSR',
      parentId: '1Rg-1F4sZHvYvSamuvuslyBKN5Xe14_y3u7wn2VjNzbM'
    }
  });

  console.log("SUCCESS! Created script project:", res.data);
  return res.data;
}

testScriptCreate().catch(err => {
  console.error("Script create failed:", err.message);
});

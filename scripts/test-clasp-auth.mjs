import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function testAuth() {
  console.log("Checking Google API authentication via Clasp...");
  const authInfo = await initAuth({});
  console.log("Auth success! Credentials type:", typeof authInfo.credentials);
  
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });
  const about = await drive.about.get({ fields: 'user' });
  console.log("Authenticated User:", about.data.user.emailAddress, "-", about.data.user.displayName);
}

testAuth().catch(err => {
  console.error("Auth test failed:", err);
});

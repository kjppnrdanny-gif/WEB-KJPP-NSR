// scripts/update-concurrency.mjs
import fs from 'fs';

const cpanelYml = '.github/workflows/deploy-cpanel.yml';
let cContent = fs.readFileSync(cpanelYml, 'utf8');
cContent = cContent.replace(
  'group: cpanel-ftp-deploy',
  'group: cpanel-ftp-deploy-prod'
);
fs.writeFileSync(cpanelYml, cContent, 'utf8');
console.log('✓ deploy-cpanel.yml updated with group: cpanel-ftp-deploy-prod');

const stagingYml = '.github/workflows/deploy-staging.yml';
let sContent = fs.readFileSync(stagingYml, 'utf8');
sContent = sContent.replace(
  'group: cpanel-ftp-deploy',
  'group: cpanel-ftp-deploy-staging'
);
fs.writeFileSync(stagingYml, sContent, 'utf8');
console.log('✓ deploy-staging.yml updated with group: cpanel-ftp-deploy-staging');

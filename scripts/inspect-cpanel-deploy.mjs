import fs from 'fs';

if (fs.existsSync('scripts/deploy-code-update.mjs')) {
  console.log(fs.readFileSync('scripts/deploy-code-update.mjs', 'utf8').substring(0, 1000));
}

if (fs.existsSync('.github/workflows')) {
  console.log('Workflows:', fs.readdirSync('.github/workflows'));
}

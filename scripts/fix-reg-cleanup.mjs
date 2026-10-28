import fs from 'fs';

const filePath = 'tests/test-spk-jo-approval-smart-register.mjs';
let content = fs.readFileSync(filePath, 'utf8');

// Also reset baseline 415 in data/official_register_config.json right now
const regConfigPath = 'data/official_register_config.json';
const regConfig = JSON.parse(fs.readFileSync(regConfigPath, 'utf8'));
for (const reg of regConfig) {
  if (reg.id === 'reg_pusat_lp_spk_2026' || reg.id === 'reg_pusat_jo_2026') {
    reg.nomorTerakhir = 415;
    reg.kandidatBerikutnya = '0416';
    reg.nomorTerpakai = [];
  }
}
fs.writeFileSync(regConfigPath, JSON.stringify(regConfig, null, 4));

// In the test script, backup regConfig before test 3.1 and restore after finally
content = content.replace(
  "const dataDir = 'data';\nconst dgFile = `${dataDir}/dual_gate_database.json`;\nlet originalDgRecords = [];\nif (fs.existsSync(dgFile)) {\n  originalDgRecords = JSON.parse(fs.readFileSync(dgFile, 'utf8'));\n}",
  `const dataDir = 'data';
const dgFile = \`\${dataDir}/dual_gate_database.json\`;
const regConfigFile = \`\${dataDir}/official_register_config.json\`;
let originalDgRecords = [];
let originalRegConfig = [];
if (fs.existsSync(dgFile)) {
  originalDgRecords = JSON.parse(fs.readFileSync(dgFile, 'utf8'));
}
if (fs.existsSync(regConfigFile)) {
  originalRegConfig = JSON.parse(fs.readFileSync(regConfigFile, 'utf8'));
}`
);

content = content.replace(
  "  if (originalDgRecords.length > 0) {\n    fs.writeFileSync(dgFile, JSON.stringify(originalDgRecords, null, 2));\n  }\n  phpServer.kill();",
  `  if (originalDgRecords.length > 0) {
    fs.writeFileSync(dgFile, JSON.stringify(originalDgRecords, null, 2));
  }
  if (originalRegConfig.length > 0) {
    fs.writeFileSync(regConfigFile, JSON.stringify(originalRegConfig, null, 4));
  }
  phpServer.kill();`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Restored official_register_config.json baseline 415 and updated test cleanup.');

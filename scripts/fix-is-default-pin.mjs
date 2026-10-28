import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let php = fs.readFileSync(path.join(ROOT_DIR, 'absensi-data-handler.php'), 'utf8');
php = php.replace(
  "$isDefaultPin = ($cleanPin === '123456' || $dbPin === '123456');",
  "$isDefaultPin = ($cleanPin === '123456');"
);
fs.writeFileSync(path.join(ROOT_DIR, 'absensi-data-handler.php'), php, 'utf8');
console.log('absensi-data-handler.php isDefaultPin updated!');

let gas = fs.readFileSync(path.join(ROOT_DIR, 'gas-absensi-Code.gs'), 'utf8');
gas = gas.replace(
  "var isDefaultPin = (cleanPin === '123456' || (dbPin === '123456' && cleanPin === '123456'));",
  "var isDefaultPin = (cleanPin === '123456');"
);
fs.writeFileSync(path.join(ROOT_DIR, 'gas-absensi-Code.gs'), gas, 'utf8');
console.log('gas-absensi-Code.gs isDefaultPin updated!');

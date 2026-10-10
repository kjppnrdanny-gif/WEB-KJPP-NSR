import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const bundlePath = path.join(ROOT_DIR, 'lib/flex-carousel.bundle.js');
let code = fs.readFileSync(bundlePath, 'utf8');

// Replace the comma before if with semicolon
code = code.replace(',if(!this.gl){console.warn("webgl unavailable");return;}this.gl.renderer=this;this.setSize(s,i)', ';if(!this.gl){console.warn("webgl unavailable");return;}this.gl.renderer=this;this.setSize(s,i)');

fs.writeFileSync(bundlePath, code, 'utf8');

// Validate syntax of entire bundle
try {
  new Function(code);
  console.log('✓ Bundle syntax is 100% VALID!');
} catch (e) {
  console.error('Syntax error:', e.message);
}

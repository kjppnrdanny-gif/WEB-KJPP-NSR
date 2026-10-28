import fs from 'fs';
import vm from 'vm';

const content = fs.readFileSync('portal-nolap.html', 'utf8');
const scriptCode = content.slice(1109171 + 8, 1515992);

const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  console: console,
  localStorage: { getItem: () => null, setItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {} },
  navigator: { userAgent: '' }
};
sandbox.window = sandbox;

try {
  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);
  console.log('VM execution successful!');
  console.log('has loginKeServer in sandbox:', typeof sandbox.loginKeServer);
} catch (e) {
  console.error('VM execution ERROR:', e.message);
  console.error(e.stack);
}

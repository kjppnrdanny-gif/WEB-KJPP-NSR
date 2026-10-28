import fs from 'node:fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Expose key functions on window
if (!content.includes('window.verifikasiTokenLogin = verifikasiTokenLogin;')) {
  content = content.replace(
    'async function verifikasiTokenLogin(event) {',
    'window.verifikasiTokenLogin = verifikasiTokenLogin;\n    async function verifikasiTokenLogin(event) {'
  );
}

// 2. Ensure isKing is preserved in userSession across verifikasiTokenLogin and periksaSesiLogin
content = content.replace(
  'isSuperAdmin: info.isSuperAdmin,',
  'isSuperAdmin: Boolean(info.isSuperAdmin || info.isKing || info.role === "SUPER_ADMIN"),\n        isKing: Boolean(info.isKing || info.role === "SUPER_ADMIN"),\n        permissions: info.permissions || [],'
);

content = content.replace(
  'isSuperAdmin: auth.isSuperAdmin,',
  'isSuperAdmin: Boolean(auth.isSuperAdmin || auth.isKing || auth.role === "SUPER_ADMIN"),\n          isKing: Boolean(auth.isKing || auth.role === "SUPER_ADMIN"),\n          permissions: auth.permissions || [],'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Updated session king fields and window exposure!');

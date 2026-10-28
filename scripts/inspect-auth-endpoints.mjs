import fs from 'fs';

const c = fs.readFileSync('auth-handler.php', 'utf8');

function showSection(name, searchStr) {
  const idx = c.indexOf(searchStr);
  console.log(`=== ${name} ===`);
  if (idx !== -1) {
    console.log(c.slice(idx, idx + 800));
  } else {
    console.log('Not found');
  }
}

showSection('LOGOUT', "action === 'logout'");
showSection('VERIFY', "action === 'verify'");
showSection('LOGIN', "action === 'login'");

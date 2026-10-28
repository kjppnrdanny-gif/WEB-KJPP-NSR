import fs from 'fs';

const auth = fs.readFileSync('auth-handler.php', 'utf8');
console.log('auth contains resolveServerToken:', auth.includes('function resolveServerToken'));
console.log('auth contains action === logout:', auth.includes("action === 'logout'"));

const nolap = fs.readFileSync('nolap-data-handler.php', 'utf8');
console.log('nolap contains resolveKodeIndustri:', nolap.includes('function resolveKodeIndustri'));
console.log('nolap contains targetSektor penilaiIzin 1:', nolap.includes('{$targetSektor}/{$penilaiIzin}/1/'));
console.log('nolap contains revisiPeriodeBulanResmi:', nolap.includes('revisiPeriodeBulanResmi'));

const portalNolap = fs.readFileSync('portal-nolap.html', 'utf8');
console.log('portal-nolap contains elIndustri?.value || "07":', portalNolap.includes('elIndustri?.value || "07"'));
console.log('portal-nolap contains NSR_AUTH_TOKEN:', portalNolap.includes('NSR_AUTH_TOKEN'));

const cabang = fs.readFileSync('portal-nolap-cabang.html', 'utf8');
console.log('cabang contains /1/ romawi:', cabang.includes("/1/' + romawi"));

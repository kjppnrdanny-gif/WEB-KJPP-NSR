import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production');

// 1. UPDATE nolap-data-handler.php: Add Admin Tokens for Padang, Makassar, Palembang
const handlerPath = path.join(projectRoot, 'nolap-data-handler.php');
let handler = fs.readFileSync(handlerPath, 'utf8');

const adminBdgAnchor = `'abbb9d2669adcecef0d82399492141940292dd0eaf358066adacacfb1d0c3545' => [`;
const adminCabangTokens = `    // Token Header: NSR-ADMIN-PDG-2026 (Admin Cabang Padang)
    'f63bdd87f28f4056a4908dce3af971bacacd9f30c01bed71937c2d3e07c5802f' => [
        'sub'               => 'admin_cabang_pdg',
        'branch'            => 'Padang',
        'displayName'       => 'Admin Kantor Cabang Padang',
        'nama'              => 'Admin Kantor Cabang Padang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Padang',
        'wilayah'           => 'Padang',
        'wilayahLabel'      => 'Kantor Cabang Padang',
        'wilayahCode'       => 'PDG',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.0160-02',
        'permissions'       => ['branch.submit', 'branch.view', 'opr.view', 'opr.submit']
    ],
    // Token Header: NSR-ADMIN-MKS-2026 (Admin Cabang Makassar)
    'a42251700723119e220d38ac7d4c4eb4326024b700ed16f67a5c277e91b4e84b' => [
        'sub'               => 'admin_cabang_mks',
        'branch'            => 'Makassar',
        'displayName'       => 'Admin Kantor Cabang Makassar',
        'nama'              => 'Admin Kantor Cabang Makassar',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Makassar',
        'wilayah'           => 'Makassar',
        'wilayahLabel'      => 'Kantor Cabang Makassar',
        'wilayahCode'       => 'MKS',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.0160-03',
        'permissions'       => ['branch.submit', 'branch.view', 'opr.view', 'opr.submit']
    ],
    // Token Header: NSR-ADMIN-PLB-2026 (Admin Cabang Palembang)
    '1372dacd912b7b01c3261d4cc5acdc24ec7c78aba808a2eae105ec9052cf3a79' => [
        'sub'               => 'admin_cabang_plb',
        'branch'            => 'Palembang',
        'displayName'       => 'Admin Kantor Cabang Palembang',
        'nama'              => 'Admin Kantor Cabang Palembang',
        'role'              => 'ADMIN_CABANG',
        'roleLabel'         => 'Admin Cabang Palembang',
        'wilayah'           => 'Palembang',
        'wilayahLabel'      => 'Kantor Cabang Palembang',
        'wilayahCode'       => 'PLB',
        'isSuperAdmin'      => false,
        'isKing'            => false,
        'isCabang'          => true,
        'canAccessKwitansi' => true,
        'canApprove'        => false,
        'canSubmit'         => true,
        'seeFee'            => true,
        'mode'              => 'CABANG',
        'kodeKemenkeu'      => '2.0160-05',
        'permissions'       => ['branch.submit', 'branch.view', 'opr.view', 'opr.submit']
    ],\n`;

if (!handler.includes('admin_cabang_pdg') && handler.includes(adminBdgAnchor)) {
  handler = handler.replace(adminBdgAnchor, adminCabangTokens + '    ' + adminBdgAnchor);
  console.log('✔ Added Admin tokens for Padang, Makassar, and Palembang to nolap-data-handler.php');
  fs.writeFileSync(handlerPath, handler, 'utf8');
}

// 2. UPDATE portal-penugasan-jo.html: Remove remaining "- Terkunci Cabang"
const portalPath = path.join(projectRoot, 'portal-penugasan-jo.html');
let portal = fs.readFileSync(portalPath, 'utf8');

portal = portal.replace(/selRekan\.innerHTML = `<option value="\$\{partner\.nama\}">\$\{partner\.nama\} \(\$\{partner\.jabatan\}\) - Terkunci Cabang<\/option>`;\s*selRekan\.value = partner\.nama;\s*selRekan\.disabled = false;\s*vlookupRekan\(\);/g, 'populateDropdownRekan(partner?.nama);');

portal = portal.replace(/selRekan\.innerHTML = `<option value="\$\{partner\.nama\}">\$\{partner\.nama\} \(\$\{partner\.jabatan\}\) - Terkunci Cabang<\/option>`;\s*selRekan\.value = partner\.nama;\s*selRekan\.disabled = false;/g, 'populateDropdownRekan(partner?.nama);');

// Direct string replace for any stray "- Terkunci Cabang"
portal = portal.replace(/ - Terkunci Cabang/g, '');

fs.writeFileSync(portalPath, portal, 'utf8');
console.log('✔ Removed all occurrences of "- Terkunci Cabang" in portal-penugasan-jo.html');

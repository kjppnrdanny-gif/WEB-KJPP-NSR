import fs from 'fs';

let content = fs.readFileSync('data/config/credentials.secrets.php', 'utf8');

const keyToAdd = `    'crypto_secret_key' => 'f9cfdf6917d2722e3fa0ec3e77a3e312888fdc5fb248a899afaaceb1548d1c9b',
    'signer_vault' => [
        'NANANG' => [
            'id' => 'nanang_penilai',
            'nama' => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
            'izin' => 'P-1.15.00412',
            'role' => 'Pemimpin Rekan',
            'password_hash' => '$2y$10$/fgTYdYGaWfnUIQAqLonD.HNOg/9v2t1HqCY62H1KLhleHc9RpVem'
        ],
        'DENI' => [
            'id' => 'deni_penilai',
            'nama' => 'Deni Siswandi, S.T., MAPPI (Cert.)',
            'izin' => 'P-1.20.00581',
            'role' => 'Rekan / Pimpinan Cabang Bandung',
            'password_hash' => '$2y$10$yJCStT23r6GmZ6aIkkl2me.1vUjmhTFSZBn17Ase4Je9R/kx4AXjW'
        ]
    ],
`;

if (!content.includes('signer_vault')) {
  content = content.replace("return [", "return [\n" + keyToAdd);
  fs.writeFileSync('data/config/credentials.secrets.php', content, 'utf8');
  console.log('Added crypto_secret_key and signer_vault to credentials.secrets.php!');
} else {
  console.log('signer_vault already in credentials.secrets.php');
}

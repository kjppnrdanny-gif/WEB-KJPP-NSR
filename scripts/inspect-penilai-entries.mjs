import fs from 'fs';

const registryLoader = fs.readFileSync('auth-registry-loader.php', 'utf8');

const printEntry = (sub) => {
  const idx = registryLoader.indexOf(`'sub'               => '${sub}'`);
  if (idx !== -1) {
    console.log(`--- ENTRY FOR ${sub} ---`);
    console.log(registryLoader.substring(idx - 100, idx + 800));
  }
};

printEntry('nanang_penilai');
printEntry('deni_penilai');

import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('Total lines in index.html:', lines.length);

lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (
    trimmed.startsWith('<header') ||
    trimmed.startsWith('<nav') ||
    trimmed.startsWith('<main') ||
    trimmed.startsWith('<section') ||
    trimmed.startsWith('<footer') ||
    trimmed.includes('id="hero') ||
    trimmed.includes('id="profil') ||
    trimmed.includes('id="layanan') ||
    trimmed.includes('id="spm') ||
    trimmed.includes('id="mutu') ||
    trimmed.includes('id="rekanan') ||
    trimmed.includes('id="portofolio') ||
    trimmed.includes('id="cloud') ||
    trimmed.includes('id="legalitas') ||
    trimmed.includes('id="kantor') ||
    trimmed.includes('id="kontak') ||
    trimmed.includes('<!-- HERO') ||
    trimmed.includes('<!-- PROFIL') ||
    trimmed.includes('<!-- LAYANAN') ||
    trimmed.includes('<!-- SPM') ||
    trimmed.includes('<!-- SISTEM PENGENDALIAN MUTU') ||
    trimmed.includes('<!-- REKANAN') ||
    trimmed.includes('<!-- PORTOFOLIO') ||
    trimmed.includes('<!-- CLOUD') ||
    trimmed.includes('<!-- LEGALITAS') ||
    trimmed.includes('<!-- KANTOR') ||
    trimmed.includes('<!-- KONTAK') ||
    trimmed.includes('<!-- MODAL')
  ) {
    console.log(`${idx + 1}: ${trimmed.slice(0, 110)}`);
  }
});

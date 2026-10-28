import fs from 'fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const regex = /<select[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  const id = match[1];
  const body = match[2];
  if (body.includes('Properti') || body.includes('PI') || body.includes('Bisnis') || id.toLowerCase().includes('jasa') || id.toLowerCase().includes('klasifikasi')) {
    console.log('Select ID:', id);
    console.log(body.substring(0, 300).trim());
    console.log('--------------------');
  }
}

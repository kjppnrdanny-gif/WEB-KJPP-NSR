import fs from 'fs';

const buf = fs.readFileSync('C:\\Users\\HP\\AppData\\Local\\Temp\\ChromeHistoryCopy');
const text = buf.toString('latin1');

const webAppIds = [
  'AKfycbwp15BykI7yuUeSTn2VHs_aZvIUIQIzirrzqJ2yVG7CvmeLbmVEOrLyDkGIQimtFIMG',
  'AKfycbxSSby0-VHIYfV8Ne9WN-A1gMNQKzb10hEc18wJeOdBq5lNWMFGaMBNbf76Q_iPgHC7Rw',
  'AKfycbxz9dPEVnpoT_ep2DkmSQv7BMP0lJ2bitq9oGk-ui_BHqCsVh7K7AusuBsK5uJOoMoN1g',
  'AKfycbwQMbJ18me_xBwUVX_6L-n9sbt99KXfvM_MkZOeMWpvLf-PDwFQYETFu1x2rbp7Al8iYw',
  'AKfycbzw6AlL6g58jG4cyx1euoC1kYe1cYqY7n2At5-sT8knQDCNe_TQxN8g6jDNrULOBUq32A',
  'AKfycbwEKwmEqN_6yLzaoJVAKFmae3wCAXkPQ6c-0tlmGx41iEAyuI0cv2FSdL8buYIyPmuYHQ',
  'AKfycbwS-QoXHX1MTJQPhYIT44dJgvRQDZytzirmogdH7yDeV2Q3hKG1Y_EdDJpYmDNXwOsHsg',
  'AKfycbxz8Jwc_ALShmrJycXcENhORvKL-lE0IfGvLUs7KC6j5Qlu1qYvSeF6bsdSz0Sc3K3kaw',
  'AKfycbyZK-npOan63-XsV5ABRqN7V1bJK1u9osXwJORl8iJDEgwiugI_YHJ33tPtz0BDa1lp'
];

for (const id of webAppIds) {
  let idx = 0;
  console.log(`\n--- ID: ${id.substring(0, 15)}... ---`);
  while ((idx = text.indexOf(id, idx)) !== -1) {
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + 200);
    const snippet = text.slice(start, end).replace(/[\x00-\x1f]/g, ' ');
    console.log('Snippet:', snippet);
    idx += id.length;
  }
}

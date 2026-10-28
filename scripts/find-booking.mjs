import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

const regex = /BOOKING|bukaModalFinalisasiBooking|autoFillBookingData|submitFinalisasiBooking/gi;
let m;
const occurrences = [];
while ((m = regex.exec(content)) !== null) {
  const lineNo = content.slice(0, m.index).split('\n').length;
  occurrences.push({ line: lineNo, index: m.index, snippet: content.slice(Math.max(0, m.index - 50), m.index + 80).replace(/\r?\n/g, ' ') });
}
console.log('Occurrences of Booking:', occurrences.length);
console.log(occurrences.slice(0, 15));

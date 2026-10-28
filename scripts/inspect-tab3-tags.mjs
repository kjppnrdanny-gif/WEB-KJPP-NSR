import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const idxTab3 = content.indexOf('id="tab-3"');
const idxEndTab3 = content.indexOf('<!-- Modal Approval Pusat', idxTab3);
console.log('HTML inside #tab-3 (length: ' + (idxEndTab3 - idxTab3) + '):');
const tab3Html = content.slice(idxTab3, idxEndTab3 > -1 ? idxEndTab3 : idxTab3 + 10000);

// Let's print the major elements inside tab-3
const tagMatches = [];
const lines = tab3Html.split('\n');
lines.forEach((l, i) => {
  if (/<(div|section|form|select|button|h\d)[^>]+id=["'][^"']+["']/i.test(l) || /class="[^"]*border[^"]*"/i.test(l)) {
    tagMatches.push(`L${i+1}: ${l.trim().slice(0, 100)}`);
  }
});
console.log('Key tags inside tab-3:');
console.log(tagMatches.slice(0, 40));

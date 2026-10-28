import fs from 'fs';

let c = fs.readFileSync('portal-nolap.html', 'utf8');
const isCrlf = c.includes('\r\n');
const target = '  <!-- ==================== MODAL REVIEW GERBANG 2: SPM & DIVTEK ==================== -->\n  <div id="modal-review-gerbang2" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">\n    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs">';
const repl = '  <!-- ==================== MODAL REVIEW GERBANG 2: SPM & DIVTEK ==================== -->\n  <div id="modal-review-gerbang2" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">\n    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl lg:max-w-4xl w-full p-6 sm:p-7 space-y-4 shadow-2xl text-xs my-auto max-h-[90vh] overflow-y-auto">';
const normTarget = isCrlf ? target.replace(/\n/g, '\r\n') : target;
const normRepl = isCrlf ? repl.replace(/\n/g, '\r\n') : repl;

if (c.includes(normTarget)) {
  c = c.replace(normTarget, normRepl);
  fs.writeFileSync('portal-nolap.html', c, 'utf8');
  console.log('✓ Successfully widened modal-review-gerbang2');
} else {
  console.log('! Target not found');
}

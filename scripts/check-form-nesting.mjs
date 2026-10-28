import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const idxTabForm = content.indexOf('id="tab-content-form"');
const idxFormTag = content.indexOf('id="form-penugasan"');
const idxTabDash = content.indexOf('id="tab-content-dashboard"');
const idxTab3 = content.indexOf('id="tab-3"');

console.log('tab-content-form start:', idxTabForm);
console.log('form-penugasan start:', idxFormTag);
console.log('tab-content-dashboard start:', idxTabDash);
console.log('tab-3 start:', idxTab3);

// Let's trace div nesting from tab-content-form to tab-content-dashboard
const sliceForm = content.slice(idxTabForm, idxTabDash);
const openDivs = (sliceForm.match(/<div(\s|>)/gi) || []).length;
const closeDivs = (sliceForm.match(/<\/div>/gi) || []).length;
console.log('In sliceForm: open <div> =', openDivs, ', close </div> =', closeDivs);

// Where is </form>?
let formClosePos = sliceForm.indexOf('</form>');
console.log('</form> found in sliceForm at:', formClosePos);
if (formClosePos === -1) {
  console.log('</form> NOT IN sliceForm! Searching entire file...');
  let pos = 0;
  while ((pos = content.indexOf('</form>', pos)) !== -1) {
    console.log('</form> at:', pos);
    pos += 7;
  }
}

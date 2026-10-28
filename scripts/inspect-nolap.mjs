import fs from 'fs';

const content = fs.readFileSync('portal-nolap.html', 'utf8');

// Find tab structure in portal-nolap.html
const tabs = content.match(/id=["'](tab-[^"']+|tab-content-[^"']+)["']/g);
console.log('Tabs in portal-nolap:', tabs);

// Find modal approval or approval functions
const apprFuncs = content.match(/function\s+([a-zA-Z0-9_]*(?:approve|Approval|Register|NoLap|Nomor|Booking)[a-zA-Z0-9_]*)/gi);
console.log('Approval functions:', [...new Set(apprFuncs)]);

// Find modal with approval or register
const modals = content.match(/id=["'](modal-[^"']+)["']/g);
console.log('Modals in portal-nolap:', modals);

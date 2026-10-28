import fs from 'node:fs';

const orig = fs.readFileSync('index.html', 'utf8');

const galeriStart = orig.lastIndexOf('<section', orig.indexOf('id="galeri"'));
const manajemenStart = orig.lastIndexOf('<section', orig.indexOf('id="manajemen"'));
const fullGaleri = orig.substring(galeriStart, manajemenStart);

const flexEndComment = '<!-- Interactive WebGL 3D FlexCarousel Component -->';
const flexEndIdx = fullGaleri.indexOf(flexEndComment);
const flexClosingDiv = fullGaleri.indexOf('</div>\r\n      </div>', flexEndIdx) !== -1 
  ? fullGaleri.indexOf('</div>\r\n      </div>', flexEndIdx) + '</div>\r\n      </div>'.length
  : fullGaleri.indexOf('</div>\n      </div>', flexEndIdx) + '</div>\n      </div>'.length;

const footerBoxComment = '<!-- Footer Info Box & Direct Link ke Galeri Lengkap -->';
const footerBoxIdx = fullGaleri.indexOf(footerBoxComment);
const sectionEndIdx = fullGaleri.lastIndexOf('</section>') + '</section>'.length;

const streamlinedGaleri = fullGaleri.substring(0, flexClosingDiv) + '\r\n\r\n      ' + fullGaleri.substring(footerBoxIdx, sectionEndIdx);

console.log('Original galeri length:', fullGaleri.length);
console.log('Streamlined galeri length:', streamlinedGaleri.length);
console.log('Streamlined galeri ends with:</section>?', streamlinedGaleri.trim().endsWith('</section>'));

// Check div balance in streamlinedGaleri
const openDivs = (streamlinedGaleri.match(/<div\b/g) || []).length;
const closeDivs = (streamlinedGaleri.match(/<\/div>/g) || []).length;
console.log(`Divs in streamlinedGaleri: open=${openDivs}, close=${closeDivs}`);

import fs from 'node:fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove duplicate second blob block
const dupBlobBlock = `
      const blob = new Blob(['\\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
    }`;

content = content.replace(dupBlobBlock, '');

// 2. Remove extra </div> before </body> in wordHtml
content = content.replace('</div>\r\n</div>\r\n</body>\r\n</html>', '</div>\r\n</body>\r\n</html>');
content = content.replace('</div>\n</div>\n</body>\n</html>', '</div>\n</body>\n</html>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Cleaned duplicate blob block and extra div!');

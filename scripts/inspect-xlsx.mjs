import fs from 'fs';
import path from 'path';

// Let's use python or powershell or node to inspect the xlsx sheets
const xlsxPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\.user_uploaded\\media_1792777876315_fb87e526.xlsx';
console.log('Xlsx exists:', fs.existsSync(xlsxPath));

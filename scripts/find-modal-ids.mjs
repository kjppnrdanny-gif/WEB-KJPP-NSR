import fs from 'fs';

const indexHtml = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/index.html', 'utf8');

const modalMatches = indexHtml.match(/id=["'][^"']*modal[^"']*["']/gi) || [];
console.log('Modals in index.html:', modalMatches);

// Search for token input or login button
const tokenMatches = indexHtml.match(/<input[^>]*token[^>]*>/gi) || [];
console.log('Token inputs in index.html:', tokenMatches);

const buttonMatches = indexHtml.match(/<button[^>]*opini[^>]*>/gi) || [];
console.log('Opini buttons in index.html:', buttonMatches);

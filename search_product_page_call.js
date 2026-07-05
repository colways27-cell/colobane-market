import fs from 'fs';

const content = fs.readFileSync('./src/pages/ProductPage.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search call / phone logic in ProductPage.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('tel:') || line.includes('phone') || line.includes('Appeler') || line.includes('contact')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});

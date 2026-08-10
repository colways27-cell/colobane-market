import fs from 'fs';

const content = fs.readFileSync('./src/pages/Home.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search Boutiques in Home.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('Boutiques') || line.includes('boutiques') || line.includes('Store') || line.includes('Boutique')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});

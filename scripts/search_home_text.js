import fs from 'fs';

const content = fs.readFileSync('./src/pages/Home.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search headers in Home.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('<h1>') || line.includes('<h2>') || line.includes('<h3>') || line.includes('Que recherchez-vous') || line.includes('Acheter & Vendre')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});

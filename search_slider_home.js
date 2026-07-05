import fs from 'fs';

const content = fs.readFileSync('./src/pages/Home.jsx', 'utf8');
const lines = content.split('\n');

console.log('--- Search slider in Home.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('Trouvez des articles') || line.includes('DISPONIBLE PARTOUT') || line.includes('slider') || line.includes('carousel')) {
    console.log(`L${index + 1}: ${line.trim()}`);
  }
});
